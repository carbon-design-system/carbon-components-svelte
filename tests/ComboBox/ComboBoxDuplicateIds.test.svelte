<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<ComboBox id="combo-a" labelText="Contact A" {items} open />
<ComboBox id="combo-b" labelText="Contact B" {items} open />
