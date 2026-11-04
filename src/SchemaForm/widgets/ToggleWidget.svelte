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

  import { createEventDispatcher } from "svelte";
  import Toggle from "../../Toggle/Toggle.svelte";

  const dispatch = createEventDispatcher();
  let toggled = value === true;
  $: pull(value);
  $: push(toggled);

  /** @param {any} next */
  function pull(next) {
    if ((next === true) !== toggled) toggled = next === true;
  }

  /** @param {boolean} next */
  function push(next) {
    if (next !== (value === true)) dispatch("change", next);
  }
  // This widget has no use for placeholder, required.
  $$restProps;
</script>

<Toggle
  bind:toggled
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
  {...field.config.props}
/>
