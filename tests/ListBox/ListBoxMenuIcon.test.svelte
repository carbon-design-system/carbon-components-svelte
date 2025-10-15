<svelte:options accessors />

<script lang="ts">
  import { ListBoxMenuIcon } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let open: ComponentProps<ListBoxMenuIcon>["open"] = false;
  export let translateWithId: ComponentProps<ListBoxMenuIcon>["translateWithId"] =
    undefined;
</script>

<ListBoxMenuIcon {open} {translateWithId} on:click {...$$restProps} />
