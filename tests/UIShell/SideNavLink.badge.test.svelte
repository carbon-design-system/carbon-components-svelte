<script lang="ts">
  import BadgeIndicator from "carbon-components-svelte/BadgeIndicator/BadgeIndicator.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";
</script>

<SideNav isOpen>
  <SideNavItems>
    <SideNavLink href="/inbox" text="Inbox" data-testid="no-badge" />
    <SideNavLink href="/notifications" text="Notifications" data-testid="dot">
      <BadgeIndicator slot="badge" count={0} />
    </SideNavLink>
    <SideNavLink href="/messages" text="Messages" data-testid="count">
      <BadgeIndicator slot="badge" count={4} />
    </SideNavLink>
    <SideNavMenu text="Folders" expanded>
      <SideNavMenuItem
        href="/drafts"
        text="Drafts"
        data-testid="menu-item-no-badge"
      />
      <SideNavMenuItem
        href="/archive"
        text="Archive"
        data-testid="menu-item-count"
      >
        <BadgeIndicator slot="badge" count={2} />
      </SideNavMenuItem>
    </SideNavMenu>
  </SideNavItems>
</SideNav>
