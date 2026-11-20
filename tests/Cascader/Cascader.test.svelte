<svelte:options accessors />

<script lang="ts">
  import Cascader from "carbon-components-svelte/Cascader/Cascader.svelte";
  import type { ComponentProps } from "svelte";

  export let nodes: ComponentProps<Cascader>["nodes"] = [];
  export let value: ComponentProps<Cascader>["value"] = [];
  export let values: ComponentProps<Cascader>["values"] = [];
  export let multiple = false;
  export let changeOnSelect = false;
  export let showChecked: ComponentProps<Cascader>["showChecked"] = "parent";
  export let filterable = false;
  export let open = false;
  export let labelText = "Location";
  export let loadChildren: ComponentProps<Cascader>["loadChildren"] = undefined;
  export let search: ComponentProps<Cascader>["search"] = undefined;
  export let layout: ComponentProps<Cascader>["layout"] = "columns";
  export let name: ComponentProps<Cascader>["name"] = undefined;
  export let required = false;
  export let readonly = false;
  export let disabled = false;
  export let clearable = false;
  export let separator = " / ";
  export let portalMenu: ComponentProps<Cascader>["portalMenu"] = false;
  export let onEvent: (name: string, detail: unknown) => void = () => {};
</script>

<Cascader
  {nodes}
  bind:value
  bind:values
  bind:open
  {multiple}
  {changeOnSelect}
  {showChecked}
  {filterable}
  {labelText}
  {loadChildren}
  {search}
  {layout}
  {name}
  {required}
  {readonly}
  {disabled}
  {clearable}
  {separator}
  {portalMenu}
  on:change={(event) => onEvent("change", event.detail)}
  on:load={(event) => onEvent("load", event.detail)}
  on:load:error={(event) => onEvent("load:error", event.detail)}
  on:open={(event) => onEvent("open", event.detail)}
  on:close={(event) => onEvent("close", event.detail)}
/>
