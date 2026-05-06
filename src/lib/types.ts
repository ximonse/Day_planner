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
