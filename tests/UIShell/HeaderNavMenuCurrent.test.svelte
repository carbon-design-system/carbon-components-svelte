<svelte:options accessors />

<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";

  export let showBeta = true;
</script>

<Header companyName="IBM" platformName="Cloud">
  <HeaderNav>
    <HeaderNavMenu text="Products">
      <HeaderNavItem href="#compute" text="Compute" />
      {#if showBeta}
        <HeaderNavItem href="#quantum" text="Quantum (beta)" isSelected />
      {/if}
    </HeaderNavMenu>
  </HeaderNav>
</Header>
