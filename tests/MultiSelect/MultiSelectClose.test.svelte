<script lang="ts">
  import MultiSelect from "../../src/MultiSelect/MultiSelect.svelte";

  export let filterable = false;
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<button type="button">Outside</button>
<MultiSelect
  {filterable}
  {items}
  labelText="Contact"
  label="Select contact methods"
  placeholder="Filter contacts"
  on:close={onClose}
/>
