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
