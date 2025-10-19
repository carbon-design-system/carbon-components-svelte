<svelte:options accessors />

<script lang="ts">
  import { ListBoxSelection } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let selectionCount: ComponentProps<ListBoxSelection>["selectionCount"] =
    undefined;
  export let disabled: ComponentProps<ListBoxSelection>["disabled"] = false;
  export let translateWithId: ComponentProps<ListBoxSelection>["translateWithId"] =
    undefined;
  export let ref: ComponentProps<ListBoxSelection>["ref"] = null;
  export let onclear: ((e: CustomEvent) => void) | undefined = undefined;
</script>

<ListBoxSelection
  {selectionCount}
  {disabled}
  {translateWithId}
  bind:ref
  {onclear}
  {...$$restProps}
/>
