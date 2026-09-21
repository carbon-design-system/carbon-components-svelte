<script lang="ts">
  import BadgeIndicator from "carbon-components-svelte/BadgeIndicator/BadgeIndicator.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
</script>

<div data-testid="no-badge">
  <SideNavLink text="Overview" href="/" />
</div>

<div data-testid="badge">
  <SideNavLink text="Overview" href="/">
    <BadgeIndicator slot="badge" count={3} />
  </SideNavLink>
</div>
