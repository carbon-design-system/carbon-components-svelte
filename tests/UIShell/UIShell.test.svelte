<svelte:options accessors />

<script lang="ts">
  import {
    Content,
    Header,
    HeaderNav,
    HeaderNavItem,
    SideNav,
    SideNavItems,
    SideNavLink,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let headerHref: ComponentProps<Header>["href"] = undefined;
  export let company: ComponentProps<Header>["company"] = undefined;
  export let platformName: ComponentProps<Header>["platformName"] = "";
  export let isSideNavOpen: ComponentProps<Header>["isSideNavOpen"] = false;
  export let persistentHamburgerMenu: ComponentProps<Header>["persistentHamburgerMenu"] = false;
  export let ariaLabelMenu: ComponentProps<Header>["ariaLabelMenu"] = undefined;
  export let headerRef: ComponentProps<Header>["ref"] = null;
  export let headerClass = "";
  export let useSlots = false;

  export let sideNavFixed: ComponentProps<SideNav>["fixed"] = false;
  export let sideNavRail: ComponentProps<SideNav>["rail"] = false;
  export let sideNavAriaLabel: ComponentProps<SideNav>["ariaLabel"] = undefined;
  export let sideNavIsOpen: ComponentProps<SideNav>["isOpen"] = false;
  export let sideNavClass = "";

  export let headerNavClass = "";
</script>

{#if useSlots}
  <Header
    bind:isSideNavOpen
    {persistentHamburgerMenu}
    {ariaLabelMenu}
    bind:ref={headerRef}
    class={headerClass}
    on:click={() => {
      console.log("header-click");
    }}
  >
    <span slot="company">Custom Company</span>
    <span slot="platform">Custom Platform</span>
    <HeaderNav class={headerNavClass} aria-label="Navigation">
      <HeaderNavItem href="#" text="Link 1" />
      <HeaderNavItem href="#" text="Link 2" />
    </HeaderNav>
  </Header>
{:else}
  <Header
    href={headerHref}
    {company}
    {platformName}
    bind:isSideNavOpen
    {persistentHamburgerMenu}
    {ariaLabelMenu}
    bind:ref={headerRef}
    class={headerClass}
    on:click={() => {
      console.log("header-click");
    }}
  >
    <HeaderNav class={headerNavClass} aria-label="Navigation">
      <HeaderNavItem href="#" text="Link 1" />
      <HeaderNavItem href="#" text="Link 2" />
    </HeaderNav>
  </Header>
{/if}

<SideNav
  fixed={sideNavFixed}
  rail={sideNavRail}
  ariaLabel={sideNavAriaLabel}
  bind:isOpen={sideNavIsOpen}
  class={sideNavClass}
  on:open={() => {
    console.log("sidenav-open");
  }}
  on:close={() => {
    console.log("sidenav-close");
  }}
  on:click:overlay={() => {
    console.log("sidenav-overlay-click");
  }}
>
  <SideNavItems>
    <SideNavLink href="#" text="Link 1" />
    <SideNavLink href="#" text="Link 2" />
  </SideNavItems>
</SideNav>

<Content>Content goes here</Content>
