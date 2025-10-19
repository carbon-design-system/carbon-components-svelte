<script lang="ts">
  import { Dropdown } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<Dropdown>["items"] = [];
  export let itemToString: ComponentProps<Dropdown>["itemToString"] = undefined;
  export let selectedId: ComponentProps<Dropdown>["selectedId"] = undefined;
  export let type: ComponentProps<Dropdown>["type"] = "default";
  export let direction: ComponentProps<Dropdown>["direction"] = "bottom";
  export let size: ComponentProps<Dropdown>["size"] = undefined;
  export let open: ComponentProps<Dropdown>["open"] = false;
  export let light: ComponentProps<Dropdown>["light"] = false;
  export let disabled: ComponentProps<Dropdown>["disabled"] = false;
  export let titleText: ComponentProps<Dropdown>["titleText"] = "";
  export let invalid: ComponentProps<Dropdown>["invalid"] = false;
  export let invalidText: ComponentProps<Dropdown>["invalidText"] = "";
  export let warn: ComponentProps<Dropdown>["warn"] = false;
  export let warnText: ComponentProps<Dropdown>["warnText"] = "";
  export let helperText: ComponentProps<Dropdown>["helperText"] = "";
  export let label: ComponentProps<Dropdown>["label"] = undefined;
  export let hideLabel: ComponentProps<Dropdown>["hideLabel"] = false;
  export let translateWithId: ComponentProps<Dropdown>["translateWithId"] =
    undefined;
  export let id: ComponentProps<Dropdown>["id"] = "test-dropdown";
  export let name: ComponentProps<Dropdown>["name"] = undefined;
  export let ref: ComponentProps<Dropdown>["ref"] = null;
  export let onselect: ((e: CustomEvent) => void) | undefined = undefined;
</script>

<Dropdown
  {items}
  {itemToString}
  bind:selectedId
  {type}
  {direction}
  {size}
  bind:open
  {light}
  {disabled}
  {titleText}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {helperText}
  {label}
  {hideLabel}
  {translateWithId}
  {id}
  {name}
  bind:ref
  {onselect}
  {...$$restProps}
/>
