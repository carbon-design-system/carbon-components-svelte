<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<ComboBox
  form="outer-form"
  name="contact"
  inputName="contact_text"
  labelText="Contact"
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ]}
  selectedId="1"
/>
