<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import type { ComponentProps } from "svelte";

  export let emptyText: ComponentProps<ComboBox>["emptyText"] = undefined;
  export let loading = false;
  export let loadingDelay = 0;
  export let open = false;
  export let filterMode: ComponentProps<ComboBox>["filterMode"] = undefined;
  export let items: ComponentProps<ComboBox>["items"] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<ComboBox
  labelText="Contact"
  {items}
  {emptyText}
  {loading}
  {loadingDelay}
  {open}
  {filterMode}
  shouldFilterItem={(item, value) =>
    item.text.toLowerCase().includes(value.toLowerCase())}
/>
