<svelte:options accessors />

<script lang="ts">
  import HeaderPanelDivider from "carbon-components-svelte/UIShell/HeaderPanelDivider.svelte";
  import HeaderPanelLink from "carbon-components-svelte/UIShell/HeaderPanelLink.svelte";
  import HeaderPanelLinks from "carbon-components-svelte/UIShell/HeaderPanelLinks.svelte";

  export let showMiddle = false;
</script>

<HeaderPanelLinks>
  <HeaderPanelLink href="#a">Alpha</HeaderPanelLink>
  <HeaderPanelDivider>Group</HeaderPanelDivider>
  <HeaderPanelLink>Beta</HeaderPanelLink>
  {#if showMiddle}
    <HeaderPanelLink href="#b2">Between</HeaderPanelLink>
  {/if}
  <HeaderPanelLink href="#c">Gamma</HeaderPanelLink>
</HeaderPanelLinks>

<HeaderPanelLinks>
  <HeaderPanelLink href="#other">Other list</HeaderPanelLink>
</HeaderPanelLinks>
