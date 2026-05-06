<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { clockTheme } from '$lib/theme';
  import { nowMinutes } from '$lib/clock/geometry';
  import Clock1h  from './Clock1h.svelte';
  import Clock12h from './Clock12h.svelte';

  let now = $state(nowMinutes());
  $effect(() => {
    const id = setInterval(() => { now = nowMinutes(); }, 1000);
    return () => clearInterval(id);
  });

  let theme = $derived(clockTheme(appState.palette, appState.dark));
</script>

<div class="wrap">
  <div class="toggle">
    <button class="pill" class:on={appState.clockMode === '1h'}
      onclick={() => appState.clockMode = '1h'}>1h</button>
    <button class="pill" class:on={appState.clockMode === '12h'}
      onclick={() => appState.clockMode = '12h'}>12h</button>
  </div>

  {#if appState.clockMode === '1h'}
    <Clock1h blocks={appState.blocks} palette={appState.palette} {theme} {now} />
  {:else}
    <Clock12h blocks={appState.blocks} palette={appState.palette} {theme} {now} />
  {/if}
</div>

<style>
  .wrap  { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .toggle { display: flex; gap: 4px; }
</style>
