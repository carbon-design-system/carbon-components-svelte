<script>
  /**
   * A `SchemaForm` widget. Gets the field state as props and reports a
   * new value with a `change` event.
   */

  /** @type {any} */
  export let value = null;
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
  import NumberInput from "../../NumberInput/NumberInput.svelte";
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

  // This widget has no use for placeholder.
  $$restProps;
</script>

<NumberInput
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
  allowEmpty
  allowDecimal={field.type !== "integer"}
  min={field.config.min}
  max={field.config.max}
  step={field.config.step ?? 1}
  {...field.config.props}
/>
