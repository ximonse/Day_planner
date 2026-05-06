<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { SECTOR_COLORS } from '$lib/theme';
  import { nowMinutes } from '$lib/clock/geometry';

  let now    = $state(nowMinutes());
  $effect(() => {
    const id = setInterval(() => { now = nowMinutes(); }, 1000);
    return () => clearInterval(id);
  });

  let active  = $derived(appState.blocks.find(b => now >= b.startMin && now < b.endMin) ?? appState.blocks[0] ?? null);
  let parts   = $derived(active?.parts ?? []);
  let colors  = $derived(SECTOR_COLORS[appState.palette]);
  let elapsed = $derived(active ? now - active.startMin : 0);

  function cumStart(i: number) { return parts.slice(0, i).reduce((s, p) => s + p.minutes, 0); }
  function status(i: number): 'past' | 'active' | 'upcoming' {
    const cs = cumStart(i);
    if (elapsed >= cs + parts[i].minutes) return 'past';
    if (elapsed >= cs) return 'active';
    return 'upcoming';
  }

  let activeIdx = $derived(parts.findIndex((_, i) => status(i) === 'active'));
  let listEl: HTMLElement | null = $state(null);

  $effect(() => {
    if (!listEl || activeIdx < 0) return;
    const el = listEl.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
</script>

<aside class="sidebar">
  {#if active}
    <div class="block-title">{active.title}</div>
  {/if}
  <ul class="list" bind:this={listEl}>
    {#each parts as part, i}
      {@const s = status(i)}
      {@const color = colors[i % colors.length]}
      <li class="part {s}">
        <span class="dot" style="background:{color}"></span>
        <span class="name">{part.title}</span>
        <span class="mins">{part.minutes}m</span>
        {#if part.note}<div class="note">{part.note}</div>{/if}
      </li>
    {/each}
  </ul>
</aside>

<style>
  .sidebar { width:220px; padding:16px 12px; background:var(--panel); border-right:1px solid var(--border); display:flex; flex-direction:column; gap:8px; overflow:hidden; }
  .block-title { font-size:1rem; font-weight:600; padding-bottom:8px; border-bottom:1px solid var(--border); }
  .list { list-style:none; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:4px; }
  .part { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; }
  .part.past    { opacity:0.35; }
  .part.active  { background:var(--pill); font-weight:600; }
  .dot  { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .name { flex:1; font-size:0.9rem; }
  .mins { font-size:0.8rem; color:var(--muted); }
  .note { font-size:0.75rem; color:var(--muted); padding-left:18px; width:100%; }
</style>
