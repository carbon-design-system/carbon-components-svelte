<script>
  import {
    Content,
    Header,
    HeaderAction,
    HeaderActionLink,
    HeaderGlobalAction,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    HeaderPanelDivider,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderSideNavItems,
    HeaderUtilities,
    SideNav,
    SideNavDivider,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";
  import Activity from "carbon-icons-svelte/lib/Activity.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Help from "carbon-icons-svelte/lib/Help.svelte";
  import Kubernetes from "carbon-icons-svelte/lib/Kubernetes.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import UserAvatarFilledAlt from "carbon-icons-svelte/lib/UserAvatarFilledAlt.svelte";

  let isSideNavOpen = true;
  let panelOpen = true;
</script>

<!--
  UI Shell variants for e2e/cascade-snapshot.ts: rail side nav with icons,
  expanded submenu, selected states, header actions (icon, icon+text, link,
  global), an open header panel, header nav with a selected item and an
  expanded menu, and the header nav mirrored into the side nav below `lg`.
  Capture at 1280x900 and 320x640.
-->
<Header companyName="E2E" platformName="Variants" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderNav aria-label="Top navigation">
    <HeaderNavItem href="#" text="Selected" isSelected />
    <HeaderNavItem href="#" text="Plain" />
    <HeaderNavItem href="#" text="With icon" icon={Launch} />
    <HeaderNavMenu text="Expanded" expanded>
      <HeaderNavItem href="#" text="Sub one" />
      <HeaderNavItem href="#" text="Sub selected" isSelected />
    </HeaderNavMenu>
    <HeaderNavMenu text="Collapsed">
      <HeaderNavItem href="#" text="Sub two" />
    </HeaderNavMenu>
  </HeaderNav>
  <HeaderUtilities>
    <HeaderGlobalAction iconDescription="Notifications" icon={Notification} />
    <HeaderGlobalAction iconDescription="Help" icon={Help} isActive />
    <HeaderActionLink href="#" icon={Launch} />
    <HeaderActionLink href="#" icon={Launch} linkIsActive />
    <HeaderAction icon={UserAvatarFilledAlt} text="Account" />
    <HeaderAction bind:isOpen={panelOpen} icon={UserAvatarFilledAlt} transition={false}>
      <HeaderPanelLinks>
        <HeaderPanelDivider>Switcher</HeaderPanelDivider>
        <HeaderPanelLink href="#">Link 1</HeaderPanelLink>
        <HeaderPanelLink href="#" isSelected>Selected</HeaderPanelLink>
        <HeaderPanelDivider>More</HeaderPanelDivider>
        <HeaderPanelLink href="#">Link 3</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>

<SideNav bind:isOpen={isSideNavOpen} rail ariaLabel="Side navigation">
  <SideNavItems>
    <HeaderSideNavItems hasDivider>
      <HeaderNavItem href="#" text="Catalog" />
      <HeaderNavMenu text="Manage" expanded>
        <HeaderNavItem href="#" text="Account" isSelected />
      </HeaderNavMenu>
    </HeaderSideNavItems>
    <SideNavLink icon={Dashboard} text="Dashboard" href="#" isSelected />
    <SideNavLink icon={Activity} text="Activity tracker" href="#" />
    <SideNavLink text="No icon" href="#" />
    <SideNavLink text="Large" href="#" large />
    <SideNavMenu expanded icon={Kubernetes} text="Kubernetes">
      <SideNavMenuItem href="#" text="Clusters" isSelected />
      <SideNavMenuItem href="#" text="Worker pools" />
    </SideNavMenu>
    <SideNavMenu text="Collapsed">
      <SideNavMenuItem href="#" text="Hidden" />
    </SideNavMenu>
    <SideNavDivider />
    <SideNavLink text="Settings" href="#" />
  </SideNavItems>
</SideNav>

<Content>
  <p>Content</p>
</Content>
