<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  export let selectedIds: string[] = ["0", "1"];
  export let required = false;
</script>

<form id="outer-form" data-testid="form"></form>
<MultiSelect
  form="outer-form"
  name="contact"
  labelText="Contact"
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ]}
  {selectedIds}
  {required}
/>
