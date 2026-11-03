<script>
  import { Dropdown, Stack } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<Stack orientation="horizontal" gap={5}>
  <Dropdown
    menuTransition
    labelText="In place"
    selectedId="0"
    {items}
    portalMenu={false}
  />
  <Dropdown
    menuTransition
    labelText="In a portal"
    selectedId="0"
    {items}
    portalMenu
  />
</Stack>
