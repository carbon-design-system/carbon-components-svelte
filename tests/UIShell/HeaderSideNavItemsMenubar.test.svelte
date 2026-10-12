<script lang="ts">
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";
  import HeaderSideNavItems from "carbon-components-svelte/UIShell/HeaderSideNavItems.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";

  export let currentLink2 = false;
  export let onClose: (trigger: string) => void = () => {};
</script>

<SideNav isOpen>
  <SideNavItems>
    <HeaderSideNavItems>
      <HeaderNavItem href="/1" text="Link 1" />
      <HeaderNavMenu text="Menu" on:close={(e) => onClose(e.detail.trigger)}>
        <HeaderNavItem href="/m1" text="Menu Item 1" />
        <HeaderNavItem href="/m2" text="Menu Item 2" />
      </HeaderNavMenu>
      <HeaderNavItem href="/2" text="Link 2" isSelected={currentLink2} />
    </HeaderSideNavItems>
  </SideNavItems>
</SideNav>
