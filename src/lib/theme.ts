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
