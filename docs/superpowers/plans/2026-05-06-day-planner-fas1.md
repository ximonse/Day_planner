# Day Planner — Implementation Plan Fas 1 MVP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg Fas 1 MVP av Day Planner — SvelteKit-app med 1h rullande klocka, 12h dagsklocka, vänster sidebar, höger agenda och texteditor för hierarkisk dagsplanering.

**Architecture:** En SvelteKit-sida med tre kollapsibla paneler (sidebar, klocka, agenda). All state härleds från en rå `.md`-textsträng som parsas till blocks med parts. Klockan renderas som SVG i antingen 1h- eller 12h-läge. Drag-to-adjust stöds i båda lägena.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Vitest, @sveltejs/adapter-vercel, CSS custom properties (inget ramverk). Inga `backdrop-filter`, SVG-filter eller CSS-animationer utan `prefers-reduced-motion`-guard (CleverTouch-krav).

---

## Filkarta

```
src/
  lib/
    types.ts                    — delade TypeScript-interface
    theme.ts                    — 6 paletter, CSS-vars, clockTheme()
    parse.ts                    — .md-text → Block[] med Part[]
    state.svelte.ts             — AppState med Svelte 5 runes + localStorage
    telemetry.ts                — SessionEvent → sessionStorage
    clock/
      geometry.ts               — SVG-geometrihjälpare (arcPath, angles)
      drag.ts                   — pointer-drag för 1h och 12h
    __tests__/
      setup.ts
      parse.test.ts
      geometry.test.ts
  components/
    Clock.svelte                — wrapper, 1h/12h-toggle
    Clock1h.svelte              — 1h donut SVG
    Clock12h.svelte             — 12h rullande donut SVG
    Sidebar.svelte              — vänster panel, scroll-fokus
    Agenda.svelte               — höger panel, vertikal tidslinje
    Editor.svelte               — kollapsbar textarea
  routes/
    +layout.svelte              — global CSS, temadefinitioner
    +page.svelte                — huvudvy
svelte.config.js
vite.config.ts
tsconfig.json
.env.example
vercel.json
```

---

### Task 1: Projektscaffold

**Files:**
- Create: `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `package.json`
- Create: `src/lib/__tests__/setup.ts`
- Create: `.env.example`

- [ ] **Steg 1: Initiera SvelteKit**

Kör i `C:\Users\ximon\Kodprojekt\day_planner`:
```bash
npx sv create . --template minimal --types ts
```
Välj TypeScript när det frågas. Hoppa över prettier/eslint.

- [ ] **Steg 2: Installera beroenden**

```bash
npm install
npm install @sveltejs/adapter-vercel
npm install -D vitest @testing-library/svelte @testing-library/jest-dom jsdom
```

- [ ] **Steg 3: Konfigurera adapter-vercel i svelte.config.js**

Ersätt hela `svelte.config.js`:
```javascript
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: { '$components': path.resolve('./src/components') }
  }
};
```

- [ ] **Steg 4: Konfigurera Vitest i vite.config.ts**

Ersätt hela `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/lib/__tests__/setup.ts']
  }
});
```

- [ ] **Steg 5: Skapa testsetup**

Skapa `src/lib/__tests__/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

- [ ] **Steg 6: Skapa .env.example**

Skapa `.env.example`:
```
# Upstash Redis — behövs ej för Fas 1 MVP
DAYPLANNER_KV_REST_API_URL=
DAYPLANNER_KV_REST_API_TOKEN=
```

- [ ] **Steg 7: Verifiera**

```bash
npm run dev
```
Förväntat: Server startar på localhost:5173 utan fel.

- [ ] **Steg 8: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold SvelteKit with adapter-vercel and vitest"
```

---

### Task 2: Typer

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Steg 1: Skriv types.ts**

Skapa `src/lib/types.ts`:
```typescript
export type Palette = 'sansad' | 'meadow' | 'mlp' | 'bright' | 'clear' | 'psychedelic';
export type ClockMode = '1h' | '12h';

export interface Part {
  id: string;
  title: string;
  minutes: number;
  pinned: boolean;
  note: string;
  warning: boolean;
}

export interface Block {
  id: string;
  title: string;
  startMin: number;  // minuter sedan midnatt
  endMin: number;
  parts: Part[];
}

export interface AppState {
  palette: Palette;
  dark: boolean;
  source: string;
  clockMode: ClockMode;
  showSidebar: boolean;
  showAgenda: boolean;
  showEditor: boolean;
}

export interface ClockTheme {
  bg: string;
  dimSuffix: string;
  mark: string;
  centerMain: string;
  centerMuted: string;
  handDark: string;
  handLight: string;
  chip: string;
}

export interface SessionEvent {
  ts: number;
  type: 'block_start' | 'block_end' | 'drag' | 'plan_loaded';
  blockId: string;
  plannedMin?: number;
  actualMin?: number;
  delta?: number;
}
```

- [ ] **Steg 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: Tema

**Files:**
- Create: `src/lib/theme.ts`

- [ ] **Steg 1: Skriv theme.ts**

Skapa `src/lib/theme.ts`:
```typescript
import type { Palette, ClockTheme } from './types';

export const SECTOR_COLORS: Record<Palette, string[]> = {
  sansad:      ['#e07a5f','#3d405b','#81b29a','#f2cc8f','#c05840','#6a6e90','#5a9278','#d8b870'],
  meadow:      ['#fb6107','#f3de2c','#7cb518','#5c8001','#fbb02d','#d94e05','#a0d028','#f09010'],
  mlp:         ['#cdb4db','#ffc8dd','#ffafcc','#bde0fe','#a2d2ff','#b898d0','#ff90b8','#80c8f8'],
  bright:      ['#f9c80e','#f86624','#ea3546','#662e9b','#43bccd','#d4a808','#c44818','#8840c0'],
  clear:       ['#5f0f40','#9a031e','#fb8b24','#e36414','#0f4c5c','#8a1560','#c20428','#d46010'],
  psychedelic: ['#ff00ff','#ff0000','#ff8800','#ffff00','#00ff44','#00ffff','#4400ff','#ff00aa'],
};

