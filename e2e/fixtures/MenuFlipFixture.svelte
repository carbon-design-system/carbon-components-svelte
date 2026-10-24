<script>
  import {
    ComboBox,
    Dropdown,
    MultiSelect,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";

  const items = [
    "us-east",
    "us-south",
    "eu-de",
    "eu-gb",
    "jp-tok",
    "au-syd",
  ].map((text, i) => ({ id: String(i), text }));
</script>

<div data-testid="top" style="display: flex; gap: 1rem; padding: 1rem">
  <div style="width: 12rem">
    <Dropdown labelText="Top dropdown" selectedId="0" {items} />
  </div>
</div>

<div style="height: 120vh"></div>

<div
  data-testid="bottom"
  style="display: flex; gap: 1rem; align-items: flex-end; padding: 0 1rem 0.5rem"
>
  <div style="width: 12rem">
    <Dropdown labelText="Dropdown" selectedId="0" {items} />
  </div>
  <div style="width: 12rem"><ComboBox labelText="ComboBox" {items} /></div>
  <div style="width: 12rem">
    <MultiSelect labelText="MultiSelect" label="Choose" {items} />
  </div>
  <OverflowMenu iconDescription="Actions">
    <OverflowMenuItem text="Rename" />
    <OverflowMenuItem text="Duplicate" />
    <OverflowMenuItem text="Delete" />
  </OverflowMenu>
</div>

<div style="height: 120vh"></div>

<!-- Open at load, far below the window: nothing to fit to yet. -->
<div data-testid="offscreen" style="width: 12rem; margin: 0 1rem 120vh">
  <Dropdown labelText="Offscreen" selectedId="0" {items} open />
</div>
