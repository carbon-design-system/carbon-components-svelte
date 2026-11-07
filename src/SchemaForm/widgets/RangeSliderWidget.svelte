<script>
  /**
   * A `SchemaForm` widget. Gets the field state as props and reports a
   * new value with a `change` event.
   */

  /** @type {any} */
  export let value = [0, 100];
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
  import RangeSlider from "../../Slider/RangeSlider.svelte";

  const dispatch = createEventDispatcher();
  let lower = value?.[0] ?? field.config.min ?? 0;
  let upper = value?.[1] ?? field.config.max ?? 100;
  $: pull(value);
  $: push(lower, upper);

  /** @param {any} next */
  function pull(next) {
    if (!Array.isArray(next)) return;
    if (next[0] !== lower) lower = next[0];
    if (next[1] !== upper) upper = next[1];
  }

  /**
   * @param {number} from
   * @param {number} to
   */
  function push(from, to) {
    if (from !== value?.[0] || to !== value?.[1])
      dispatch("change", [from, to]);
  }
  // This widget has no use for placeholder.
  $$restProps;
</script>

<RangeSlider
  bind:value={lower}
  bind:valueUpper={upper}
  labelText={label}
  {id}
  nameUpper={name ? `${name}[1]` : undefined}
  name={name ? `${name}[0]` : undefined}
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
