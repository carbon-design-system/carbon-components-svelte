<script>
  /**
   * The name field of a row or tile being renamed: an `InlineEdit` that takes
   * focus and selects the name without its extension, as a file browser does.
   * Internal.
   * @event {{ name: string }} save
   * @event {null} cancel
   */

  /** @type {import("./file-manager-types.js").FileRow} */
  export let entry;

  /** @type {import("./texts.js").FileManagerTexts} */
  export let texts;

  /** @type {(name: string, entry: import("./file-manager-types.js").FileRow) => "empty" | "slash" | "dots" | "exists" | null} */
  export let validate;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import InlineEdit from "../InlineEdit/InlineEdit.svelte";

  const dispatch = createEventDispatcher();

  let value = entry.name;
  /** @type {null | HTMLDivElement} */
  let ref = null;

  $: error = value.trim() === entry.name ? null : validate(value, entry);

  onMount(() => {
    tick().then(() => {
      const input = ref?.querySelector("input");
      if (!input) return;
      input.focus();
      const dot = entry.kind === "file" ? entry.name.lastIndexOf(".") : -1;
      input.setSelectionRange(0, dot > 0 ? dot : entry.name.length);
    });
  });
</script>

<InlineEdit
  bind:value
  bind:ref
  labelText={texts.renameLabel(entry.name)}
  editLabel={texts.renameEdit}
  saveLabel={texts.renameSave}
  cancelLabel={texts.renameCancel}
  invalid={error !== null}
  invalidText={error ? texts.nameErrors[error] : ""}
  size="sm"
  editAlwaysVisible
  on:save={() => dispatch("save", { name: value.trim() })}
  on:cancel={() => dispatch("cancel")}
/>
