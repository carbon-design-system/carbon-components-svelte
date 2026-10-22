<script lang="ts">
  import SideNavFilter from "carbon-components-svelte/UIShell/SideNavFilter.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";
</script>

<SideNavItems>
  <SideNavFilter />
  <SideNavMenu text="Platform">
    <SideNavLink href="/overview" text="Overview" />
    <SideNavMenu text="Compute">
      <SideNavMenuItem href="/compute/instances" text="Instances" />
      <SideNavMenuItem href="/compute/images" text="Images" />
    </SideNavMenu>
  </SideNavMenu>
  <SideNavMenu text="Storage">
    <SideNavMenuItem href="/storage/buckets" text="Buckets" />
  </SideNavMenu>
</SideNavItems>
