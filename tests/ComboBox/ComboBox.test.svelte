<script lang="ts">
  import { ComboBox } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<ComboBox>["items"] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
  export let selectedId: ComponentProps<ComboBox>["selectedId"] = undefined;
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
  export let hideLabel = false;
  export let size: "sm" | "xl" | undefined = undefined;
  export let shouldFilterItem: ComponentProps<ComboBox>["shouldFilterItem"] = (
    item,
    value,
  ) => item.text.toLowerCase().includes(value.toLowerCase());
  export let translateWithIdSelection: ComponentProps<ComboBox>["translateWithIdSelection"] =
    undefined;
</script>

<ComboBox
  {disabled}
  {helperText}
  {hideLabel}
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
  {translateWithIdSelection}
  on:select={(e) => {
    console.log("select", e.detail);
  }}
  on:clear={(e) => {
    console.log("clear", e.type);
    value = "";
    selectedId = undefined;
  }}
/>
