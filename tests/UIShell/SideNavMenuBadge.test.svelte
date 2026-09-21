<script lang="ts">
  import BadgeIndicator from "carbon-components-svelte/BadgeIndicator/BadgeIndicator.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
</script>

<div data-testid="no-badge">
  <SideNavMenu text="Category" />
</div>

<div data-testid="badge">
  <SideNavMenu text="Category">
    <BadgeIndicator slot="badge" count={3} />
  </SideNavMenu>
</div>
