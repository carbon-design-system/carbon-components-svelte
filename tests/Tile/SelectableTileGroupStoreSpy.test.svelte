<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type { Readable } from "svelte/store";

  export let onNotify: () => void;

  const { selectedValues } = getContext<{ selectedValues: Readable<string[]> }>(
    "carbon:SelectableTileGroup",
  );

  onMount(() => selectedValues.subscribe(() => onNotify()));
</script>
