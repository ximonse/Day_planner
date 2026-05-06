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

  let activeBlock = $derived(
    appState.blocks.find(b => now >= b.startMin && now < b.endMin) ?? null
  );

  function fmt(min: number): string {
    return `${Math.floor(min/60).toString().padStart(2,'0')}:${Math.floor(min%60).toString().padStart(2,'0')}`;
  }

  let timeLeft = $derived(() => {
    if (!activeBlock) return '';
    const left = activeBlock.endMin - now;
    if (left <= 0) return '0:00 kvar';
    const m = Math.floor(left);
    const s = Math.floor((left - m) * 60);
    return `${m}:${s.toString().padStart(2,'0')} kvar`;
  });
</script>

{#if activeBlock}
  <div class="lesson-title">{activeBlock.title}</div>
{/if}

<div class="top-time">
  <div class="now">{fmt(now)}</div>
  {#if activeBlock}
    <div class="left">{timeLeft()}</div>
  {/if}
</div>

<div class="clock-wrap">
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
  .lesson-title {
    position: absolute;
    top: 24px; left: 32px;
    font-size: 72px; font-weight: 200; line-height: 1;
    letter-spacing: -2px;
    color: var(--fg);
    max-width: 55%;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    pointer-events: none;
  }

  .top-time { text-align: center; }
  .top-time .now {
    font-size: 72px; font-weight: 200; letter-spacing: -2px; line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .top-time .left {
    font-size: 20px; color: var(--muted); margin-top: 6px;
    font-variant-numeric: tabular-nums; font-weight: 500;
  }

  .clock-wrap {
    position: relative;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }

  .toggle { display: flex; gap: 4px; }
</style>
