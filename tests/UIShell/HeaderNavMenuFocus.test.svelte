<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";

  export let expanded = false;
</script>

<Header companyName="IBM" platformName="Cloud">
  <HeaderNav>
    <HeaderNavMenu bind:expanded text="Products">
      <HeaderNavItem href="#compute" text="Compute" />
      <HeaderNavItem href="#storage" text="Storage" />
    </HeaderNavMenu>
    <HeaderNavItem href="#pricing" text="Pricing" />
  </HeaderNav>
</Header>
<input aria-label="Search docs">
