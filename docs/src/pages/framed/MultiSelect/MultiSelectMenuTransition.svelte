<script>
  import { MultiSelect, Stack } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<Stack orientation="horizontal" gap={5}>
  <MultiSelect
    menuTransition
    labelText="In place"
    label="Select channels"
    {items}
    portalMenu={false}
  />
  <MultiSelect
    menuTransition
    labelText="In a portal"
    label="Select channels"
    {items}
    portalMenu
  />
</Stack>
