<script lang="ts">
  import { MultiSelect } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [];
  export let selectedIds: ComponentProps<MultiSelect>["selectedIds"] = [];
  export let filterable = false;
  export let filterItem: ComponentProps<MultiSelect>["filterItem"] = undefined;
  export let placeholder = "";
  export let titleText = "";
  export let hideLabel = false;
  export let light = false;
  export let type: ComponentProps<MultiSelect>["type"] = "default";
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let disabled = false;
  export let selectionFeedback: ComponentProps<MultiSelect>["selectionFeedback"] =
    "top-after-reopen";
  export let translateWithIdSelection: ComponentProps<MultiSelect>["translateWithIdSelection"] =
    undefined;
  export let itemToString: ComponentProps<MultiSelect>["itemToString"] = (
    item,
  ) => item.text;
  export let itemToInput: ComponentProps<MultiSelect>["itemToInput"] =
    undefined;
  export let helperText: ComponentProps<MultiSelect>["helperText"] = "";
</script>

<MultiSelect
  {items}
  {selectedIds}
  {filterable}
  {filterItem}
  {placeholder}
  {titleText}
  {hideLabel}
  {light}
  {type}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {disabled}
  {selectionFeedback}
  {translateWithIdSelection}
  {itemToString}
  {itemToInput}
  {helperText}
  on:select={(e) => {
    console.log("select", e.detail);
  }}
  on:clear={(e) => {
    console.log("clear", e.detail);
  }}
/>
