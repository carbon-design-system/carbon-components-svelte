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
  import RadioButton from "../../RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "../../RadioButtonGroup/RadioButtonGroup.svelte";

  const dispatch = createEventDispatcher();
  /** @type {string | number | undefined} */
  let selected = value === "" || value == null ? undefined : value;
  $: pull(value);
  $: push(selected);

  /** @param {any} next */
  function pull(next) {
    const wanted = next === "" || next == null ? undefined : next;
    if (wanted !== selected) selected = wanted;
  }

  /** @param {string | number | undefined | null} next */
  function push(next) {
    const wanted = value === "" || value == null ? undefined : value;
    if ((next ?? undefined) !== wanted) dispatch("change", next ?? "");
  }
  // This widget has no use for placeholder.
  $$restProps;
</script>

<RadioButtonGroup
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
  orientation="vertical"
  {...field.config.props}
>
  {#each field.options ?? [] as option (option.value)}
    <RadioButton
      value={option.value}
      labelText={option.label}
      disabled={option.disabled}
    />
  {/each}
</RadioButtonGroup>
