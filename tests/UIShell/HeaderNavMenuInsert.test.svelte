<svelte:options accessors />

<script lang="ts">
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";

  export let showFirst = false;
</script>

<HeaderNavMenu expanded text="Products">
  {#if showFirst}
    <HeaderNavItem href="#first" text="First" />
  {/if}
  <HeaderNavItem href="#compute" text="Compute" />
  <HeaderNavItem href="#storage" text="Storage" />
</HeaderNavMenu>
<input aria-label="Search docs" />
