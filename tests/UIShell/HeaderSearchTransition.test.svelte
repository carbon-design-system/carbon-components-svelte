<script lang="ts">
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: "results" | "rich";
  export let active = false;
  export let menuTransition: ComponentProps<HeaderSearch>["menuTransition"] =
    undefined;
  export let onEvent: (name: string) => void = () => {};
  export let onSelect: () => void = () => {};

  const results = [
    { id: "a", href: "#a", text: "Alpha" },
    { id: "b", href: "#b", text: "Beta" },
  ];
</script>

{#if kind === "results"}
  <HeaderSearch
    bind:active
    {menuTransition}
    {results}
    on:select={onSelect}
    on:introstart={() => onEvent("introstart")}
    on:introend={() => onEvent("introend")}
    on:outrostart={() => onEvent("outrostart")}
    on:outroend={() => onEvent("outroend")}
  />
{:else}
  <HeaderSearch
    bind:active
    {menuTransition}
    on:select={onSelect}
    on:introstart={() => onEvent("introstart")}
    on:introend={() => onEvent("introend")}
    on:outrostart={() => onEvent("outrostart")}
    on:outroend={() => onEvent("outroend")}
  >
    <svelte:fragment slot="menu">
      <SearchMenuItem text="Alpha" />
      <SearchMenuItem text="Beta" />
    </svelte:fragment>
  </HeaderSearch>
{/if}
