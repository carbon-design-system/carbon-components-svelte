<script lang="ts">
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";

  /** Which component gets the rest props. */
  export let under: "link" | "menu-item" = "link";
</script>

<SideNav isOpen>
  <SideNavItems>
    <SideNavLink
      href="/"
      text="Home"
      {...under === "link" ? $$restProps : {}}
    />
    <SideNavMenu text="Settings" expanded>
      <SideNavMenuItem
        href="/profile"
        text="Profile"
        {...under === "menu-item" ? $$restProps : {}}
      />
    </SideNavMenu>
  </SideNavItems>
</SideNav>
