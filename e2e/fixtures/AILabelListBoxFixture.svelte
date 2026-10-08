<script>
  import { AILabel, ComboBox, Dropdown } from "carbon-components-svelte";

  const items = [
    {
      id: "pager",
      text: "Legacy pager gateway for the platform on-call rotation",
    },
  ];
</script>

<div data-testid="dropdown">
  <Dropdown clearable labelText="Contact" selectedId="pager" {items}>
    <AILabel slot="decorator" />
  </Dropdown>
</div>

<div data-testid="dropdown-invalid">
  <Dropdown
    clearable
    labelText="Contact"
    selectedId="pager"
    {items}
    invalid
    invalidText="This contact method is no longer supported"
  >
    <AILabel slot="decorator" />
  </Dropdown>
</div>

<div data-testid="dropdown-warning">
  <Dropdown
    clearable
    labelText="Contact"
    selectedId="pager"
    {items}
    warn
    warnText="This contact method is deprecated"
  >
    <AILabel slot="decorator" />
  </Dropdown>
</div>

<div data-testid="combobox-invalid">
  <ComboBox
    labelText="Contact"
    selectedId="pager"
    {items}
    invalid
    invalidText="This contact method is no longer supported"
  >
    <AILabel slot="decorator" />
  </ComboBox>
</div>
