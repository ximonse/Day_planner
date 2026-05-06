# Day Planner — Designspec
_2026-05-05_

## Vad är det?

Day Planner är en pro-version av the_timer. Samma visuella språk — donut-klocka, sektorfärger, chip-etiketter — men med ett hierarkiskt tidsplaneringssystem för hela dagen. the_timer behålls som det är.

---

## Layout

Tre paneler, alla kollapsibla:

```
┌─────────────┬──────────────────────┬─────────────┐
│  Vänster    │                      │   Höger     │
│  sidebar    │    Donut-klocka      │   Agenda    │
│  [kollaps]  │    (1h ↔ 12h)        │  [kollaps]  │
│             │                      │             │
│  • Passerad │    [toggle-knapp]    │  07:00      │
│  ► Aktiv    │                      │  ─ Morgon ─ │
│  • Nästa    │                      │  09:00      │
│  • Nästa    │                      │  ─ Skola ─  │
└─────────────┴──────────────────────┴─────────────┘
```

**Vänster sidebar:** Visar aktuellt blocks delar. Aktiv del centrerad i listan, passerade ovanför (dimmade), kommande under. Identisk logik med the_timers sidolista, men med automatisk scroll-fokus på aktuell rad.

**Center klocka:** Alltid synlig, aldrig kollapsad. Växlar mellan 1h och 12h via en diskret pill-knapp. Se Klocklägen nedan.

**Höger agenda:** Vertikal tidslinje, skolschema-stil. Visar alla `#Block` med tider. Klick på ett block fokuserar det i klockan och sidopanelen.

---

## Dataformat

Källformatet är en `.md`-liknande text — redigerbar direkt, AI-vänlig, ICS-importerbar.

```
#Morgonrutin 06:05
Vakna
Borsta tänderna
- använd nya tandkrämen

#Skolprepp 06:30
Packa väska 10m
- Skolböcker
- Dator
Ställtid 15m

#Skolstart 07:45-08:00
Nån grej
Nån till grej
- undergrej

#Lunch 12:00
```

### Parsningsregler

| Syntax | Betydelse |
|--------|-----------|
| `#Titel HH:MM` | Block, startar HH:MM, slutar när nästa block börjar |
| `#Titel HH:MM-HH:MM` | Block med explicit sluttid, delar fördelas proportionellt |
| `#Titel HH:MM` (sist i filen) | Default 1h sluttid om inget följer |
| `Del 10m` | Del med explicit tid (pinned) |
| `Del` | Del utan tid — auto-fördelas på kvarvarande blocktid |
| `- anteckning` | Note under föregående del |

### Hierarki

```
#Block        → dag-block i 12h-klockan + höger agenda
  Del         → sektor i 1h-klockan + vänster sidebar
  - anteckning → visas under del i sidopanelen
```

---

## Klocklägen

### 1h-läge (standard)

- Identisk logik med the_timer: aktuellt blocks delar som sektorer
- Rullande och automatisk — inget att starta manuellt
- Om klockan är 08:17 och `#Skolstart 08:00` finns → det blocket är redan aktivt
- Visaren rör sig med klocktiden, passerade sektorer dämpas
- Drag på gränser omfördelar tid mellan delar inom blocket

### 12h-läge (toggle)

- Hela dagen på donuten — varje `#Block` är en sektor proportionell mot sin tid
- Rullande 12h-fönster: urtavlan visar alltid de kommande 12 timmarna framåt från visarens position
- När visaren passerar en timme flippar den timmen till +12h (kl 03 → 15, kl 06 → 18, kl 12 → 00)
- Drag på blockgränser ändrar blocktiderna direkt i källtexten

### Toggle

- Liten pill-knapp på klockan (diskret, som the_timers övriga kontroller)
- Vänster sidebar och höger agenda påverkas inte av klockläge

---

## Redigering och drag

Drag och text är alltid i sync — ändrar man ena uppdateras det andra omedelbart.

**I 1h-läge:** Drag omfördelar tid mellan delar inom aktuellt block (samma som the_timer).

**I 12h-läge:** Drag flyttar blockgränser, vilket ändrar `HH:MM`-tiderna i källtexten.

**Texteditor:** Kollapsbar panel som visar källtexten direkt redigerbar. Parsar och renderar om vid varje tangenttryckning.

---

## Inmatning och import

**Manuell:** Texteditor (se ovan). Primärflödet — klistra in AI-genererat schema eller skriv för hand.

**ICS/Google Calendar (fas 2):** Importknapp laddar `.ics` eller hämtar från Google. Importerade block skrivs in i textformatet och kan redigeras fritt.

**Snabbstart:** Ingen — appen är alltid igång. Aktuellt block bestäms av systemklockan mot schemat.

---

## Stack

- **SvelteKit + TypeScript** — komponentbaserat, reaktivt, naturligt för SVG
- **Svelte 5 runes** (`$state`, `$derived`, `$effect`) — används genomgående
- **@sveltejs/adapter-vercel** — deployas på Vercel
- **Upstash Redis** via `@upstash/redis` — cross-device sync med lösenfras (fas 2)
- **Inga CSS-ramverk** — CSS custom properties, samma variabler som the_timer

### Komponentstruktur

