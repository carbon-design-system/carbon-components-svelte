<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [];
  export let filterable = false;
  export let open = false;
  export let placeholder = "Filter...";
  export let emptyContent = "Loading…";
</script>

<MultiSelect {items} {filterable} {open} {placeholder} labelText="Roles">
  <svelte:fragment slot="empty">{emptyContent}</svelte:fragment>
</MultiSelect>
