<script>
  import {
    ComboBox,
    Dropdown,
    MultiSelect,
    TextInput,
  } from "carbon-components-svelte";

  const items = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
  ];
  const sizes = ["xs", "sm", undefined, "lg", "xl"];
</script>

{#each sizes as size (size ?? "md")}
  <div data-size={size ?? "md"}>
    <Dropdown {size} labelText="Dropdown {size}" {items} selectedId="a" />
    <ComboBox {size} labelText="ComboBox {size}" {items} />
    <MultiSelect {size} labelText="MultiSelect {size}" {items} />
  </div>
{/each}

<!-- A text field beside a list box in one row, at each size. -->
{#each sizes as size (size ?? "md")}
  <div
    data-row={size ?? "md"}
    style="display: flex; align-items: flex-start; gap: 1rem;"
  >
    <TextInput {size} labelText="Name" value="billing" />
    <Dropdown {size} labelText="Region" {items} selectedId="a" />
    <ComboBox {size} labelText="Zone" {items} selectedId="b" />
  </div>
{/each}
