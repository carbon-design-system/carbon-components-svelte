<script lang="ts">
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
  import Motion from "carbon-components-svelte/motion/Motion.svelte";
  import type { MotionValue } from "carbon-components-svelte/motion/context.js";
  import type { ComponentProps } from "svelte";

  export let kind: "results" | "rich";
  export let active = false;
  export let transition: ComponentProps<HeaderSearch>["transition"] = undefined;
  export let onEvent: (name: string) => void = () => {};
  export let onSelect: () => void = () => {};
  export let motionMenu: MotionValue = undefined;

  const results = [
    { id: "a", href: "#a", text: "Alpha" },
    { id: "b", href: "#b", text: "Beta" },
  ];
</script>

<Motion menu={motionMenu}>
  {#if kind === "results"}
    <HeaderSearch
      bind:active
      {transition}
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
      {transition}
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
</Motion>
