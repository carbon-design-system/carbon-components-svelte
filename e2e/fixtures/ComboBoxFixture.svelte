<script>
  import { ComboBox } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  function shouldFilterItem(item, value) {
    if (!value) return true;
    return item.text.toLowerCase().includes(value.toLowerCase());
  }
</script>

<!-- Sits above every ComboBox so a downward-opening menu never overlaps it,
     keeping it clickable as an outside-click target in any state. -->
<button type="button" data-testid="outside-target">Outside target</button>

<ComboBox
  data-testid="combobox-contact"
  labelText="Contact"
  placeholder="Select contact method"
  {items}
  {shouldFilterItem}
/>

<a href="#" data-testid="outside-link">Outside</a>

<ComboBox
  data-testid="combobox-select-on-focus"
  labelText="Select on focus"
  placeholder="Select"
  {items}
  selectTextOnFocus={true}
  selectedId="1"
  value="Email"
/>

<div data-testid="combobox-clear-reopen-wrapper">
  <ComboBox
    data-testid="combobox-clear-reopen"
    labelText="Clear reopen"
    placeholder="Select"
    {items}
    {shouldFilterItem}
    openOnClear
    selectedId="1"
    value="Email"
  />
</div>
