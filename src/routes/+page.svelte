<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { logEvent } from '$lib/telemetry';
  import Clock   from '$components/Clock.svelte';
  import Sidebar from '$components/Sidebar.svelte';
  import Agenda  from '$components/Agenda.svelte';
  import Editor  from '$components/Editor.svelte';

  $effect(() => { logEvent({ type: 'plan_loaded', blockId: 'root' }); });
</script>

<nav class="toolbar">
  <button class="pill" class:on={appState.showSidebar}
    onclick={() => appState.showSidebar = !appState.showSidebar}>Lista</button>
  <button class="pill" class:on={appState.showAgenda}
    onclick={() => appState.showAgenda = !appState.showAgenda}>Agenda</button>
  <button class="pill" class:on={appState.showEditor}
    onclick={() => appState.showEditor = !appState.showEditor}>Redigera</button>
  <button class="pill" class:on={appState.dark}
    onclick={() => appState.dark = !appState.dark}>Mörkt</button>
  <select class="pill palette-sel" bind:value={appState.palette}>
    {#each ['sansad','meadow','mlp','bright','clear','psychedelic'] as p}
      <option value={p}>{p}</option>
    {/each}
  </select>
</nav>

<div class="main">
  {#if appState.showSidebar}<Sidebar />{/if}
  <div class="center"><Clock /></div>
  {#if appState.showAgenda}<Agenda />{/if}
</div>

<Editor />

<style>
  .toolbar {
    display:flex; gap:6px; padding:10px 16px;
    background:var(--panel); border-bottom:1px solid var(--border); flex-wrap:wrap;
  }
  .palette-sel {
    background:var(--pill); color:var(--fg); border:1px solid var(--border);
    border-radius:999px; padding:4px 12px; font-size:0.8rem; cursor:pointer; outline:none;
  }
  .main   { flex:1; display:flex; overflow:hidden; }
  .center { flex:1; display:flex; align-items:center; justify-content:center; padding:24px; }
</style>
