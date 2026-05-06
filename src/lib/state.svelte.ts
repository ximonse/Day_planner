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
