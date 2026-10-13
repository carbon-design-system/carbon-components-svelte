<script lang="ts">
  import BadgeIndicator from "carbon-components-svelte/BadgeIndicator/BadgeIndicator.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";
</script>

<SideNavMenu text="Folders" expanded>
  <SideNavMenuItem href="/drafts" text="Drafts" data-testid="no-badge" />
  <SideNavMenuItem href="/archive" text="Archive" data-testid="count">
    <BadgeIndicator slot="badge" count={2} />
  </SideNavMenuItem>
</SideNavMenu>
