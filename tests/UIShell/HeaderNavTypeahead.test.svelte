<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";
</script>

<Header companyName="Test" platformName="Test">
  <HeaderNav>
    <HeaderNavItem href="/home" text="Home" />
    <HeaderNavMenu text="Tools">
      <HeaderNavItem href="/alpha" text="Alpha" />
      <HeaderNavItem href="/beta" text="Beta" />
      <HeaderNavItem href="/bravo" text="Bravo" />
    </HeaderNavMenu>
    <HeaderNavItem href="/docs" text="Docs" />
  </HeaderNav>
</Header>
