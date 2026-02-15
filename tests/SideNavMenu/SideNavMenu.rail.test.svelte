<script lang="ts">
  import {
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
  } from "carbon-components-svelte";

  export let rail = true;
  export let isOpen = false;
</script>

<SideNav {rail} {isOpen}>
  <SideNavItems>
    <SideNavLink text="Link 1" href="/" />
    <SideNavMenu expanded text="Menu">
      <SideNavMenuItem href="/" text="Submenu Link 1" />
      <SideNavMenuItem href="/" text="Submenu Link 2" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>
