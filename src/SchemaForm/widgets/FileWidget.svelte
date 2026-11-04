<script>
  /**
   * A `SchemaForm` widget. Gets the field state as props and reports a
   * new value with a `change` event.
   */

  /** @type {any} */
  export let value = [];
  /** @type {import("../field-config.js").FieldNode} */
  export let field;
  /** @type {string | undefined} */
  export let id = undefined;
  /** @type {string | undefined} */
  export let name = undefined;
  /** @type {string} */
  export let label = "";
  /** @type {string} */
  export let helperText = "";
  /** @type {boolean} */
  export let invalid = false;
  /** @type {string} */
  export let invalidText = "";
  /** @type {boolean} */
  export let warn = false;
  /** @type {string} */
  export let warnText = "";
  /** @type {boolean} */
  export let disabled = false;

  import { createEventDispatcher } from "svelte";
  import FileUploader from "../../FileUploader/FileUploader.svelte";
  import FormRequirement from "../../FormRequirement/FormRequirement.svelte";

  const dispatch = createEventDispatcher();
  /** @type {Record<string, any>} */
  const extra = field.config.props ?? {};
  /** @type {ReadonlyArray<File>} */
  let files = Array.isArray(value) ? value : [];
  $: pull(value);
  $: push(files);

  /** @param {any} next */
  function pull(next) {
    const list = Array.isArray(next) ? next : [];
    if (list.length !== files.length || list.some((f, i) => f !== files[i])) {
      files = list;
    }
  }

  /** @param {ReadonlyArray<File>} next */
  function push(next) {
    const list = Array.isArray(value) ? value : [];
    if (next.length !== list.length || next.some((f, i) => f !== list[i])) {
      dispatch("change", [...next]);
    }
  }
  // This widget has no use for placeholder, readonly, required.
  $$restProps;
</script>

<div {id}>
  <FileUploader
    bind:files
    labelTitle={label}
    labelDescription={helperText}
    {name}
    {disabled}
    buttonLabel={extra.buttonLabel ?? "Add file"}
    multiple
    {...field.config.props}
  />
  {#if invalid}
    <FormRequirement id="{id}-error">{invalidText}</FormRequirement>
  {:else if warn}
    <FormRequirement kind="warn" id="{id}-warn">{warnText}</FormRequirement>
  {/if}
</div>
