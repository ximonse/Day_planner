## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: none

---

# Day Planner — Claude Context

## Vad är det här?

`Day Planner` är en pro-version av [`the_timer`](https://github.com/ximonse/the_timer) — en visuell timer för lärare och andra som behöver strukturera sin dag. Samma grafiska språk, men kraftfullare: 12h-vy, kalenderimport, mer flexibel schemaläggning.

`the_timer` behålls som den är (mogen, enkel, en HTML-fil). `Day Planner` är ny och byggs i SvelteKit.

## Stack

- **SvelteKit** + TypeScript — komponentbaserat, reaktivt, naturligt för SVG
- **Svelte 5 runes** (`$state`, `$derived`, `$effect`) — används genomgående, inte Options API
- **@sveltejs/adapter-vercel** — deployas på Vercel, noll konfiguration
- **Upstash Redis** via `@upstash/redis` — cross-device sync med lösenfras
- **Inga CSS-ramverk** — CSS custom properties, samma variabler som the_timer

## Env-variabler

```
dayplanner_KV_REST_API_URL=
dayplanner_KV_REST_API_TOKEN=
```

Kopplas i Vercel Dashboard → Storage → välj Upstash-databas → prefix `dayplanner`.

## Projektstruktur

```
src/
  lib/
    theme.ts          — 6 paletter, clockTheme(), CSS-variabler
    state.svelte.ts   — appState (Svelte 5 runes), localStorage-persistens
  routes/
    +layout.svelte    — global CSS, temadefinitioner
    +page.svelte      — huvudvy (dagsplan + klocka)
    api/sync/
      +server.ts      — GET/POST mot Upstash Redis
```

## Teman — 6 paletter

Varje palett har dag- och nattvariant. Natt = enhetlig varm mörkgrå bakgrund (`#1c1a16`), sektorfärgerna oförändrade.

| Palett | Signalfärg | Karaktär |
|--------|-----------|----------|
| sansad | `#e07a5f` | Jordnära, lugn |
| meadow | `#7cb518` | Grönt, naturligt |
| mlp | `#cdb4db` | Pastellrosa/lila |
| bright | `#f86624` | Starka kontraster |
| clear | `#9a031e` | Vinrött, tydligt |
| psychedelic | `#ff00ff` | Animerad gradient |

Sektorfärger (8 per palett) definieras i `SECTOR_COLORS` i `theme.ts`.
CSS-variabler: `--bg`, `--fg`, `--panel`, `--border`, `--muted`, `--accent`, `--pill`, `--pill-on`, `--pill-on-fg`, `--void`.

## Datamodell

```typescript
interface Block {
  id: string;
  title: string;
  minutes: number;
  note: string;
  warning: boolean;
  pinned: boolean; // minuter satta explicit av användaren
}

interface AppState {
  palette: Palette;
  dark: boolean;
  blocks: Block[];
  dayTitle: string;
  extraInfo: string;
  startMin: number; // minuter sedan midnatt
  syncKey: string;
}
```

## Inmatningsformat (ärvt från the_timer)

Användaren kan klistra in AI-genererat schema direkt:

```
#Morgonrutin          → dayTitle
Vakna 5m              → block, 5 min (pinned)
Frukost 20m           → block, 20 min (pinned)
- ta med vatten       → note på föregående block
Promenad              → block, minuter auto-fördelas
& Möte kl 9           → extraInfo
```

## Planerade features (prioritetsordning)

1. **Redigera block** — lägg till/ta bort/byta ordning, long-press för drag
2. **Emoji-stöd** — om titeln bara är en emoji visas den stor (bildstöd)
3. **2h-vy** — timern kan visa upp till 2 timmar (minutvisare fortfarande)
4. **12h-vy** — timvisare istället för minutvisare, hela dagen
5. **Bibliotek** — färdiga rutiner (lektioner, morgon, kväll) — spara/ladda
6. **Export/import** — dela rutiner som JSON eller URL
7. **Kalenderimport** — Google Calendar / ICS-fil för 12h-dagsvyn
8. **URL-delning** — schema kodat i URL (base64) utan konto

## Designprinciper

- **Enkel yta, kraftfulla funktioner under** — avancerat ska gå att gräva fram, inte synas direkt
- **Inte överklottrad** — varje ny feature måste motiveras
- **Samma visuella språk som the_timer** — klock-SVG, sektorfärger, chip-etiketter
- **Snabb att använda** — primärflödet (klistra in lista → starta timer) ska ta under 10 sekunder

## Klockan — tekniska detaljer

SVG 400×400, CX=200, CY=200, R=180 (ytterradie), Ri=90 (inre radie donut).
Sektorer: fulla färger från start, dämpar till `color + dimSuffix` när visaren passerat.
Tick-märken: vit halo (synlig mot alla bakgrunder) + markfärg ovanpå.
Label-chips: vit bakgrund (dag) / mörk bakgrund (natt) för läsbarhet.

## Koppling till the_timer

- Repot: `ximonse/the_timer` (en HTML-fil, vanilla JS, Vercel)
- Delar: teman, färgpaletter, klock-logik, inmatningsformat
- Skiljer sig: the_timer = 1h fokustimer. Day Planner = 12h dagplanering
- Ska kännas som samma app-familj grafiskt
