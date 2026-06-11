<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];

  export let fluid = true;
</script>

<MultiSelect
  {fluid}
  {items}
  labelText="Default label"
  label="Select contact methods..."
>
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
</MultiSelect>
