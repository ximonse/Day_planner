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

<svg class="clock" viewBox="0 0 400 400">
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
  {/each}

  <!-- Donut-hål -->
  <circle cx={CX} cy={CY} r={Ri} fill={theme.bg} />

  <!-- Centrertext: slutar HH:MM -->
  {#if active}
    <text x={CX} y={CY - 8} text-anchor="middle" font-size="11" fill={theme.centerMuted}>slutar</text>
    <text x={CX} y={CY + 12} text-anchor="middle" font-size="20" font-weight="200"
      letter-spacing="-0.5" fill={theme.centerMain}>{fmt(active.endMin)}</text>
  {/if}

  <!-- Chip-etiketter -->
  {#each parts as part, i}
    {@const color = colors[i % colors.length]}
    {@const mid = (a0(i) + a1(i)) / 2}
    {@const lp = degreesToPoint(CX, CY, (R + Ri) / 2, mid)}
    <rect x={lp.x - 38} y={lp.y - 11} width={76} height={22} rx={3}
      fill={theme.chip} stroke={color} stroke-width="1" opacity="0.95" />
    <text x={lp.x} y={lp.y + 5} text-anchor="middle" dominant-baseline="middle"
      font-size="11" fill={color} font-weight="600" pointer-events="none">
      {part.title} {part.minutes}m
    </text>
  {/each}

  <!-- Visare -->
  <path d={hPath} fill={theme.handDark} opacity="0.9" />
  <path d={hPath} fill={theme.handLight} opacity="0.3" />

  <!-- Tickmärken: vit halo + markfärg ovanpå -->
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

<style>
  .clock {
    display: block;
    user-select: none;
    touch-action: none;
    overflow: visible;
    width: min(85vh, calc(100vw - 320px - 220px));
    height: min(85vh, calc(100vw - 320px - 220px));
  }
</style>
