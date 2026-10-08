<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<MultiSelect labelText="Contact" {items} filterable>
  <svelte:fragment slot="empty" let:value>
    {`Nothing like "${value}"`}
  </svelte:fragment>
</MultiSelect>
