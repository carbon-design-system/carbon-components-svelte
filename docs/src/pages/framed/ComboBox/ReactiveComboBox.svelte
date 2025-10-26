<script>
  import { Button, ComboBox } from "carbon-components-svelte";

  let selectedId = "1";
</script>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  bind:selectedId
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ]}
/>
<br />
<Button on:click={() => (selectedId = undefined)}
  >Set to undefined (unselected)</Button
>
<Button on:click={() => (selectedId = "2")}>Set to 2 (Fax)</Button>
