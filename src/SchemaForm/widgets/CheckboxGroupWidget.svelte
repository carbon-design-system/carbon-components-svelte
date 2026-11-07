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
  /** @type {boolean} */
  export let readonly = false;
  /** @type {boolean} */
  export let required = false;

  import { createEventDispatcher } from "svelte";
  import Checkbox from "../../Checkbox/Checkbox.svelte";
  import CheckboxGroup from "../../Checkbox/CheckboxGroup.svelte";
  import { deepEqual } from "../../utils/deep-equal.js";

  const dispatch = createEventDispatcher();
  /** @type {any[]} */
  let selected = Array.isArray(value) ? value : [];
  $: pull(value);
  $: push(selected);

  /** @param {any} next */
  function pull(next) {
    const list = Array.isArray(next) ? next : [];
    if (!deepEqual(list, selected)) selected = list;
  }

  /** @param {any[]} next */
  function push(next) {
    if (!deepEqual(next, Array.isArray(value) ? value : [])) {
      dispatch("change", next);
    }
  }
  // This widget has no use for placeholder.
  $$restProps;
</script>

<CheckboxGroup
  bind:selected
  legendText={label}
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
>
  {#each field.options ?? [] as option (option.value)}
    <Checkbox
      value={option.value}
      labelText={option.label}
      disabled={option.disabled}
      helperText={option.helperText}
    />
  {/each}
</CheckboxGroup>
