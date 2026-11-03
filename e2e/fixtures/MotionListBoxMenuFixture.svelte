<script>
  import { ComboBox, Dropdown, MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Webhook" },
    { id: "3", text: "Fax" },
  ];
</script>

<main>
  <Dropdown
    id="plain"
    labelText="Plain"
    label="Choose"
    {items}
    portalMenu={false}
  />
  <Dropdown
    id="inplace"
    labelText="In place"
    label="Choose"
    {items}
    portalMenu={false}
    menuTransition
  />
  <Dropdown
    id="portal"
    labelText="Portal"
    label="Choose"
    {items}
    portalMenu
    menuTransition
  />
  <ComboBox
    id="combo"
    labelText="ComboBox"
    {items}
    portalMenu={false}
    menuTransition
  />
  <MultiSelect
    id="multi"
    labelText="MultiSelect"
    label="Choose"
    {items}
    portalMenu={false}
    menuTransition
  />
  <div class="bottom">
    <Dropdown
      id="portal-up"
      labelText="Portal, opens upward"
      label="Choose"
      {items}
      direction="top"
      portalMenu
      menuTransition
    />
    <Dropdown
      id="portal-flip"
      labelText="Portal, flips upward"
      label="Choose"
      {items}
      portalMenu
      menuTransition
    />
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100vh;
    padding: 1rem;
  }

  .bottom {
    margin-top: auto;
  }
</style>
