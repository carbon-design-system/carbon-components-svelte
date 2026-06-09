<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<MultiSelect id="first" labelText="First" {items} open />
<MultiSelect id="second" labelText="Second" {items} open />
