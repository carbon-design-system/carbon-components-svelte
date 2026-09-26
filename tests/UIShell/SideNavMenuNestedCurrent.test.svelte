<script lang="ts">
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";
</script>

<SideNavMenu text="Level 1">
  <SideNavMenu text="Level 2">
    <SideNavMenu text="Level 3">
      <SideNavMenuItem href="/current" text="Current" isSelected />
    </SideNavMenu>
  </SideNavMenu>
  <SideNavMenu text="Sibling">
    <SideNavMenuItem href="/other" text="Other" />
  </SideNavMenu>
</SideNavMenu>
