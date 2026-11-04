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
  import MultiSelect from "../../MultiSelect/MultiSelect.svelte";
  import { deepEqual } from "../../utils/deep-equal.js";
  import { fromIds, toIds } from "./shared.js";

  const dispatch = createEventDispatcher();
  let selectedIds = toIds(value);
  $: pull(value);
  $: push(selectedIds);
  $: items = (field.options ?? []).map((option) => ({
    id: String(option.value),
    text: option.label ?? String(option.value),
    disabled: option.disabled,
  }));

  /** @param {any} next */
  function pull(next) {
    if (!deepEqual(toIds(next), selectedIds)) selectedIds = toIds(next);
  }

  /** @param {string[]} next */
  function push(next) {
    if (!deepEqual(next, toIds(value))) {
      dispatch("change", fromIds(field.options, next));
    }
  }
</script>

<MultiSelect
  bind:selectedIds
  {items}
  labelText={label}
  label={placeholder}
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
