<script>
  import { Button, ComboBox } from "carbon-components-svelte";

  let open = false;
</script>

<ComboBox
  bind:open
  labelText="Contact"
  placeholder="Select contact method"
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ]}
/>
<br>
<Button on:click={() => (open = !open)}>Toggle menu</Button>
