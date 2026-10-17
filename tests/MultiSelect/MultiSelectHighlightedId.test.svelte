<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [];
  export let filterable = false;

  let highlightedId: ComponentProps<MultiSelect>["highlightedId"] = null;
</script>

<MultiSelect labelText="Test" {items} {filterable} bind:highlightedId />

<div data-testid="bound">{highlightedId ?? ""}</div>
