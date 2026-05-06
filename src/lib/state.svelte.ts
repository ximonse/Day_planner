import { browser } from '$app/environment';
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

function loadSaved(): Partial<AppState> {
  if (!browser) return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); }
  catch { return {}; }
}

class State {
  palette    = $state<Palette>('sansad');
  dark       = $state<boolean>(false);
  source     = $state<string>(DEFAULT_SOURCE);
  clockMode  = $state<ClockMode>('1h');
  showSidebar = $state<boolean>(true);
  showAgenda  = $state<boolean>(true);
  showEditor  = $state<boolean>(false);
  blocks      = $derived<Block[]>(parseSource(this.source));

  constructor() {
    const saved = loadSaved();
    if (saved.palette)     this.palette     = saved.palette;
    if (saved.dark != null) this.dark       = saved.dark;
    if (saved.source)      this.source      = saved.source;
    if (saved.clockMode)   this.clockMode   = saved.clockMode;
    if (saved.showSidebar != null) this.showSidebar = saved.showSidebar;
    if (saved.showAgenda  != null) this.showAgenda  = saved.showAgenda;
    if (saved.showEditor  != null) this.showEditor  = saved.showEditor;

    $effect.root(() => {
      $effect(() => {
        if (!browser) return;
        localStorage.setItem(KEY, JSON.stringify({
          palette: this.palette,
          dark: this.dark,
          source: this.source,
          clockMode: this.clockMode,
          showSidebar: this.showSidebar,
          showAgenda: this.showAgenda,
          showEditor: this.showEditor,
        }));
      });
    });
  }
}

export const appState = new State();
