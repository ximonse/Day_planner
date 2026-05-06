<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { SECTOR_COLORS } from '$lib/theme';
  import { nowMinutes } from '$lib/clock/geometry';

  let now = $state(nowMinutes());
  $effect(() => {
    const id = setInterval(() => { now = nowMinutes(); }, 1000);
    return () => clearInterval(id);
  });

  let colors = $derived(SECTOR_COLORS[appState.palette]);

  function fmt(min: number): string {
    return `${Math.floor(min/60).toString().padStart(2,'0')}:${(min%60).toString().padStart(2,'0')}`;
  }

  function status(s: number, e: number): 'past' | 'active' | 'upcoming' {
    if (now >= e) return 'past';
    if (now >= s) return 'active';
    return 'upcoming';
  }

  function blockHeight(block: { startMin: number; endMin: number }): number {
    const mins = block.endMin - block.startMin;
    return Math.max(44, Math.min(mins * 1.6, 180));
  }
</script>

<aside class="agenda">
  <div class="day-label">Idag</div>

  <div class="timeline">
    {#each appState.blocks as block, i}
      {@const color = colors[i % colors.length]}
      {@const st    = status(block.startMin, block.endMin)}
      {@const h     = blockHeight(block)}
      <div
        class="block-row {st}"
        style="height:{h}px; --accent-color:{color}"
      >
        <div class="block-inner">
          <span class="block-time">{fmt(block.startMin)}</span>
          <span class="block-title">{block.title}</span>
          <span class="block-dur">{block.endMin - block.startMin}m</span>
        </div>
        {#if st === 'active'}
          <div class="now-marker"></div>
        {/if}
      </div>
    {/each}
  </div>
</aside>

<style>
  .agenda {
    width: 220px;
    padding: 16px 0 16px 0;
    background: var(--panel);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .day-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0 14px;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 0 10px;
  }

  .block-row {
    position: relative;
    border-left: 3px solid var(--accent-color);
    border-radius: 0 8px 8px 0;
    background: var(--pill);
    transition: opacity 0.2s;
    overflow: hidden;
  }

  .block-row.past { opacity: 0.38; }

  .block-row.active {
    background: var(--pill-on);
  }

  .block-inner {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    padding: 8px 10px;
    gap: 2px;
  }

  .block-time {
    font-size: 11px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }

  .block-row.active .block-time { color: var(--pill-on-fg); opacity: 0.7; }

  .block-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .block-row.active .block-title { color: var(--pill-on-fg); }

  .block-dur {
    font-size: 11px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .block-row.active .block-dur { color: var(--pill-on-fg); opacity: 0.7; }

  .now-marker {
    position: absolute;
    left: 0; right: 0;
    bottom: 0;
    height: 2px;
    background: var(--accent-color);
    opacity: 0.6;
    border-radius: 0 1px 1px 0;
  }
</style>
