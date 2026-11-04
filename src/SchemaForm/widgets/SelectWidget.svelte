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
  import Select from "../../Select/Select.svelte";
  import SelectItem from "../../Select/SelectItem.svelte";
  import { toId } from "./shared.js";

  const dispatch = createEventDispatcher();
  let selected = toId(value) ?? "";
  $: pull(value);
  $: push(selected);

  /** @param {any} next */
  function pull(next) {
    if ((toId(next) ?? "") !== selected) selected = toId(next) ?? "";
  }

  /** @param {string} next */
  function push(next) {
    if (next !== (toId(value) ?? "")) {
      dispatch("change", fromSelected(next));
    }
  }

  /** @param {string} id */
  function fromSelected(id) {
    const option = field.options?.find((o) => String(o.value) === id);
    return option ? option.value : "";
  }
</script>

<Select
  bind:selected
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
>
  <SelectItem
    value=""
    text={placeholder || "Choose an option"}
    hidden={required}
  />
  {#each field.options ?? [] as option (option.value)}
    <SelectItem
      value={String(option.value)}
      text={option.label}
      disabled={option.disabled}
    />
  {/each}
</Select>
