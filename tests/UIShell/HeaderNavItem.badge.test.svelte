<script lang="ts">
  import BadgeIndicator from "carbon-components-svelte/BadgeIndicator/BadgeIndicator.svelte";
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
</script>

<Header companyName="Test" platformName="Test">
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" data-testid="no-badge" />
    <HeaderNavItem href="/updates" text="Updates" data-testid="dot">
      <BadgeIndicator slot="badge" count={0} />
    </HeaderNavItem>
    <HeaderNavItem href="/alerts" text="Alerts" data-testid="count">
      <BadgeIndicator slot="badge" count={3} />
    </HeaderNavItem>
    <HeaderNavItem
      href="/inbox"
      text="Inbox"
      icon={Notification}
      data-testid="icon"
    >
      <BadgeIndicator slot="badge" count={1} />
    </HeaderNavItem>
    <HeaderNavMenu text="Menu" expanded>
      <HeaderNavItem href="/menu-item" text="Menu item" data-testid="in-menu">
        <BadgeIndicator slot="badge" count={5} />
      </HeaderNavItem>
    </HeaderNavMenu>
  </HeaderNav>
</Header>
