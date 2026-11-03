<script>
  import { ComboBox, Stack } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<Stack orientation="horizontal" gap={5}>
  <ComboBox
    menuTransition
    labelText="In place"
    placeholder="Select a channel"
    {items}
    portalMenu={false}
  />
  <ComboBox
    menuTransition
    labelText="In a portal"
    placeholder="Select a channel"
    {items}
    portalMenu
  />
</Stack>
