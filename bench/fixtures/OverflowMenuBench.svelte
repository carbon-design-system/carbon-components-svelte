<svelte:options accessors />

<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";

  export let count = 10;
</script>

<!--
  OverflowMenu gates its item slot behind `{#if open}` (unlike MultiSelect,
  which mounts every item up front behind display:none) — items only
  instantiate, and only then call `add()` to register, once the menu opens.
  `open` starts true so registration is included in the initial render this
  bench times, matching the "mount" semantics of the sibling benches.
-->
<OverflowMenu open>
  {#each { length: count } as _, i}
    <OverflowMenuItem text={`Item ${i}`} />
  {/each}
</OverflowMenu>
