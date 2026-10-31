<script>
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  // `?size=sm` renders every case at that size.
  const size = new URLSearchParams(location.search).get("size") || undefined;

  const items = [
    { id: "fra", text: "Frankfurt", group: "Europe" },
    { id: "tor", text: "Toronto", group: "Americas" },
    { id: "lon", text: "London", group: "Europe" },
    { id: "sao", text: "Sao Paulo", group: "Americas" },
  ];

  const withUngrouped = [{ id: "any", text: "Nearest region" }, ...items];

  const regions = ["Americas", "Asia Pacific", "Europe", "Middle East"];
  const manyItems = Array.from({ length: 400 }, (_, i) => ({
    id: `zone-${i}`,
    text: `Zone ${i + 1}`,
    group: regions[Math.floor(i / 100)],
  }));
</script>

<!-- Open grouped menus. Each menu floats, so every case reserves room
     for it. -->
<div class="cases">
  <div data-testid="dropdown">
    <Dropdown open {size} labelText="Dropdown" {items} selectedId="fra" />
  </div>
  <div data-testid="combobox">
    <ComboBox open {size} labelText="ComboBox" {items} />
  </div>
  <div data-testid="multiselect">
    <MultiSelect
      open
      {size}
      labelText="MultiSelect"
      label="Regions"
      items={withUngrouped}
    />
  </div>
  <div data-testid="virtualized">
    <Dropdown
      open
      {size}
      labelText="Virtualized"
      items={manyItems}
      virtualize
    />
  </div>
</div>

<style>
  .cases {
    width: 18rem;
  }

  .cases > div {
    height: 24rem;
  }
</style>
