<script>
  /**
   * A `SchemaForm` widget. Gets the field state as props and reports a
   * new value with a `change` event.
   */

  /** @type {any} */
  export let value = 0;
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
  import Slider from "../../Slider/Slider.svelte";
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

<Slider
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
  min={field.config.min ?? 0}
  max={field.config.max ?? 100}
  step={field.config.step ?? 1}
  {...field.config.props}
/>
