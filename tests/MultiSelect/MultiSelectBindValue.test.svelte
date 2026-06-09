<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [];
  export let filterable = false;
  export let value = "";
  export let open: ComponentProps<MultiSelect>["open"] = false;
</script>

<MultiSelect {items} {filterable} bind:value bind:open labelText="Test" />

<div data-testid="bound-value">{value}</div>
