<svelte:options accessors />

<script lang="ts">
  import HeaderPanelLink from "carbon-components-svelte/UIShell/HeaderPanelLink.svelte";
  import HeaderPanelLinks from "carbon-components-svelte/UIShell/HeaderPanelLinks.svelte";

  export let href: string | undefined = "#alpha";
</script>

<HeaderPanelLinks>
  <HeaderPanelLink {href}>Alpha</HeaderPanelLink>
  <HeaderPanelLink>Beta</HeaderPanelLink>
  <HeaderPanelLink href="#gamma">Gamma</HeaderPanelLink>
</HeaderPanelLinks>
