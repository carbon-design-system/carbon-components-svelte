<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";

  export let currentLink2 = false;
  export let onClose: (trigger: string) => void = () => {};
</script>

<Header companyName="Test" platformName="Test">
  <HeaderNav>
    <HeaderNavItem href="/1" text="Link 1" />
    <HeaderNavMenu text="Menu" on:close={(e) => onClose(e.detail.trigger)}>
      <HeaderNavItem href="/m1" text="Menu Item 1" />
      <HeaderNavItem href="/m2" text="Menu Item 2" />
    </HeaderNavMenu>
    <HeaderNavItem href="/2" text="Link 2" isSelected={currentLink2} />
  </HeaderNav>
</Header>
<HeaderNavItem href="/standalone" text="Standalone" />
<input aria-label="After">
