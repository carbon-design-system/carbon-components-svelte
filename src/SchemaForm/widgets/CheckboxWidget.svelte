<script>
  /**
   * A `SchemaForm` widget. Gets the field state as props and reports a
   * new value with a `change` event.
   */

  /** @type {any} */
  export let value = false;
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
  /** @type {boolean} */
  export let readonly = false;
  /** @type {boolean} */
  export let required = false;

  import { createEventDispatcher } from "svelte";
  import Checkbox from "../../Checkbox/Checkbox.svelte";

  const dispatch = createEventDispatcher();
  let checked = value === true;
  $: pull(value);
  $: push(checked);

  /** @param {any} next */
  function pull(next) {
    if ((next === true) !== checked) checked = next === true;
  }

  /** @param {boolean} next */
  function push(next) {
    if (next !== (value === true)) dispatch("change", next);
  }
  // This widget has no use for placeholder.
  $$restProps;
</script>

<Checkbox
  bind:checked
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
  {...field.config.props}
/>
