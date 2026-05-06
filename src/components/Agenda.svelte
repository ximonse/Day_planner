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
