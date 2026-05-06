<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { logEvent } from '$lib/telemetry';
  import type { Palette } from '$lib/types';
  import Clock   from '$components/Clock.svelte';
  import Sidebar from '$components/Sidebar.svelte';
  import Agenda  from '$components/Agenda.svelte';
  import Editor  from '$components/Editor.svelte';

  $effect(() => { logEvent({ type: 'plan_loaded', blockId: 'root' }); });

  const PALETTE_DOTS: Record<Palette, string> = {
    sansad: '#e07a5f', meadow: '#7cb518', mlp: '#cdb4db',
    bright: '#f86624', clear: '#9a031e', psychedelic: '#ff00ff'
  };
</script>

<div class="main">
  {#if appState.showSidebar}<Sidebar />{/if}
  <div class="center">
    <Clock />
    <div class="toolbar">
      <button class="icon-btn" class:on={appState.showEditor}
        onclick={() => appState.showEditor = !appState.showEditor} title="Redigera">✎</button>
      <button class="icon-btn" class:on={appState.showAgenda}
        onclick={() => appState.showAgenda = !appState.showAgenda} title="Agenda">☰</button>
    </div>
  </div>
  {#if appState.showAgenda}<Agenda />{/if}
</div>

<Editor />

<div class="theme-dots">
  {#each ['sansad','meadow','mlp','bright','clear','psychedelic'] as p}
    <button
      class="theme-dot"
      class:active={appState.palette === (p as Palette)}
      style="background:{PALETTE_DOTS[p as Palette]}"
      title={p}
      onclick={() => appState.palette = (p as Palette)}
    ></button>
  {/each}
  <button class="dark-toggle" onclick={() => appState.dark = !appState.dark} title="Dag/Natt">
    {appState.dark ? '☾' : '☀'}
  </button>
</div>

<style>
  .main   { flex:1; display:flex; }
  .center { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; gap:8px; }

  .toolbar {
    display: flex; gap: 6px; justify-content: center;
    opacity: 0.25; transition: opacity 0.2s;
  }
  .toolbar:hover { opacity: 1; }
  .icon-btn {
    background: none; border: none; cursor: pointer;
    font-size: 1.1rem; color: var(--fg); padding: 4px 8px;
    border-radius: 6px;
  }
  .icon-btn:hover { background: var(--pill); }
  .icon-btn.on { background: var(--pill); opacity: 1; }

  .theme-dots {
    position: fixed; bottom: 16px; right: 16px;
    display: flex; align-items: center; gap: 6px; z-index: 20;
  }
  .theme-dot {
    width: 18px; height: 18px; border-radius: 50%;
    border: none; cursor: pointer; opacity: 0.45;
    transition: opacity 0.15s;
  }
  .theme-dot:hover { opacity: 0.8; }
  .theme-dot.active { opacity: 1; box-shadow: 0 0 0 2px var(--fg); }
  .dark-toggle {
    background: none; border: none; cursor: pointer;
    font-size: 1rem; color: var(--fg); opacity: 0.5;
    padding: 2px 4px;
  }
  .dark-toggle:hover { opacity: 1; }
</style>