export const CSS_VARS: Record<Palette, Record<string, string>> = {
  sansad:      { '--bg':'#f4f1de','--fg':'#3d405b','--panel':'#ece9d5','--border':'#c8c5b5','--muted':'#81b29a','--accent':'#e07a5f','--pill':'#e8e5d8','--pill-on':'#3d405b','--pill-on-fg':'#f4f1de','--void':'#3d405b' },
  meadow:      { '--bg':'#f4f1de','--fg':'#2a3a10','--panel':'#e5e8d0','--border':'#a8c080','--muted':'#5c8001','--accent':'#fb6107','--pill':'#e5e8d8','--pill-on':'#5c8001','--pill-on-fg':'#f4f1de','--void':'#2a3a10' },
  mlp:         { '--bg':'#fff5fb','--fg':'#5a3070','--panel':'#f8eaf8','--border':'#d4a0e8','--muted':'#8080b0','--accent':'#ffafcc','--pill':'#f0e0f8','--pill-on':'#cdb4db','--pill-on-fg':'#5a3070','--void':'#5a3070' },
  bright:      { '--bg':'#f4f1de','--fg':'#1a0820','--panel':'#e8e5d8','--border':'#c0a0b8','--muted':'#662e9b','--accent':'#f86624','--pill':'#e8e5d8','--pill-on':'#662e9b','--pill-on-fg':'#f4f1de','--void':'#1a0820' },
  clear:       { '--bg':'#f9f2ee','--fg':'#5f0f40','--panel':'#ede5e0','--border':'#c09888','--muted':'#0f4c5c','--accent':'#fb8b24','--pill':'#ede5e0','--pill-on':'#5f0f40','--pill-on-fg':'#f9f2ee','--void':'#5f0f40' },
  psychedelic: { '--bg':'#220033','--fg':'#ffffff','--panel':'rgba(255,255,0,0.12)','--border':'#ff00ff','--muted':'#ffff00','--accent':'#ff00ff','--pill':'rgba(0,255,255,0.15)','--pill-on':'#ffff00','--pill-on-fg':'#000000','--void':'#050010' },
};

export const DARK_VARS: Record<string, string> = {
  '--bg':'#1c1a16','--fg':'#ede8dc','--panel':'#26231e','--border':'#3c3830',
  '--muted':'#8a8478','--accent':'#ede8dc','--pill':'#2e2b26',
  '--pill-on':'#ede8dc','--pill-on-fg':'#1c1a16','--void':'#0e0d0b',
};

const DARK_CLOCK: ClockTheme = {
  bg:'#1c1a16', dimSuffix:'55', mark:'#c8c4bc',
  centerMain:'#ede8dc', centerMuted:'#8a8478',
  handDark:'#ede8dc', handLight:'#1c1a16', chip:'#1c1a16dd',
};

const DAY_CLOCKS: Record<Palette, ClockTheme> = {
  sansad:      { bg:'#f4f1de', dimSuffix:'40', mark:'#3d405b', centerMain:'#3d405b', centerMuted:'#81b29a', handDark:'#3d405b', handLight:'#f4f1de', chip:'#ffffffee' },
  meadow:      { bg:'#f4f1de', dimSuffix:'40', mark:'#2a3a10', centerMain:'#2a3a10', centerMuted:'#5c8001', handDark:'#2a3a10', handLight:'#f4f1de', chip:'#ffffffee' },
  mlp:         { bg:'#fff5fb', dimSuffix:'40', mark:'#5a3070', centerMain:'#5a3070', centerMuted:'#8080b0', handDark:'#5a3070', handLight:'#fff5fb', chip:'#ffffffee' },
  bright:      { bg:'#f4f1de', dimSuffix:'40', mark:'#1a0820', centerMain:'#1a0820', centerMuted:'#662e9b', handDark:'#1a0820', handLight:'#f4f1de', chip:'#ffffffee' },
  clear:       { bg:'#f9f2ee', dimSuffix:'40', mark:'#5f0f40', centerMain:'#5f0f40', centerMuted:'#0f4c5c', handDark:'#5f0f40', handLight:'#f9f2ee', chip:'#ffffffee' },
  psychedelic: { bg:'#00000066', dimSuffix:'66', mark:'#ffffff', centerMain:'#ffffff', centerMuted:'#ffff00', handDark:'#ffffff', handLight:'#00001a', chip:'#00000088' },
};

export function clockTheme(palette: Palette, dark: boolean): ClockTheme {
  if (palette === 'psychedelic') return DAY_CLOCKS.psychedelic;
  return dark ? DARK_CLOCK : DAY_CLOCKS[palette];
}

export function applyCssVars(palette: Palette, dark: boolean): string {
  const base = CSS_VARS[palette];
  const vars = (dark && palette !== 'psychedelic') ? { ...base, ...DARK_VARS } : base;
  return Object.entries(vars).map(([k, v]) => `${k}: ${v}`).join('; ');
}
```

- [ ] **Steg 2: Commit**

```bash
git add src/lib/theme.ts
git commit -m "feat: add theme system with 6 palettes"
```

---

### Task 4: Parser (TDD)

**Files:**
- Create: `src/lib/parse.ts`
- Create: `src/lib/__tests__/parse.test.ts`

- [ ] **Steg 1: Skriv failing tests**

Skapa `src/lib/__tests__/parse.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { parseSource } from '../parse';

describe('parseSource', () => {
  it('parses block with start time', () => {
    const [b] = parseSource('#Morgon 06:05\nVakna\n');
    expect(b.title).toBe('Morgon');
    expect(b.startMin).toBe(365);
  });

  it('sets endMin from next block startMin', () => {
    const [a, b] = parseSource('#A 06:00\nDel\n\n#B 06:30\nDel\n');
    expect(a.endMin).toBe(390);
    expect(b.startMin).toBe(390);
  });

  it('defaults endMin to startMin + 60 for last block', () => {
    const [a] = parseSource('#A 08:00\nDel\n');
    expect(a.endMin).toBe(540);
  });

  it('respects explicit HH:MM-HH:MM', () => {
    const [b] = parseSource('#Start 07:45-08:00\nDel\n');
    expect(b.startMin).toBe(465);
    expect(b.endMin).toBe(480);
  });

  it('parses pinned part minutes', () => {
    const [b] = parseSource('#A 06:00\nPacka 10m\n');
    expect(b.parts[0].title).toBe('Packa');
    expect(b.parts[0].minutes).toBe(10);
    expect(b.parts[0].pinned).toBe(true);
  });

  it('auto-distributes minutes among unpinned parts', () => {
    const [b] = parseSource('#A 06:00-06:30\nDel1\nDel2\n');
    expect(b.parts[0].minutes).toBe(15);
    expect(b.parts[1].minutes).toBe(15);
  });

  it('parses note lines', () => {
    const [b] = parseSource('#A 06:00\nDel\n- anteckning\n');
    expect(b.parts[0].note).toBe('anteckning');
  });

  it('gives unique ids to parts', () => {
    const [b] = parseSource('#A 06:00\nDel1\nDel2\n');
    expect(b.parts[0].id).not.toBe(b.parts[1].id);
  });
});
```

- [ ] **Steg 2: Kör — verifiera att de failar**

```bash
npx vitest run src/lib/__tests__/parse.test.ts
```
Förväntat: FAIL — "Cannot find module '../parse'"

- [ ] **Steg 3: Implementera parse.ts**

Skapa `src/lib/parse.ts`:
```typescript
import type { Block, Part } from './types';

