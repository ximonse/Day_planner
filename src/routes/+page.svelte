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
      <button class="icon" onclick={() => appState.showSidebar = !appState.showSidebar} title="Lista">⚙︎</button>
      <button class="icon" onclick={() => appState.showEditor  = !appState.showEditor}  title="Redigera">⚒︎</button>
      <button class="icon" onclick={() => appState.showAgenda  = !appState.showAgenda}  title="Agenda">ⓘ</button>
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
  <button class="dark-toggle" class:active={appState.dark}
    onclick={() => appState.dark = !appState.dark} title="Dag/Natt"></button>
</div>

<style>
  .main   { flex:1; display:flex; }
  .center { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; gap:8px; }

  .toolbar {
    display: flex; align-items: center; gap: 8px;
    background: transparent; border: 0;
    border-radius: 999px; padding: 4px 6px;
    position: relative;
    opacity: 0.55; transition: opacity .2s;
  }
  .toolbar:hover { opacity: 1; }
  .toolbar .icon {
    background: transparent; border: 0; color: var(--muted);
    cursor: pointer; font-size: 16px; padding: 4px 8px;
    border-radius: 999px;
    font-family: "Segoe UI Symbol", "Apple Symbols", system-ui, sans-serif;
    font-variant-emoji: text;
  }
  .toolbar .icon:hover { background: var(--pill); color: var(--fg); }

  .theme-dots {
    position: fixed; top: 10px; right: 10px;
    display: flex; align-items: center; gap: 7px; z-index: 55;
  }
  .theme-dot {
    width: 9px; height: 9px; border-radius: 50%;
    border: none; cursor: pointer; opacity: 0.3;
    transition: opacity .2s;
  }
  .theme-dot:hover { opacity: 0.7; }
  .theme-dot.active { opacity: 0.9; }
  .dark-toggle {
    width: 14px; height: 9px; border-radius: 5px; border: 0; padding: 0;
    background: var(--fg); opacity: 0.2; cursor: pointer;
    transition: opacity .2s;
  }
  .dark-toggle:hover { opacity: 0.6; }
  .dark-toggle.active { opacity: 0.55; }
</style>
