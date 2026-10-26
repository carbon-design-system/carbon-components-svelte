<svelte:options accessors />

<script lang="ts">
  import HeaderPanelLink from "carbon-components-svelte/UIShell/HeaderPanelLink.svelte";
  import HeaderPanelLinks from "carbon-components-svelte/UIShell/HeaderPanelLinks.svelte";

  export let href: string | undefined = "#alpha";
  export let ref: HTMLElement | null = null;
  export let clicks = 0;
</script>

<HeaderPanelLinks>
  <HeaderPanelLink
    {href}
    target="_blank"
    isSelected
    bind:ref
    on:click={(event) => {
      event.preventDefault();
      clicks += 1;
    }}>Alpha</HeaderPanelLink
  >
</HeaderPanelLinks>
