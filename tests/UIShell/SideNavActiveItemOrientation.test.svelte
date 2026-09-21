<script lang="ts">
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";

  export let activeItem: "none" | "shallow" | "nested" = "none";
</script>

<SideNav>
  <SideNavItems>
    <SideNavMenu text="Menu 1" data-testid="menu-1">
      <SideNavMenuItem
        href="/one"
        text="Item 1"
        isSelected={activeItem === "shallow"}
        data-testid="shallow-item"
      />
    </SideNavMenu>
    <SideNavMenu text="Menu 2" data-testid="menu-2">
      <SideNavMenu text="Nested menu" data-testid="nested-menu">
        <SideNavMenuItem
          href="/nested"
          text="Nested item"
          isSelected={activeItem === "nested"}
          data-testid="nested-item"
        />
      </SideNavMenu>
    </SideNavMenu>
  </SideNavItems>
</SideNav>
