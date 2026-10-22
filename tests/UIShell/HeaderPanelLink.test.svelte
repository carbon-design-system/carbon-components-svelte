<script lang="ts">
  import HeaderPanelLink from "carbon-components-svelte/UIShell/HeaderPanelLink.svelte";
  import HeaderPanelLinks from "carbon-components-svelte/UIShell/HeaderPanelLinks.svelte";
  import type { ComponentProps } from "svelte";

  export let listProps: ComponentProps<HeaderPanelLinks> = {};
</script>

<h2 id="panel-links-heading">Workspace tools</h2>
<HeaderPanelLinks {...listProps}>
  <HeaderPanelLink href="#docs">Docs</HeaderPanelLink>
  <HeaderPanelLink>Switch theme</HeaderPanelLink>
  <HeaderPanelLink isSelected>Current</HeaderPanelLink>
</HeaderPanelLinks>
