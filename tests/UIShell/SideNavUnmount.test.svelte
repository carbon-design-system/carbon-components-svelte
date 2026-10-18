<svelte:options accessors />

<script lang="ts">
  import HamburgerMenu from "carbon-components-svelte/UIShell/HamburgerMenu.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";

  export let showSideNav = true;
  export let showOldHamburger = false;
  export let showNewHamburger = false;
  export let isOpen = false;
  export let resizable = false;
</script>

{#if showOldHamburger}
  <HamburgerMenu ariaLabel="Old menu" />
{/if}
{#if showNewHamburger}
  <HamburgerMenu ariaLabel="New menu" />
{/if}
{#if showSideNav}
  <SideNav {isOpen} {resizable} />
{/if}
