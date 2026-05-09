<script lang="ts">
  import { getContext, onMount } from "svelte";

  export let searchValue: string;

  const ctx = getContext<{
    filterRows: (value: string) => readonly (string | number)[];
  }>("carbon:DataTable");

  onMount(() => {
    ctx?.filterRows(searchValue);
  });
</script>
