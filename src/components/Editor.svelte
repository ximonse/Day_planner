<script lang="ts">
  import { appState } from '$lib/state.svelte';
</script>

{#if appState.showEditor}
  <div class="wrap">
    <textarea
      class="editor"
      bind:value={appState.source}
      spellcheck="false"
      autocomplete="off"
      placeholder="Skriv din dagsplan..."
    ></textarea>
  </div>
{/if}

<style>
  .wrap {
    position: fixed; bottom:0; left:0; right:0; height:40vh;
    background:var(--panel); border-top:2px solid var(--border); z-index:10;
  }
  .editor {
    width:100%; height:100%; padding:12px 16px;
    background:transparent; color:var(--fg);
    border:none; resize:none; outline:none;
    font-family:'Courier New', monospace; font-size:0.9rem; line-height:1.6;
  }
</style>
