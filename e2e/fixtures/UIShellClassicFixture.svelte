<script>
  import {
    Content,
    Header,
    HeaderAction,
    HeaderNav,
    HeaderNavItem,
    HeaderPanelDivider,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderSwitcher,
    HeaderUtilities,
    ProfileMenu,
    ProfileMenuDivider,
    ProfileMenuHeader,
    ProfileMenuItem,
    ProfileMenuList,
    SideNav,
    SideNavItems,
    SideNavLink,
    SkipToContent,
    UserAvatar,
  } from "carbon-components-svelte";

  let panelOpen = true;
</script>

<!--
  Classic UI Shell for e2e/cascade-snapshot.ts. g100 header, white side nav,
  open header panel, ProfileMenu, and HeaderSwitcher. The panel,
  ProfileMenu, and HeaderSwitcher have color-scheme: dark or cascade-order
  rules that only apply while open under the header.
-->
<Header companyName="E2E" platformName="Classic" theme="classic">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderNav aria-label="Top navigation">
    <HeaderNavItem href="#" text="Catalog" />
    <HeaderNavItem href="#" text="Docs" />
  </HeaderNav>
  <HeaderSwitcher text="Acme Corp" isOpen>
    <svelte:fragment slot="avatar">
      <UserAvatar name="Acme Corp" backgroundColor="auto" size="sm" />
    </svelte:fragment>
    <ProfileMenuList>
      <ProfileMenuItem>Acme Corp</ProfileMenuItem>
      <ProfileMenuItem>Globex Industries</ProfileMenuItem>
    </ProfileMenuList>
  </HeaderSwitcher>
  <HeaderUtilities>
    <ProfileMenu iconDescription="Profile" isOpen>
      <UserAvatar slot="avatar" size="md" name="Richard Hendricks" />
      <ProfileMenuHeader name="Richard Hendricks" username="rhendricks">
        <UserAvatar slot="avatar" size="lg" name="Richard Hendricks" />
      </ProfileMenuHeader>
      <ProfileMenuDivider />
      <ProfileMenuList>
        <ProfileMenuItem href="/">Settings</ProfileMenuItem>
        <ProfileMenuItem href="/">Log out</ProfileMenuItem>
      </ProfileMenuList>
    </ProfileMenu>
    <HeaderAction bind:isOpen={panelOpen} transition={false}>
      <HeaderPanelLinks>
        <HeaderPanelDivider>Switcher</HeaderPanelDivider>
        <HeaderPanelLink href="#">Link 1</HeaderPanelLink>
        <HeaderPanelLink href="#" isSelected>Selected</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>

<SideNav theme="classic" isOpen ariaLabel="Side navigation">
  <SideNavItems>
    <SideNavLink text="Dashboard" href="#" isSelected />
    <SideNavLink text="Resource list" href="#" />
  </SideNavItems>
</SideNav>

<Content>
  <p>Content</p>
</Content>
