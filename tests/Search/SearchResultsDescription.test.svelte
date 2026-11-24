<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import type { ComponentProps } from "svelte";

  export let debounce: ComponentProps<Search>["debounce"] = 0;
  export let value = "";
  export let describe = true;

  const items = ["Apple", "Apricot", "Banana"];

  $: matches = items.filter((item) =>
    item.toLowerCase().includes(value.toLowerCase()),
  );
</script>

<Search
  bind:value
  {debounce}
  labelText="Fruit"
  resultsDescription={describe
    ? value
      ? `${matches.length} of 3 match ${value}`
      : ""
    : undefined}
/>