```
src/
  lib/
    theme.ts              — paletter, clockTheme(), CSS-variabler (portad från the_timer)
    parse.ts              — parsning av .md-format → blocks[]
    state.svelte.ts       — AppState med Svelte 5 runes, localStorage
    clock/
      Clock.svelte        — wrapper, hanterar 1h/12h-toggle
      Clock1h.svelte      — 1h donut (portad SVG-logik från the_timer)
      Clock12h.svelte     — 12h donut med rullande fönster
      drag.ts             — drag-logik för båda lägena
  routes/
    +layout.svelte        — global CSS, temadefinitioner
    +page.svelte          — huvudvy: sidebar + klocka + agenda
    api/sync/
      +server.ts          — GET/POST mot Upstash Redis (fas 2)
  components/
    Sidebar.svelte        — vänster panel, scroll-fokus på aktiv del
    Agenda.svelte         — höger panel, vertikal tidslinje
    Editor.svelte         — kollapsbar texteditor
```

---

## CleverTouch-kompatibilitet

Day Planner ska fungera felfritt på interaktiva skärmar (CleverTouch m.fl.) där the_timer har problem med svarta fält och blinkningar. Regler:

- **Inga `backdrop-filter`** — stöds dåligt på display-hårdvara
- **Inga tunga SVG-filter** (`feGaussianBlur` o.likn. på stora ytor)
- **Psychedelic-temats animationer** bakom `@media (prefers-reduced-motion: no-preference)` — och med en "lugn psych"-fallback utan `@keyframes`
- **Inga `will-change: transform`** på stora element
- **Inga `mix-blend-mode`** på SVG-sektorer
- Testa på CleverTouch (eller Chromium i kiosk-läge) som en del av varje releasecheck

---

## Auth och delning

### Användarlägen

| Läge | Beskrivning | Kan redigera | Kan ändra ping |
|------|-------------|-------------|---------------|
| Anonym | Ingen login, lokalt bruk | Ja, lokalt | Ja |
| Inloggad | Användarnamn + kod | Ja, synkat | Ja |
| Delad — redigerbar fork | Mottagaren får en egen kopia | Ja, sin kopia | Ja |
| Delad — skrivskyddad | Elever ser planen, kan inte ändra | Nej | Ja |

### Inloggning
- Användarnamn + numerisk kod (inte bara en sync-nyckel)
- Läraren skapar konton och delar ut inlogg
- Ingen självregistrering — läraren kontrollerar åtkomst

### Delning av 1h-planeringar
- **Redigerbar fork:** Genererar en länk. Mottagaren öppnar och får en självständig kopia — ändringar påverkar inte originalet.
- **Skrivskyddad:** Genererar en länk. Mottagaren ser planen, kan inte redigera block/tider, men kan toggla sin ping-inställning per del.

### Arkitekturkonsekvens
- Auth hanteras server-side (SvelteKit `+server.ts` + Upstash Redis)
- Sessions lagras med kort TTL (24h), förnyas vid aktivitet
- Delnings-URLer innehåller ett token, inte inlogguppgifter

---

## Sessiontelemetri (framtida AI-planering)

Datastrukturen designas från start för att stödja insamling av "planned vs actual"-data, även om analysen byggs senare.

### Vad loggas per session

```typescript
interface SessionEvent {
  ts: number;          // Unix-timestamp
  type: 'block_start' | 'block_end' | 'drag' | 'plan_loaded';
  blockId: string;
  plannedMin?: number; // vad som stod i planen
  actualMin?: number;  // vad det faktiskt tog
  delta?: number;      // drag-justering i minuter
}
```

- **`block_start`** — när visaren går in i ett block (faktisk klocktid)
- **`block_end`** — när blocket avslutas
- **`drag`** — varje dragjustering (vad som ändrades och hur mycket)
- **`plan_loaded`** — snapshot av hela planen vid sessionstart

### Lagring
- Fas 1: `sessionStorage` (rensas vid stängning, ingen backend krävs)
- Fas 3: Synkas till Upstash om inloggad, byggs upp historik per användare

### Framtida användning
Historiken gör det möjligt att se mönster: *"Frukost är planerad 15m men tar alltid 22m"* — och låter en AI kalibrera tidsestimat personligt.

---

## Designprinciper

- Samma visuella språk som the_timer — sektorfärger, chip-etiketter, paletter, dark mode
- Enkel yta, kraftfulla funktioner under — avancerat ska gå att gräva fram
- Snabb att använda — primärflödet (klistra in schema) under 10 sekunder
- Drag och text alltid i sync — ingen källa är mer "sann" än den andra
- CleverTouch-first — inga CSS/SVG-tekniker som kraschar på display-hårdvara

---

## Planerade faser

**Fas 1 — MVP**
- Texteditor → parser → 1h-klocka + sidebar + agenda
- 12h-klocka med rullande fönster
- Drag i båda lägena
- Teman och dark mode (portade från the_timer, CleverTouch-säkra)
- localStorage-persistens
- Sessiontelemetri i sessionStorage

**Fas 2**
- Auth (användarnamn + kod)
- Delning — redigerbar fork + skrivskyddad elevlänk
- ICS/Google Calendar-import
- Cross-device sync via Upstash Redis

**Fas 3**
- Telemetrihistorik synkad till backend
- AI-kalibrering av tidsestimat
- Bibliotek med sparade dagsmönster
- Emoji-stöd för block-titlar
- URL-delning utan konto (schema i base64)