function parseTime(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function parseSource(source: string): Block[] {
  const lines = source.split('\n');
  const blocks: Block[] = [];
  let current: Block | null = null;
  let lastPart: Part | null = null;
  const explicitEnd = new Set<string>();

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#')) {
      const m = line.match(/^#(.+?)\s+(\d{2}:\d{2})(?:-(\d{2}:\d{2}))?$/);
      if (!m) continue;
      const id = uid();
      current = {
        id,
        title: m[1].trim(),
        startMin: parseTime(m[2]),
        endMin: m[3] ? parseTime(m[3]) : parseTime(m[2]) + 60,
        parts: [],
      };
      if (m[3]) explicitEnd.add(id);
      blocks.push(current);
      lastPart = null;
      continue;
    }

    if (!current) continue;

    if (line.startsWith('- ')) {
      if (lastPart) lastPart.note = line.slice(2).trim();
      continue;
    }

    const minuteMatch = line.match(/^(.+?)\s+(\d+)m$/);
    const part: Part = {
      id: uid(),
      title: minuteMatch ? minuteMatch[1].trim() : line,
      minutes: minuteMatch ? parseInt(minuteMatch[2]) : 0,
      pinned: !!minuteMatch,
      note: '',
      warning: false,
    };
    current.parts.push(part);
    lastPart = part;
  }

  // Sätt endMin från nästa blocks startMin (om inte explicit)
  for (let i = 0; i < blocks.length - 1; i++) {
    if (!explicitEnd.has(blocks[i].id)) {
      blocks[i].endMin = blocks[i + 1].startMin;
    }
  }

  // Auto-fördela minuter bland unpinned parts
  for (const block of blocks) {
    const total = block.endMin - block.startMin;
    const pinnedSum = block.parts.filter(p => p.pinned).reduce((s, p) => s + p.minutes, 0);
    const unpinned = block.parts.filter(p => !p.pinned);
    const each = unpinned.length > 0 ? Math.max(1, Math.floor((total - pinnedSum) / unpinned.length)) : 0;
    for (const p of unpinned) p.minutes = each;
  }

  return blocks;
}
```

- [ ] **Steg 4: Kör — verifiera att de passerar**

```bash
npx vitest run src/lib/__tests__/parse.test.ts
```
Förväntat: PASS — 8 tester gröna

- [ ] **Steg 5: Commit**

```bash
git add src/lib/parse.ts src/lib/__tests__/parse.test.ts src/lib/__tests__/setup.ts
git commit -m "feat: add .md parser with TDD (8 tests passing)"
```

---

### Task 5: State

**Files:**
- Create: `src/lib/state.svelte.ts`

- [ ] **Steg 1: Skriv state.svelte.ts**

Skapa `src/lib/state.svelte.ts`:
```typescript
import type { AppState, Block, Palette, ClockMode } from './types';
import { parseSource } from './parse';

const KEY = 'day_planner_v1';

const DEFAULT_SOURCE = `#Morgonrutin 07:00
Vakna
Frukost 15m
- ta med vatten
Gå till jobbet 20m

#Arbete 08:00
Planering 15m
Arbetspass 45m

#Lunch 12:00
`;

function load(): Partial<AppState> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); }
  catch { return {}; }
}

function createState() {
  const saved = load();
  let palette    = $state<Palette>(saved.palette ?? 'sansad');
  let dark       = $state<boolean>(saved.dark ?? false);
  let source     = $state<string>(saved.source ?? DEFAULT_SOURCE);
  let clockMode  = $state<ClockMode>(saved.clockMode ?? '1h');
  let showSidebar = $state<boolean>(saved.showSidebar ?? true);
  let showAgenda  = $state<boolean>(saved.showAgenda ?? true);
  let showEditor  = $state<boolean>(saved.showEditor ?? false);
  let blocks = $derived<Block[]>(parseSource(source));

  $effect(() => {
    localStorage.setItem(KEY, JSON.stringify({
      palette, dark, source, clockMode, showSidebar, showAgenda, showEditor
    }));
  });

  return {
    get palette()     { return palette; },     set palette(v)     { palette = v; },
    get dark()        { return dark; },         set dark(v)        { dark = v; },
    get source()      { return source; },       set source(v)      { source = v; },
    get clockMode()   { return clockMode; },    set clockMode(v)   { clockMode = v; },
    get showSidebar() { return showSidebar; },  set showSidebar(v) { showSidebar = v; },
    get showAgenda()  { return showAgenda; },   set showAgenda(v)  { showAgenda = v; },
    get showEditor()  { return showEditor; },   set showEditor(v)  { showEditor = v; },
    get blocks()      { return blocks; },
  };
}

export const appState = createState();
```

- [ ] **Steg 2: Commit**

```bash
git add src/lib/state.svelte.ts
git commit -m "feat: add AppState with Svelte 5 runes and localStorage"
```

---

### Task 6: Telemetri

**Files:**
- Create: `src/lib/telemetry.ts`

- [ ] **Steg 1: Skriv telemetry.ts**

Skapa `src/lib/telemetry.ts`:
```typescript
import type { SessionEvent } from './types';

const KEY = 'day_planner_session';

export function logEvent(event: Omit<SessionEvent, 'ts'>): void {
  const events = getEvents();
  events.push({ ...event, ts: Date.now() });
  try { sessionStorage.setItem(KEY, JSON.stringify(events)); }
  catch { /* fullt eller ej tillgängligt — ignorera */ }
}

