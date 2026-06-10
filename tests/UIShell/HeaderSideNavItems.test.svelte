<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderSideNavItems from "carbon-components-svelte/UIShell/HeaderSideNavItems.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";

  export let hasDivider = false;

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Carbon Svelte" bind:isSideNavOpen>
  <HeaderNav>
    <HeaderNavItem href="/" text="Link 1" />
    <HeaderNavItem href="/" text="Link 2" />
  </HeaderNav>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <HeaderSideNavItems {hasDivider} data-testid="header-side-nav-items">
      <HeaderNavItem href="/" text="Link 1" />
      <HeaderNavItem href="/" text="Link 2" />
    </HeaderSideNavItems>
    <SideNavLink text="Side nav link" />
  </SideNavItems>
</SideNav>
