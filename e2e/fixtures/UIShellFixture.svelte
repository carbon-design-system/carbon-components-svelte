<script>
  import {
    Content,
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    HeaderSearch,
    HeaderSideNavItems,
    HeaderUtilities,
    ProfileMenu,
    ProfileMenuDetail,
    ProfileMenuDivider,
    ProfileMenuHeader,
    ProfileMenuItem,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";

  let isSideNavOpen = false;

  const searchResults = [
    { href: "#", text: "Result one", description: "First" },
    { href: "#", text: "Result two" },
  ];
</script>

<Header companyName="E2E" platformName="UIShell" bind:isSideNavOpen>
  <div slot="skipToContent"><SkipToContent href="#main-content" /></div>
  <HeaderUtilities>
    <HeaderSearch results={searchResults} />
    <ProfileMenu iconDescription="Profile">
      <ProfileMenuHeader name="Sadek Bazaraa" username="sbazaraa" href="#" />
      <ProfileMenuDivider />
      <ProfileMenuDetail label="Plan">
        Lite
        <a slot="action" href="#">Upgrade</a>
      </ProfileMenuDetail>
      <ProfileMenuDivider />
      <ProfileMenuItem href="#">Settings</ProfileMenuItem>
      <ProfileMenuItem on:click={() => {}}>Log out</ProfileMenuItem>
    </ProfileMenu>
  </HeaderUtilities>
  <HeaderNav aria-label="Top navigation">
    <HeaderNavItem href="#" text="Nav link" />
    <HeaderNavMenu href="#" text="Submenu">
      <HeaderNavItem href="#" text="Sub link one" />
      <HeaderNavItem href="#" text="Sub link two" />
    </HeaderNavMenu>
  </HeaderNav>
</Header>

<SideNav ariaLabel="Side navigation" bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <HeaderSideNavItems>
      <HeaderNavItem href="#" text="Side nav link" />
      <HeaderNavMenu href="#" text="Side submenu">
        <HeaderNavItem href="#" text="Side sub one" />
        <HeaderNavItem href="#" text="Side sub two" />
      </HeaderNavMenu>
      <HeaderNavItem href="#" text="Side nav last" />
    </HeaderSideNavItems>
    <SideNavLink href="#" text="Side item A" />
    <SideNavLink href="#" text="Side item B" />
    <SideNavMenu text="Side menu">
      <SideNavMenuItem href="#" text="Side menu item" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>

<Content id="main-content" tabindex="-1">
  <p data-testid="main-paragraph">Primary page content</p>
  <button data-testid="outside-header-search" type="button">
    Dismiss region
  </button>
</Content>
