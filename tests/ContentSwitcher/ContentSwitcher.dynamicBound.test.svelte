<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";

  export let show = true;
  export let selectedIndex = 0;
  export let selectLast = false;
</script>

<ContentSwitcher
  bind:selectedIndex
  on:change={(e) => console.log("change", e.detail)}
>
  <Switch text="First" />
  {#if show}
    <Switch text="Middle" />
  {/if}
  <Switch text="Last" selected={selectLast} />
</ContentSwitcher>

<div data-testid="selected-index">{selectedIndex}</div>
