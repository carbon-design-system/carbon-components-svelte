<svelte:options accessors />

<script lang="ts">
  import TreeSelect from "carbon-components-svelte/TreeSelect/TreeSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let nodes: ComponentProps<TreeSelect>["nodes"] = [];
  export let selectionMode: ComponentProps<TreeSelect>["selectionMode"] =
    "single";
  export let selectedId: ComponentProps<TreeSelect>["selectedId"] = undefined;
  export let checkedIds: ComponentProps<TreeSelect>["checkedIds"] = [];
  export let indeterminateIds: ComponentProps<TreeSelect>["indeterminateIds"] =
    [];
  export let expandedIds: ComponentProps<TreeSelect>["expandedIds"] = [];
  export let checkMode: ComponentProps<TreeSelect>["checkMode"] = "deep";
  export let showChecked: ComponentProps<TreeSelect>["showChecked"] = "parent";
  export let selectionDisplay: ComponentProps<TreeSelect>["selectionDisplay"] =
    "text";
  export let tagLimit: ComponentProps<TreeSelect>["tagLimit"] = 100;
  export let selectable: ComponentProps<TreeSelect>["selectable"] = "any";
  export let filterable = false;
  export let value = "";
  export let open = false;
  export let labelText = "Location";
  export let loadChildren: ComponentProps<TreeSelect>["loadChildren"] =
    undefined;
  export let virtualize: ComponentProps<TreeSelect>["virtualize"] = undefined;
  export let name: ComponentProps<TreeSelect>["name"] = undefined;
  export let required = false;
  export let readonly = false;
  export let disabled = false;
  export let clearable = false;
  export let portalMenu: ComponentProps<TreeSelect>["portalMenu"] = false;
  export let onEvent: (name: string, detail: unknown) => void = () => {};
</script>

<TreeSelect
  {nodes}
  {selectionMode}
  bind:selectedId
  bind:checkedIds
  bind:indeterminateIds
  bind:expandedIds
  bind:value
  bind:open
  {checkMode}
  {showChecked}
  {selectionDisplay}
  {tagLimit}
  {selectable}
  {filterable}
  {labelText}
  {loadChildren}
  {virtualize}
  {name}
  {required}
  {readonly}
  {disabled}
  {clearable}
  {portalMenu}
  on:select={(event) => onEvent("select", event.detail)}
  on:check:change={(event) => onEvent("check:change", event.detail)}
  on:toggle={(event) => onEvent("toggle", event.detail)}
  on:load={(event) => onEvent("load", event.detail)}
  on:load:error={(event) => onEvent("load:error", event.detail)}
  on:open={(event) => onEvent("open", event.detail)}
  on:close={(event) => onEvent("close", event.detail)}
/>
