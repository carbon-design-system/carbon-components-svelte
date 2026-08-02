<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";

  export let openOnHover = true;
</script>

<Header companyName="Test" platformName="Test">
  <HeaderNav>
    <HeaderNavItem href="/" text="Link 1" />
    <HeaderNavMenu text="Menu" {openOnHover}>
      <HeaderNavItem href="/item1" text="Menu Item 1" />
      <HeaderNavItem href="/item2" text="Menu Item 2" />
      <HeaderNavItem href="/item3" text="Menu Item 3" />
    </HeaderNavMenu>
  </HeaderNav>
</Header>
