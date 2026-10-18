<script lang="ts">
  import HeaderPanelLink from "carbon-components-svelte/UIShell/HeaderPanelLink.svelte";
  import HeaderPanelLinks from "carbon-components-svelte/UIShell/HeaderPanelLinks.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
</script>

<HeaderPanelLinks>
  <HeaderPanelLink href="#docs" text="Docs" icon={Launch} />
  <HeaderPanelLink text="Plain" />
  <HeaderPanelLink href="#status">
    Status
    <svg slot="icon" data-testid="slot-icon" />
  </HeaderPanelLink>
</HeaderPanelLinks>
