<script lang="ts">
  import HeaderPanelLink from "carbon-components-svelte/UIShell/HeaderPanelLink.svelte";
  import HeaderPanelLinks from "carbon-components-svelte/UIShell/HeaderPanelLinks.svelte";

  let clicks = 0;
</script>

<HeaderPanelLinks>
  <HeaderPanelLink href="#docs">Docs</HeaderPanelLink>
  <HeaderPanelLink on:click={() => (clicks += 1)}>Switch theme</HeaderPanelLink>
  <HeaderPanelLink isSelected>Current</HeaderPanelLink>
</HeaderPanelLinks>

<p data-testid="clicks">{clicks}</p>
