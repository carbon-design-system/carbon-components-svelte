<script lang="ts">
  import Header from "../../src/UIShell/Header.svelte";
  import HeaderNav from "../../src/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "../../src/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "../../src/UIShell/HeaderNavMenu.svelte";

  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
</script>

<Header companyName="Test" platformName="Test">
  <HeaderNav>
    <HeaderNavItem href="/outside" text="Outside Link" />
    <HeaderNavMenu text="Menu" on:close={onClose}>
      <HeaderNavItem href="/item1" text="Menu Item 1" />
      <HeaderNavItem href="/item2" text="Menu Item 2" />
    </HeaderNavMenu>
  </HeaderNav>
</Header>
