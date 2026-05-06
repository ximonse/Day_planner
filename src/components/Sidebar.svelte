<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { SECTOR_COLORS } from '$lib/theme';
  import { nowMinutes } from '$lib/clock/geometry';

  let now = $state(nowMinutes());
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

<aside class="sidebar" class:collapsed={!appState.showSidebar}>
  <button
    class="collapse-btn"
    onclick={() => appState.showSidebar = !appState.showSidebar}
  >
    {appState.showSidebar ? '‹' : '›'}
  </button>

  {#if active}
    <h3>{active.title}</h3>
  {/if}

  <div class="seglist" bind:this={listEl}>
    {#each parts as part, i}
      {@const s = status(i)}
      {@const color = colors[i % colors.length]}
      <div class="row {s}">
        <span class="dot" style="background:{color}"></span>
        <span class="name">{part.title}</span>
        <span class="min">{part.minutes}m</span>
      </div>
      {#if part.note}
        <div class="note">{part.note}</div>
      {/if}
    {/each}
  </div>
</aside>

<style>
  .sidebar {
    width: max-content;
    min-width: 320px;
    max-width: 380px;
    background: var(--panel);
    border-right: 1px solid var(--border);
    padding: 20px 16px;
    position: relative;
    transition: margin-left .25s ease;
    overflow-y: auto;
    flex-shrink: 0;
  }
  .sidebar.collapsed {
    margin-left: calc(-1 * var(--sb-w, 320px));
  }

  .collapse-btn {
    position: fixed;
    top: 50%;
    left: calc(var(--sb-w, 320px) - 14px);
    transform: translateY(-50%);
    width: 28px; height: 28px;
    border-radius: 50%;
    background: var(--panel); color: var(--fg);
    border: 1px solid var(--border);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 600;
    z-index: 50;
    transition: left .25s ease;
  }
  .sidebar.collapsed .collapse-btn {
    left: 8px;
  }

  h3 {
    margin: 0 0 18px;
    font-size: 50px;
    color: var(--fg);
    font-weight: 800;
    text-transform: none;
    letter-spacing: -1px;
    padding: 0 10px;
    line-height: 1;
  }

  .seglist {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 48px;
    font-weight: 400;
    line-height: 1.05;
  }
  .row.active { background: var(--pill); font-weight: 500; }
  .row.past   { opacity: .45; }

  .dot  { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; }
  .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .min  { color: var(--muted); font-variant-numeric: tabular-nums; font-size: 32px; font-weight: 500; min-width: 6ch; text-align: right; flex-shrink: 0; }
  .note { color: var(--muted); font-size: 22px; line-height: 1.2; padding: 0 12px 8px 50px; white-space: pre-wrap; }
</style>
