<script lang="ts">
  import { ComboBox } from "carbon-components-svelte";
  import type { ComboBoxItem } from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  export let items: ComboBoxItem[] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
  export let selectedId: string | undefined = undefined;
  export let value = "";
  export let disabled = false;
  export let invalid = false;
  export let warn = false;
  export let light = false;
  export let open = false;
  export let titleText = "Contact";
  export let placeholder = "Select contact method";
  export let invalidText = "";
  export let warnText = "";
  export let helperText = "";
  export let size: "sm" | "xl" | undefined = undefined;
  export let shouldFilterItem = (item: ComboBoxItem, value: string) =>
    item.text.toLowerCase().includes(value.toLowerCase());
</script>

<ComboBox
  {disabled}
  {helperText}
  {invalid}
  {invalidText}
  {items}
  {light}
  {open}
  {placeholder}
  {selectedId}
  {size}
  {titleText}
  {value}
  {warn}
  {warnText}
  {shouldFilterItem}
  on:select={(e) => {
    console.log("select", e.detail);
  }}
  on:clear={(e) => {
    console.log("clear", e.type);
  }}
/>
