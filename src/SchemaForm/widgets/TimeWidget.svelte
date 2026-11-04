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
  import TimePicker from "../../TimePicker/TimePicker.svelte";
  import { deepEqual } from "../../utils/deep-equal.js";

  const dispatch = createEventDispatcher();
  /** @type {any} */
  let inner = value;
  $: pull(value);
  $: push(inner);

  /** @param {any} next */
  function pull(next) {
    if (!deepEqual(next, inner)) inner = next;
  }

  /** @param {any} next */
  function push(next) {
    if (!deepEqual(next, value)) dispatch("change", next);
  }
</script>

<TimePicker
  bind:value={inner}
  {id}
  {name}
  labelText={label}
  {helperText}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {disabled}
  {readonly}
  {required}
  {placeholder}
  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
  {...field.config.props}
/>
