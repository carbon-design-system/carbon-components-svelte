<svelte:options accessors />

<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";

  export let showFirstHeader = true;
  export let showSecondHeader = true;
  export let showSideNav = true;
  export let rail = true;
</script>

{#if showFirstHeader}
  <Header platformName="Cloud" />
{/if}
{#if showSecondHeader}
  <Header platformName="Docs" />
{/if}
{#if showSideNav}
  <SideNav {rail} />
{/if}
