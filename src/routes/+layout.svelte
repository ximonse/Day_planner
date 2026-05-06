<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { applyCssVars } from '$lib/theme';
  let { children } = $props();
</script>

<div
  class="app"
  class:dark={appState.dark}
  class:psychedelic={appState.palette === 'psychedelic'}
  style={applyCssVars(appState.palette, appState.dark)}
>
  {@render children()}
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { font-family: system-ui, sans-serif; }
  :global(.pill) {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 12px; border-radius: 999px; cursor: pointer;
    background: var(--pill); color: var(--fg);
    border: 1px solid var(--border); font-size: 0.8rem; font-weight: 500;
    user-select: none; transition: background 0.15s;
  }
  :global(.pill.on) { background: var(--pill-on); color: var(--pill-on-fg); border-color: var(--pill-on); }

  .app {
    min-height: 100dvh;
    background: var(--bg);
    color: var(--fg);
    display: flex;
    flex-direction: column;
  }

  /* Psychedelic-animation — CleverTouch-säker: bakom prefers-reduced-motion */
  .app.psychedelic { background: #220033; }
  @media (prefers-reduced-motion: no-preference) {
    .app.psychedelic {
      background: linear-gradient(135deg, #ff00ff, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff);
      background-size: 400% 400%;
      animation: psych 8s ease infinite;
    }
  }
  @keyframes psych {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }
</style>
