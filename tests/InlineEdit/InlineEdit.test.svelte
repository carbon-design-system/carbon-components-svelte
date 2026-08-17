<svelte:options accessors />

<script lang="ts">
  import InlineEdit from "carbon-components-svelte/InlineEdit/InlineEdit.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "default";
  export let id: ComponentProps<InlineEdit>["id"] = "test-id";
  export let labelText = "test label";
  export let editLabel = "Edit";
  export let saveLabel = "Save";
  export let cancelLabel = "Cancel";
  export let invalid = false;
  export let invalidText = "This field is required";
  export let disabled = false;
  export let readonly = false;
  export let readonlyLabel: ComponentProps<InlineEdit>["readonlyLabel"] =
    undefined;
  export let readonlyToggletipText: ComponentProps<InlineEdit>["readonlyToggletipText"] =
    undefined;
  export let editAlwaysVisible = false;
  export let selectTextOnFocus = false;
  export let size: ComponentProps<InlineEdit>["size"] = undefined;
  export let ref: ComponentProps<InlineEdit>["ref"] = null;
</script>

<InlineEdit
  bind:value
  bind:ref
  {id}
  {labelText}
  {editLabel}
  {saveLabel}
  {cancelLabel}
  {invalid}
  {invalidText}
  {disabled}
  {readonly}
  {readonlyLabel}
  {readonlyToggletipText}
  {editAlwaysVisible}
  {selectTextOnFocus}
  {size}
  data-testid="inline-edit"
  on:save={() => console.log("save")}
  on:cancel={() => console.log("cancel")}
  on:blur={() => console.log("blur")}
/>
