<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<Dropdown
  form="outer-form"
  name="contact"
  labelText="Contact"
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ]}
  selectedId="1"
/>
