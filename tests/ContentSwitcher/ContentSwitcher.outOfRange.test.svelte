<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";

  export let selectedIndex = 0;
  export let showLast = true;
</script>

<ContentSwitcher
  bind:selectedIndex
  on:change={(e) => console.log("change", e.detail)}
>
  <Switch text="First" />
  <Switch text="Middle" />
  {#if showLast}
    <Switch text="Last" />
  {/if}
</ContentSwitcher>

<div data-testid="selected-index">{selectedIndex}</div>
