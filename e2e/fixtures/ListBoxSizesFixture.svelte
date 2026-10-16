<script>
  import { ComboBox, Dropdown, MultiSelect } from "carbon-components-svelte";

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