export function getEvents(): SessionEvent[] {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

export function clearEvents(): void {
  sessionStorage.removeItem(KEY);
}
```

- [ ] **Steg 2: Commit**

```bash
git add src/lib/telemetry.ts
git commit -m "feat: add session telemetry to sessionStorage"
```

---

### Task 7: Klockgeometri (TDD)

**Files:**
- Create: `src/lib/clock/geometry.ts`
- Create: `src/lib/__tests__/geometry.test.ts`

- [ ] **Steg 1: Skriv failing tests**

Skapa `src/lib/__tests__/geometry.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { degreesToPoint, arcPath, angleFor1h, angleFor12h, CX, CY, R, Ri } from '../clock/geometry';

describe('degreesToPoint', () => {
  it('ger toppen av cirkeln vid 0 grader', () => {
    const { x, y } = degreesToPoint(CX, CY, R, 0);
    expect(x).toBeCloseTo(200);
    expect(y).toBeCloseTo(20);
  });
  it('ger höger sida vid 90 grader', () => {
    const { x, y } = degreesToPoint(CX, CY, R, 90);
    expect(x).toBeCloseTo(380);
    expect(y).toBeCloseTo(200);
  });
});

describe('arcPath', () => {
  it('returnerar SVG path-sträng', () => {
    const path = arcPath(CX, CY, R, Ri, 0, 90);
    expect(path).toMatch(/^M/);
    expect(path).toContain('A');
    expect(path).toContain('Z');
  });
});

describe('angleFor1h', () => {
  it('0 minuter → 0 grader', () => expect(angleFor1h(0)).toBe(0));
  it('30 minuter → 180 grader', () => expect(angleFor1h(30)).toBe(180));
  it('60 minuter → 360 grader', () => expect(angleFor1h(60)).toBe(360));
});

describe('angleFor12h', () => {
  it('0 min → 0 grader', () => expect(angleFor12h(0)).toBe(0));
  it('6h (360min) → 180 grader', () => expect(angleFor12h(360)).toBe(180));
  it('12h (720min) → 360 grader', () => expect(angleFor12h(720)).toBe(360));
});
```

- [ ] **Steg 2: Kör — verifiera fail**

```bash
npx vitest run src/lib/__tests__/geometry.test.ts
```
Förväntat: FAIL — "Cannot find module '../clock/geometry'"

- [ ] **Steg 3: Implementera geometry.ts**

Skapa `src/lib/clock/geometry.ts`:
```typescript
export const CX = 200;
export const CY = 200;
export const R  = 180;   // ytterradie
export const Ri = 90;    // innerradie (donut-hål)

export function degreesToPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function arcPath(cx: number, cy: number, r: number, ri: number, startDeg: number, endDeg: number): string {
  // Normalisera: aldrig exakt 360 (skapar osynlig path)
  const span = ((endDeg - startDeg) + 360) % 360 || 359.999;
  const end = startDeg + span;
  const large = span > 180 ? 1 : 0;
  const o1 = degreesToPoint(cx, cy, r,  startDeg);
  const o2 = degreesToPoint(cx, cy, r,  end);
  const i1 = degreesToPoint(cx, cy, ri, startDeg);
  const i2 = degreesToPoint(cx, cy, ri, end);
  return `M ${o1.x} ${o1.y} A ${r} ${r} 0 ${large} 1 ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A ${ri} ${ri} 0 ${large} 0 ${i1.x} ${i1.y} Z`;
}

export function angleFor1h(minutesPastHour: number): number {
  return (minutesPastHour / 60) * 360;
}

export function angleFor12h(minutesSinceMidnight: number): number {
  return ((minutesSinceMidnight % 720) / 720) * 360;
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function handPath(cx: number, cy: number, r: number, deg: number): string {
  const tip   = degreesToPoint(cx, cy, r,    deg);
  const left  = degreesToPoint(cx, cy, 8,    deg - 90);
  const right = degreesToPoint(cx, cy, 8,    deg + 90);
  const base  = degreesToPoint(cx, cy, 18,   deg + 180);
  return `M ${left.x} ${left.y} L ${tip.x} ${tip.y} L ${right.x} ${right.y} L ${base.x} ${base.y} Z`;
}
```

- [ ] **Steg 4: Kör — verifiera pass**

```bash
npx vitest run src/lib/__tests__/geometry.test.ts
```
Förväntat: PASS — 7 tester gröna

- [ ] **Steg 5: Commit**

```bash
git add src/lib/clock/geometry.ts src/lib/__tests__/geometry.test.ts
git commit -m "feat: add clock geometry helpers with TDD (7 tests passing)"
```

---

### Task 8: Global CSS och layout

**Files:**
- Modify: `src/routes/+layout.svelte`

- [ ] **Steg 1: Skriv layout**

Ersätt `src/routes/+layout.svelte`:
```svelte
<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { applyCssVars } from '$lib/theme';
  let { children } = $props();
</script>

<div
  class="app"
  class:dark={appState.dark}
  class:psychedelic={appState.palette === 'psychedelic'}
  style={applyCssVars(appState.palette, appState.dark)}
>
  {@render children()}
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { font-family: system-ui, sans-serif; }
  :global(.pill) {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 12px; border-radius: 999px; cursor: pointer;
    background: var(--pill); color: var(--fg);
    border: 1px solid var(--border); font-size: 0.8rem; font-weight: 500;
    user-select: none; transition: background 0.15s;
  }
  :global(.pill.on) { background: var(--pill-on); color: var(--pill-on-fg); border-color: var(--pill-on); }

  .app {
    min-height: 100dvh;
    background: var(--bg);
    color: var(--fg);
    display: flex;
    flex-direction: column;
  }

  /* Psychedelic-animation — CleverTouch-säker: bakom prefers-reduced-motion */
  .app.psychedelic { background: #220033; }
  @media (prefers-reduced-motion: no-preference) {
    .app.psychedelic {
      background: linear-gradient(135deg, #ff00ff, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff);
      background-size: 400% 400%;
      animation: psych 8s ease infinite;
    }
  }
  @keyframes psych {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }
</style>
```

- [ ] **Steg 2: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat: add global CSS with CleverTouch-safe animations"
```

---

### Task 9: 1h-klocka

**Files:**
- Create: `src/components/Clock1h.svelte`

- [ ] **Steg 1: Skriv Clock1h.svelte**

Skapa `src/components/Clock1h.svelte`:
```svelte
<script lang="ts">
  import type { Block, ClockTheme, Palette } from '$lib/types';
  import { CX, CY, R, Ri, arcPath, degreesToPoint, angleFor1h, handPath } from '$lib/clock/geometry';
  import { SECTOR_COLORS } from '$lib/theme';

  let { blocks, palette, theme, now }:
    { blocks: Block[]; palette: Palette; theme: ClockTheme; now: number } = $props();

  let active   = $derived(blocks.find(b => now >= b.startMin && now < b.endMin) ?? null);
  let parts    = $derived(active?.parts ?? []);
  let bStart   = $derived(active?.startMin ?? Math.floor(now / 60) * 60);
  let colors   = $derived(SECTOR_COLORS[palette]);
  let elapsed  = $derived(now - bStart);

  function a0(idx: number): number {
    return angleFor1h((bStart % 60) + parts.slice(0, idx).reduce((s, p) => s + p.minutes, 0));
  }
  function a1(idx: number): number { return a0(idx + 1); }

  let handDeg = $derived(angleFor1h(now % 60));
  let hPath   = $derived(handPath(CX, CY, R - 10, handDeg));

  function cumStart(idx: number) { return parts.slice(0, idx).reduce((s, p) => s + p.minutes, 0); }
  function isPast(idx: number)   { return elapsed >= cumStart(idx) + parts[idx].minutes; }
  function isActive(idx: number) { return !isPast(idx) && elapsed >= cumStart(idx); }

  function fmt(min: number): string {
    return `${Math.floor(min/60).toString().padStart(2,'0')}:${Math.floor(min%60).toString().padStart(2,'0')}`;
  }
</script>

<svg viewBox="0 0 400 400" width="400" height="400">
  <circle cx={CX} cy={CY} r={R} fill={theme.bg} />

  {#each parts as part, i}
    {@const color = colors[i % colors.length]}
    {@const splitDeg = angleFor1h((bStart % 60) + elapsed)}

    {#if isPast(i)}
      <path d={arcPath(CX, CY, R, Ri, a0(i), a1(i))} fill="{color}{theme.dimSuffix}" />
    {:else if isActive(i)}
      <path d={arcPath(CX, CY, R, Ri, a0(i), splitDeg)} fill="{color}{theme.dimSuffix}" />
      <path d={arcPath(CX, CY, R, Ri, splitDeg, a1(i))} fill={color} />
    {:else}
      <path d={arcPath(CX, CY, R, Ri, a0(i), a1(i))} fill={color} />
    {/if}

    <!-- Chip-etikett — ingen SVG-filter (CleverTouch-säker) -->
    {@const mid = (a0(i) + a1(i)) / 2}
    {@const lp = degreesToPoint(CX, CY, (R + Ri) / 2, mid)}
    <rect x={lp.x - 38} y={lp.y - 11} width={76} height={22} rx={4} fill={theme.chip} />
    <text x={lp.x} y={lp.y + 5} text-anchor="middle" font-size="11" fill={color} font-weight="600">
      {part.title} {part.minutes}m
    </text>
  {/each}

  <!-- Donut-hål -->
  <circle cx={CX} cy={CY} r={Ri} fill={theme.bg} />

  <!-- Centrertext -->
  <text x={CX} y={CY - 8} text-anchor="middle" font-size="28" fill={theme.centerMain} font-weight="300">
    {fmt(now)}
  </text>
  {#if active}
    <text x={CX} y={CY + 16} text-anchor="middle" font-size="12" fill={theme.centerMuted}>
      slutar {fmt(active.endMin)}
    </text>
  {/if}

  <!-- Visare -->
  <path d={hPath} fill={theme.handDark} opacity="0.9" />
  <path d={hPath} fill={theme.handLight} opacity="0.3" />

  <!-- Tickmärken: vit halo + markfärg ovanpå — inga SVG-filter -->
  {#each { length: 60 } as _, i}
    {@const deg = i * 6}
    {@const major = i % 5 === 0}
    {@const o = degreesToPoint(CX, CY, R, deg)}
    {@const inn = degreesToPoint(CX, CY, R - (major ? 14 : 7), deg)}
    <line x1={o.x} y1={o.y} x2={inn.x} y2={inn.y}
      stroke="white" stroke-width={major ? 3.5 : 2} opacity="0.38" />
    <line x1={o.x} y1={o.y} x2={inn.x} y2={inn.y}
      stroke={theme.mark} stroke-width={major ? 2 : 1} />
  {/each}
</svg>
```

- [ ] **Steg 2: Commit**

```bash
git add src/components/Clock1h.svelte
git commit -m "feat: add 1h clock SVG component"
```

---

### Task 10: 12h-klocka

**Files:**
- Create: `src/components/Clock12h.svelte`

- [ ] **Steg 1: Skriv Clock12h.svelte**

Skapa `src/components/Clock12h.svelte`:
```svelte
<script lang="ts">
  import type { Block, ClockTheme, Palette } from '$lib/types';
  import { CX, CY, R, Ri, arcPath, degreesToPoint, angleFor12h, handPath } from '$lib/clock/geometry';
  import { SECTOR_COLORS } from '$lib/theme';

  let { blocks, palette, theme, now }:
    { blocks: Block[]; palette: Palette; theme: ClockTheme; now: number } = $props();

  let colors  = $derived(SECTOR_COLORS[palette]);
  let handDeg = $derived(angleFor12h(now));

  // Rullande 12h-fönster: etiketten vid position h*30° visar
  // den timme som näst kommer passera den positionen
  function hourLabel(h: number): number {
    const nowH = now / 60;
    const h12  = h % 12;
    const base = Math.floor(nowH / 12) * 12 + h12;
    return base <= nowH ? base + 12 : base;
  }

  function fmt(min: number): string {
    return `${Math.floor(min/60).toString().padStart(2,'0')}:${Math.floor(min%60).toString().padStart(2,'0')}`;
  }
</script>

<svg viewBox="0 0 400 400" width="400" height="400">
  <circle cx={CX} cy={CY} r={R} fill={theme.bg} />

  {#each blocks as block, i}
    {@const color  = colors[i % colors.length]}
    {@const ba0    = angleFor12h(block.startMin)}
    {@const ba1    = angleFor12h(block.endMin)}
    {@const past   = now >= block.endMin}
    {@const active = !past && now >= block.startMin}

    {#if past}
      <path d={arcPath(CX, CY, R, Ri, ba0, ba1)} fill="{color}{theme.dimSuffix}" />
    {:else if active}
      {@const split = angleFor12h(now)}
      <path d={arcPath(CX, CY, R, Ri, ba0, split)} fill="{color}{theme.dimSuffix}" />
      <path d={arcPath(CX, CY, R, Ri, split, ba1)} fill={color} />
    {:else}
      <path d={arcPath(CX, CY, R, Ri, ba0, ba1)} fill={color} />
    {/if}

    {@const mid = (ba0 + ba1) / 2}
    {@const lp  = degreesToPoint(CX, CY, (R + Ri) / 2, mid)}
    <rect x={lp.x - 40} y={lp.y - 11} width={80} height={22} rx={4} fill={theme.chip} />
    <text x={lp.x} y={lp.y + 5} text-anchor="middle" font-size="11" fill={color} font-weight="600">
      {block.title}
    </text>
  {/each}

  <circle cx={CX} cy={CY} r={Ri} fill={theme.bg} />

  <text x={CX} y={CY + 6} text-anchor="middle" font-size="22" fill={theme.centerMain} font-weight="300">
    {fmt(now)}
  </text>

  <!-- Visare -->
  <path d={handPath(CX, CY, R - 10, handDeg)} fill={theme.handDark} opacity="0.9" />

  <!-- Timmarsetiketter med rullande 12h-logik -->
  {#each { length: 12 } as _, h}
    {@const deg = h * 30}
    {@const lp  = degreesToPoint(CX, CY, R + 18, deg)}
    <text x={lp.x} y={lp.y + 5} text-anchor="middle" font-size="12" fill={theme.mark} font-weight="500">
      {hourLabel(h)}
    </text>
  {/each}

  <!-- Tickmärken — inga SVG-filter -->
  {#each { length: 12 } as _, i}
    {@const deg = i * 30}
    {@const o   = degreesToPoint(CX, CY, R, deg)}
    {@const inn = degreesToPoint(CX, CY, R - 14, deg)}
    <line x1={o.x} y1={o.y} x2={inn.x} y2={inn.y} stroke="white" stroke-width="3.5" opacity="0.38" />
    <line x1={o.x} y1={o.y} x2={inn.x} y2={inn.y} stroke={theme.mark} stroke-width="2" />
  {/each}
</svg>
```

- [ ] **Steg 2: Commit**

```bash
git add src/components/Clock12h.svelte
git commit -m "feat: add 12h rolling clock SVG component"
```

---

### Task 11: Drag-logik

**Files:**
- Create: `src/lib/clock/drag.ts`

- [ ] **Steg 1: Skriv drag.ts**

Skapa `src/lib/clock/drag.ts`:
```typescript
import type { Block } from '../types';
import { CX, CY } from './geometry';

function pointerAngle(e: PointerEvent, el: SVGElement): number {
  const rect = el.getBoundingClientRect();
  const scaleX = 400 / rect.width;
  const scaleY = 400 / rect.height;
  const x = (e.clientX - rect.left) * scaleX - CX;
  const y = (e.clientY - rect.top)  * scaleY - CY;
  let deg = (Math.atan2(y, x) * 180 / Math.PI) + 90;
  return ((deg % 360) + 360) % 360;
}

// 1h-drag: omfördelar tid mellan delar i ett block
export function make1hDrag(
  blocks: Block[],
  now: number,
  onUpdate: (source: string, blocks: Block[]) => void,
  toSource: (blocks: Block[]) => string,
) {
  let dragging: { blockIdx: number; boundaryIdx: number } | null = null;

  function down(e: PointerEvent, svgEl: SVGElement, blockIdx: number, boundaryIdx: number) {
    dragging = { blockIdx, boundaryIdx };
    svgEl.setPointerCapture(e.pointerId);
  }

  function move(e: PointerEvent, svgEl: SVGElement) {
    if (!dragging) return;
    const deg = pointerAngle(e, svgEl);
    const minsPastHour = (deg / 360) * 60;
    const block = blocks[dragging.blockIdx];
    const blockStartInHour = block.startMin % 60;
    const targetAbsMin = minsPastHour - blockStartInHour;

    // Beräkna ny fördelning
    const { boundaryIdx } = dragging;
    const left  = block.parts.slice(0, boundaryIdx + 1);
    const right = block.parts.slice(boundaryIdx + 1);
    const leftSum  = left.reduce((s, p) => s + p.minutes, 0);
    const rightSum = right.reduce((s, p) => s + p.minutes, 0);
    const total = leftSum + rightSum;
    const newLeft  = Math.max(1, Math.min(total - right.length, Math.round(targetAbsMin)));
    const newRight = total - newLeft;

    if (newLeft >= left.length && newRight >= right.length) {
      // Fördela jämnt inom varje sida
      const leftShare  = Math.floor(newLeft  / left.length);
      const rightShare = Math.floor(newRight / right.length);
      left.forEach(p  => { p.minutes = leftShare;  p.pinned = true; });
      right.forEach(p => { p.minutes = rightShare; p.pinned = true; });
      onUpdate(toSource(blocks), blocks);
    }
  }

  function up() { dragging = null; }

  return { down, move, up };
}

// 12h-drag: flyttar blockgränser i minuter
export function make12hDrag(
  blocks: Block[],
  onUpdate: (source: string, blocks: Block[]) => void,
  toSource: (blocks: Block[]) => string,
) {
  let dragging: { boundaryIdx: number } | null = null;

  function down(e: PointerEvent, svgEl: SVGElement, boundaryIdx: number) {
    dragging = { boundaryIdx };
    svgEl.setPointerCapture(e.pointerId);
  }

  function move(e: PointerEvent, svgEl: SVGElement) {
    if (!dragging) return;
    const deg = pointerAngle(e, svgEl);
    const nowH = Math.floor(Date.now() / 60000) % 720; // approximate hour base
    const minsPast12h = (deg / 360) * 720;
    const { boundaryIdx } = dragging;
    const newTime = Math.round(minsPast12h / 5) * 5; // snap to 5min

    const prev = blocks[boundaryIdx];
    const next = blocks[boundaryIdx + 1];
    if (!prev || !next) return;
    if (newTime <= prev.startMin + 5) return;
    if (newTime >= next.endMin - 5) return;

    prev.endMin  = newTime;
    next.startMin = newTime;
    onUpdate(toSource(blocks), blocks);
  }

  function up() { dragging = null; }

  return { down, move, up };
}
```

- [ ] **Steg 2: Commit**

```bash
git add src/lib/clock/drag.ts
git commit -m "feat: add drag logic for 1h and 12h clock modes"
```

---

### Task 12: Clock-wrapper

**Files:**
- Create: `src/components/Clock.svelte`

- [ ] **Steg 1: Skriv Clock.svelte**

Skapa `src/components/Clock.svelte`:
```svelte
<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { clockTheme } from '$lib/theme';
  import { nowMinutes } from '$lib/clock/geometry';
  import Clock1h  from './Clock1h.svelte';
  import Clock12h from './Clock12h.svelte';

  let now = $state(nowMinutes());
  $effect(() => {
    const id = setInterval(() => { now = nowMinutes(); }, 1000);
    return () => clearInterval(id);
  });

  let theme = $derived(clockTheme(appState.palette, appState.dark));
</script>

<div class="wrap">
  <div class="toggle">
    <button class="pill" class:on={appState.clockMode === '1h'}
      onclick={() => appState.clockMode = '1h'}>1h</button>
    <button class="pill" class:on={appState.clockMode === '12h'}
      onclick={() => appState.clockMode = '12h'}>12h</button>
  </div>

  {#if appState.clockMode === '1h'}
    <Clock1h blocks={appState.blocks} palette={appState.palette} {theme} {now} />
  {:else}
    <Clock12h blocks={appState.blocks} palette={appState.palette} {theme} {now} />
  {/if}
</div>

<style>
  .wrap  { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .toggle { display: flex; gap: 4px; }
</style>
```

- [ ] **Steg 2: Commit**

```bash
git add src/components/Clock.svelte
git commit -m "feat: add Clock wrapper with 1h/12h toggle"
```

---

### Task 13: Sidebar

**Files:**
- Create: `src/components/Sidebar.svelte`

- [ ] **Steg 1: Skriv Sidebar.svelte**

Skapa `src/components/Sidebar.svelte`:
```svelte
<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { SECTOR_COLORS } from '$lib/theme';
  import { nowMinutes } from '$lib/clock/geometry';

  let now    = $state(nowMinutes());
  $effect(() => {
    const id = setInterval(() => { now = nowMinutes(); }, 1000);
    return () => clearInterval(id);
  });

  let active  = $derived(appState.blocks.find(b => now >= b.startMin && now < b.endMin) ?? appState.blocks[0] ?? null);
  let parts   = $derived(active?.parts ?? []);
  let colors  = $derived(SECTOR_COLORS[appState.palette]);
  let elapsed = $derived(active ? now - active.startMin : 0);

  function cumStart(i: number) { return parts.slice(0, i).reduce((s, p) => s + p.minutes, 0); }
  function status(i: number): 'past' | 'active' | 'upcoming' {
    const cs = cumStart(i);
    if (elapsed >= cs + parts[i].minutes) return 'past';
    if (elapsed >= cs) return 'active';
    return 'upcoming';
  }

  let activeIdx = $derived(parts.findIndex((_, i) => status(i) === 'active'));
  let listEl: HTMLElement | null = $state(null);

  $effect(() => {
    if (!listEl || activeIdx < 0) return;
    const el = listEl.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
</script>

<aside class="sidebar">
  {#if active}
    <div class="block-title">{active.title}</div>
  {/if}
  <ul class="list" bind:this={listEl}>
    {#each parts as part, i}
      {@const s = status(i)}
      {@const color = colors[i % colors.length]}
      <li class="part {s}">
        <span class="dot" style="background:{color}"></span>
        <span class="name">{part.title}</span>
        <span class="mins">{part.minutes}m</span>
        {#if part.note}<div class="note">{part.note}</div>{/if}
      </li>
    {/each}
  </ul>
</aside>

<style>
  .sidebar { width:220px; padding:16px 12px; background:var(--panel); border-right:1px solid var(--border); display:flex; flex-direction:column; gap:8px; overflow:hidden; }
  .block-title { font-size:1rem; font-weight:600; padding-bottom:8px; border-bottom:1px solid var(--border); }
  .list { list-style:none; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:4px; }
  .part { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; }
  .part.past    { opacity:0.35; }
  .part.active  { background:var(--pill); font-weight:600; }
  .dot  { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .name { flex:1; font-size:0.9rem; }
  .mins { font-size:0.8rem; color:var(--muted); }
  .note { font-size:0.75rem; color:var(--muted); padding-left:18px; width:100%; }
</style>
```

- [ ] **Steg 2: Commit**

```bash
git add src/components/Sidebar.svelte
git commit -m "feat: add Sidebar with scroll-focus on active part"
```

---

### Task 14: Agenda

**Files:**
- Create: `src/components/Agenda.svelte`

- [ ] **Steg 1: Skriv Agenda.svelte**

Skapa `src/components/Agenda.svelte`:
```svelte
<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { SECTOR_COLORS } from '$lib/theme';
  import { nowMinutes } from '$lib/clock/geometry';

  let now    = $state(nowMinutes());
  $effect(() => {
    const id = setInterval(() => { now = nowMinutes(); }, 1000);
    return () => clearInterval(id);
  });

  let colors = $derived(SECTOR_COLORS[appState.palette]);

  function fmt(min: number): string {
    return `${Math.floor(min/60).toString().padStart(2,'0')}:${(min%60).toString().padStart(2,'0')}`;
  }

  function status(s: number, e: number) {
    if (now >= e) return 'past';
    if (now >= s) return 'active';
    return 'upcoming';
  }
</script>

<aside class="agenda">
  <div class="label">Idag</div>
  <div class="timeline">
    {#each appState.blocks as block, i}
      {@const color = colors[i % colors.length]}
      {@const h     = Math.max(32, (block.endMin - block.startMin) * 1.4)}
      {@const st    = status(block.startMin, block.endMin)}
      <div class="row {st}" style="height:{h}px; border-left:3px solid {color}">
        <span class="time">{fmt(block.startMin)}</span>
        <span class="title" style="color:{color}">{block.title}</span>
        <span class="dur">{block.endMin - block.startMin}m</span>
      </div>
    {/each}
  </div>
</aside>

<style>
  .agenda   { width:200px; padding:16px 12px; background:var(--panel); border-left:1px solid var(--border); display:flex; flex-direction:column; gap:8px; overflow-y:auto; }
  .label    { font-size:0.75rem; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; }
  .timeline { display:flex; flex-direction:column; gap:2px; }
  .row      { display:flex; flex-direction:column; justify-content:center; padding:4px 8px; border-radius:0 4px 4px 0; background:var(--pill); }
  .row.past    { opacity:0.4; }
  .row.active  { background:var(--pill-on); }
  .time  { font-size:0.7rem; color:var(--muted); }
  .title { font-size:0.85rem; font-weight:600; }
  .dur   { font-size:0.7rem; color:var(--muted); }
</style>
```

- [ ] **Steg 2: Commit**

```bash
git add src/components/Agenda.svelte
git commit -m "feat: add Agenda vertical timeline"
```

---

### Task 15: Editor

**Files:**
- Create: `src/components/Editor.svelte`

- [ ] **Steg 1: Skriv Editor.svelte**

Skapa `src/components/Editor.svelte`:
```svelte
<script lang="ts">
  import { appState } from '$lib/state.svelte';
</script>

{#if appState.showEditor}
  <div class="wrap">
    <textarea
      class="editor"
      bind:value={appState.source}
      spellcheck="false"
      autocorrect="off"
      placeholder="Skriv din dagsplan..."
    ></textarea>
  </div>
{/if}

<style>
  .wrap {
    position: fixed; bottom:0; left:0; right:0; height:40vh;
    background:var(--panel); border-top:2px solid var(--border); z-index:10;
  }
  .editor {
    width:100%; height:100%; padding:12px 16px;
    background:transparent; color:var(--fg);
    border:none; resize:none; outline:none;
    font-family:'Courier New', monospace; font-size:0.9rem; line-height:1.6;
  }
</style>
```

- [ ] **Steg 2: Commit**

```bash
git add src/components/Editor.svelte
git commit -m "feat: add collapsible text editor"
```

---

### Task 16: Huvudsida och montering

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Steg 1: Skriv +page.svelte**

Ersätt `src/routes/+page.svelte`:
```svelte
<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { logEvent } from '$lib/telemetry';
  import Clock   from '$components/Clock.svelte';
  import Sidebar from '$components/Sidebar.svelte';
  import Agenda  from '$components/Agenda.svelte';
  import Editor  from '$components/Editor.svelte';

  $effect(() => { logEvent({ type: 'plan_loaded', blockId: 'root' }); });
</script>

<nav class="toolbar">
  <button class="pill" class:on={appState.showSidebar}
    onclick={() => appState.showSidebar = !appState.showSidebar}>Lista</button>
  <button class="pill" class:on={appState.showAgenda}
    onclick={() => appState.showAgenda = !appState.showAgenda}>Agenda</button>
  <button class="pill" class:on={appState.showEditor}
    onclick={() => appState.showEditor = !appState.showEditor}>Redigera</button>
  <button class="pill" class:on={appState.dark}
    onclick={() => appState.dark = !appState.dark}>Mörkt</button>
  <select class="pill palette-sel" bind:value={appState.palette}>
    {#each ['sansad','meadow','mlp','bright','clear','psychedelic'] as p}
      <option value={p}>{p}</option>
    {/each}
  </select>
</nav>

<div class="main">
  {#if appState.showSidebar}<Sidebar />{/if}
  <div class="center"><Clock /></div>
  {#if appState.showAgenda}<Agenda />{/if}
</div>

<Editor />

<style>
  .toolbar {
    display:flex; gap:6px; padding:10px 16px;
    background:var(--panel); border-bottom:1px solid var(--border); flex-wrap:wrap;
  }
  .palette-sel {
    background:var(--pill); color:var(--fg); border:1px solid var(--border);
    border-radius:999px; padding:4px 12px; font-size:0.8rem; cursor:pointer; outline:none;
  }
  .main   { flex:1; display:flex; overflow:hidden; }
  .center { flex:1; display:flex; align-items:center; justify-content:center; padding:24px; }
</style>
```

- [ ] **Steg 2: Verifiera i webbläsare**

```bash
npm run dev
```
Kontrollera: klockan syns, toolbar-knapparna fungerar, palettväljaren byter tema, editor öppnas vid "Redigera".

- [ ] **Steg 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: assemble main page with all panels"
```

---

### Task 17: Vercel-deploy

**Files:**
- Create: `vercel.json`

- [ ] **Steg 1: Skapa vercel.json**

Skapa `vercel.json`:
```json
{
  "framework": "sveltekit"
}
```

- [ ] **Steg 2: Bygg och verifiera**

```bash
npm run build
```
Förväntat: Build klar utan fel.

- [ ] **Steg 3: Skapa GitHub-repo och pusha**

```bash
gh repo create ximonse/day_planner --public --source=. --remote=origin --push
```

- [ ] **Steg 4: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel config"
git push -u origin main
```

---

## Self-review

### Spec-täckning

| Krav från spec | Task |
|----------------|------|
| SvelteKit + Svelte 5 runes | 1, 5 |
| .md-format parser (alla syntaxregler) | 4 |
| 1h rullande klocka (the_timer-logik) | 9 |
| 12h klocka med rullande fönster | 10 |
| Toggle 1h ↔ 12h | 12 |
| Vänster sidebar, scroll-fokus | 13 |
| Höger agenda, skolschema-stil | 14 |
| Kollapsbar texteditor | 15 |
| localStorage-persistens | 5 |
| Teman + dark mode | 3, 8 |
| CleverTouch-säker CSS | 8 (prefers-reduced-motion, inga filters) |
| Sessiontelemetri i sessionStorage | 6 |
| Drag 1h | 11 (drag.ts make1hDrag — integration i Clock1h är nästa sprint) |
| Drag 12h | 11 (drag.ts make12hDrag — integration i Clock12h är nästa sprint) |
| Vercel-deploy | 17 |

**Notering:** Drag-logiken är implementerad i `drag.ts` (Task 11) men inte ännu kopplad till SVG pointer events i komponenterna. Det görs i nästa sprint efter visuell validering.

### Typ-konsistens
- `Block`, `Part`, `ClockTheme`, `SessionEvent` definieras i Task 2, används konsekvent i Tasks 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14.
- `SECTOR_COLORS` importeras från `$lib/theme` i Clock1h, Clock12h, Sidebar, Agenda — konsekvent.
- `nowMinutes()` importeras från `$lib/clock/geometry` i Clock, Sidebar, Agenda — konsekvent.
- `applyCssVars()` och `clockTheme()` från `$lib/theme` — konsekvent.
