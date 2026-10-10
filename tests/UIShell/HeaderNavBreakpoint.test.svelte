<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderSideNavItems from "carbon-components-svelte/UIShell/HeaderSideNavItems.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";

  export let expansionBreakpoint: number | undefined = undefined;
  export let standalone = false;
</script>

{#if standalone}
  <HeaderNav aria-label="Standalone">
    <HeaderNavItem href="/a" text="Deployments" />
  </HeaderNav>
{:else}
  <Header {expansionBreakpoint}>
    <HeaderNav aria-label="Header links">
      <HeaderNavItem href="/a" text="Deployments" />
      <HeaderNavItem href="/b" text="Incidents" />
    </HeaderNav>
  </Header>
  <SideNav isOpen={false} {expansionBreakpoint}>
    <SideNavItems>
      <HeaderSideNavItems aria-label="Side links">
        <HeaderNavItem href="/a" text="Deployments" />
        <HeaderNavItem href="/b" text="Incidents" />
      </HeaderSideNavItems>
    </SideNavItems>
  </SideNav>
{/if}
