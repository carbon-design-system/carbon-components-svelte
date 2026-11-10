<script>
  /**
   * @restProps {input}
   * @event {null | number} input
   * @event {null | number} change
   */

  /**
   * The number, or `null` when the field is empty. It is the number as
   * written in the field, not scaled: `5` with unit `"%"` is shown as `5%`.
   * @type {null | number}
   * @bindable writable
   */
  export let value = null;

  /**
   * Specify the unit: a symbol (`"kg"`, `"%"`, `"ms"`, `"GB"`, `"km"`,
   * `"celsius"`) or any unit `Intl.NumberFormat` knows (`"kilogram"`,
   * `"mile-per-hour"`). The locale sets where it sits and how it reads
   * (`5 %` in German).
   * @type {string | undefined}
   */
  export let unit = undefined;

  /**
   * Specify how the unit is shown.
   * @type {"short" | "narrow" | "long" | undefined}
   */
  export let unitDisplay = undefined;

  /**
   * Specify a BCP 47 locale, such as `"de-DE"`. Sets the grouping, the
   * decimal mark, the digits and where the symbol sits. Uses the runtime's
   * locale when unset, which can differ between a server and a browser: set
   * it when the page is server-rendered.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Specify the fewest fraction digits. The field is padded to this when it
   * is left. Defaults to 0.
   * @type {number | undefined}
   */
  export let minimumFractionDigits = undefined;

  /**
   * Specify the most fraction digits the field takes. Defaults to 3.
   * @type {number | undefined}
   */
  export let maximumFractionDigits = undefined;

  /**
   * Set to `true` to take a minus key and a negative paste (a temperature).
   * Defaults to `true` when `min` is negative. A field that takes a negative number asks
   * for the full keyboard on a phone, since the decimal keypad on iOS has no
   * minus key.
   * @type {boolean | undefined}
   */
  export let allowNegative = undefined;

  /**
   * Specify the grouping. `false` writes no group marks.
   * @type {boolean | "always" | "auto" | "min2" | undefined}
   */
  export let useGrouping = undefined;

  /**
   * Specify the smallest number. A number below it is invalid.
   * @type {string | number | undefined}
   */
  export let min = undefined;

  /**
   * Specify the largest number.
   * @type {string | number | undefined}
   */
  export let max = undefined;

  /**
   * Specify the step a number must be a whole multiple of. The field has no
   * stepper buttons; this only checks the number.
   * @type {string | number | undefined}
   */
  export let step = undefined;

  /**
   * Specify the hint that assistive technology reads with the field, such as
   * "Value in kilograms". Defaults to that sentence in English. Set to `""` to
   * hide it, or to a translation.
   * @type {string | undefined}
   */
  export let hintText = undefined;

  /**
   * Specify a name attribute for the field. The form submits the number
   * (`12.5`), not the formatted text.
   * @type {string | undefined}
   */
  export let name = undefined;

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` for the input to be read-only */
  export let readonly = false;

  /** Set to `true` to mark the field required */
  export let required = false;

  /**
   * Set the size of the input.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context.
   */
  export let fluid = false;

  /** Set to `true` to select the input's text when it receives focus */
  export let selectTextOnFocus = false;

  import NumberFormatField from "../CurrencyInput/NumberFormatField.svelte";
  import { createNumberFormat } from "../utils/number-format.js";
  import { uniqueId } from "../utils/unique-id.js";

  $: formatOptions = {
    style: /** @type {const} */ ("unit"),
    unit,
    locale,
    unitDisplay,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
    allowNegative: allowNegative ?? (min !== undefined && Number(min) < 0),
  };
  $: hint = hintText ?? defaultHint(formatOptions);

  /**
   * @param {import("../utils/number-format.js").NumberFormatOptions} options
   * @returns {string}
   */
  function defaultHint(options) {
    const label = createNumberFormat(options).name();
    return label ? `Value in ${label}` : "";
  }

  // The rest props are the input's: `size` is a number there, and a name here.
  /** @type {Record<string, unknown>} */
  $: rest = $$restProps;

  $: field = {
    labelText,
    helperText,
    hideLabel,
    placeholder,
    invalidText,
    warn,
    warnText,
    required,
    size,
    inline,
    fluid,
    selectTextOnFocus,
  };
</script>

{#if $$slots.labelChildren}
  <NumberFormatField
    {...field}
    {...rest}
    {formatOptions}
    valueType="number"
    {min}
    {max}
    {step}
    {name}
    {id}
    {invalid}
    {disabled}
    {readonly}
    {hint}
    bind:value
    bind:ref
    on:input
    on:change
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:keyup
    on:focus
    on:blur
    on:paste
  >
    <svelte:fragment slot="labelChildren">
      <slot name="labelChildren" />
    </svelte:fragment>
  </NumberFormatField>
{:else}
  <NumberFormatField
    {...field}
    {...rest}
    {formatOptions}
    valueType="number"
    {min}
    {max}
    {step}
    {name}
    {id}
    {invalid}
    {disabled}
    {readonly}
    {hint}
    bind:value
    bind:ref
    on:input
    on:change
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:keyup
    on:focus
    on:blur
    on:paste
  />
{/if}
