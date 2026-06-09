<script lang="ts">
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";

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
