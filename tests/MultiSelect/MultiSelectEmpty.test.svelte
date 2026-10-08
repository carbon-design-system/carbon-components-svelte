<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let filterable = true;
  export let emptyText: ComponentProps<MultiSelect>["emptyText"] = undefined;

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<MultiSelect
  labelText="Contact"
  label="Select contact methods"
  {items}
  {filterable}
  {emptyText}
/>
