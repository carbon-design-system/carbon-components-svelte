<script>
  /**
   * A `SchemaForm` widget. Gets the field state as props and reports a
   * new value with a `change` event.
   */

  /** @type {any} */
  export let value = "";
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
  /** @type {string} */
  export let placeholder = "";
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
  /** @type {boolean} */
  export let readonly = false;
  /** @type {boolean} */
  export let required = false;

  import { createEventDispatcher } from "svelte";
  import Dropdown from "../../Dropdown/Dropdown.svelte";
  import { fromId, toId } from "./shared.js";

  const dispatch = createEventDispatcher();
  /** @type {string | undefined} */
  let selectedId = toId(value);
  $: pull(value);
  $: push(selectedId);
  $: items = (field.options ?? []).map((option) => ({
    id: String(option.value),
    text: option.label ?? String(option.value),
    disabled: option.disabled,
  }));

  /** @param {any} next */
  function pull(next) {
    if (toId(next) !== selectedId) selectedId = toId(next);
  }

  /** @param {string | undefined} next */
  function push(next) {
    if (next !== toId(value)) dispatch("change", fromId(field.options, next));
  }
</script>

<Dropdown
  bind:selectedId
  {items}
  labelText={label}
  {id}
  {name}
  {helperText}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {disabled}
  {readonly}
  {required}
  label={placeholder}
  clearable={!required}
  {...field.config.props}
/>
