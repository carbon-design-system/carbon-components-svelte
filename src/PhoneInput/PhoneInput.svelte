<script>
  /**
   * A field for a phone number: a country selector that shows the flag and
   * calling code, joined to a number field that is masked for the country.
   * The value is the number in E.164 form, such as `"+14155550123"`.
   * @restProps {input}
   * @slot {{}} labelChildren
   * @event {{ value: string; country: string; national: string; complete: boolean }} change
   */

  /**
   * The phone number in E.164 form (`"+"`, the calling code and the
   * digits, with no spaces), or `""` while no digit is entered.
   * Setting it fills the country from its calling code.
   * @type {string}
   * @bindable writable
   */
  export let value = "";

  /**
   * The ISO 3166-1 alpha-2 code of the country whose calling code and number
   * format apply, such as `"CH"`. `""` for none, which gives a number no
   * calling code and the grouping by threes. A calling code shared by
   * several countries (+1) keeps the chosen one.
   * @type {string}
   * @bindable writable
   */
  export let country = "";

  /**
   * Limit the selector to these ISO 3166-1 alpha-2 codes, in this order,
   * instead of every country that has a calling code.
   * @type {ReadonlyArray<string> | undefined}
   */
  export let countries = undefined;

  /** Specify the locale the country names are written in. */
  export let locale = "en";

  /**
   * Fill an empty `country` with the country the UI `locale` is most likely
   * used in ("US" for `"en"`) once the field has mounted.
   */
  export let detect = false;

  /**
   * `true` when the number has at least the digits a complete number has in
   * its country, and no more than the pattern takes. It tests the shape of
   * the number, not whether the number exists.
   * @type {boolean}
   * @bindable readonly
   */
  export let complete = false;

  /** Specify the label text that names the field */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the label of the number field, read to screen readers only */
  export let numberLabelText = "Phone number";

  /** Specify the label of the country selector, read to screen readers only */
  export let countryLabelText = "Country calling code";

  /** Specify the helper text, shown below the whole field */
  export let helperText = "";

  /** Specify the placeholder text of the number field */
  export let placeholder = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set to `true` to disable the field */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /** Set to `true` to require a number */
  export let required = false;

  /**
   * Set the size of the field.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Specify the message shown when no country matches the query */
  export let emptyText = "No results";

  /**
   * Specify a name attribute. A hidden input carries it with the E.164 value,
   * so a form submits `+14155550123` and not the text that is shown.
   * @type {string | undefined}
   */
  export let name = undefined;

  /** Set an id for the number field */
  export let id = uniqueId();

  /**
   * Obtain a reference to the number input element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import ComboBox from "../ComboBox/ComboBox.svelte";
  import Flag from "../Flag/Flag.svelte";
  import InputGroup from "../InputGroup/InputGroup.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import {
    callingCode,
    regionsForCallingCode,
  } from "../utils/calling-codes.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { createMask } from "../utils/input-mask.js";
  import {
    listRegions,
    localeRegion,
    regionName,
  } from "../utils/intl-display-names.js";
  import { createSearchFilter, searchText } from "../utils/intl-search.js";
  import { mask } from "../utils/mask.js";
  import { parseInternational, phoneFormat } from "../utils/phone-formats.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  /** The text in the number field. */
  let national = "";
  /**
   * The mask's pattern. The mask reads it through a function, so a country
   * set in the middle of an event (a pasted +44) is in force for the events
   * that follow, before the component has updated.
   */
  let pattern = "";
  const getPattern = () => pattern;
  /** The digits of the number, without literals. */
  let digits = "";
  let prevCountry = country;
  /**
   * The last `value` this component set or read, so it never chases itself.
   * It starts empty so a `value` the field starts with is read.
   */
  let lastValue = "";

  /**
   * @param {string} text
   * @returns {string}
   */
  const dial = (text) => (text ? `+${callingCode(text)}` : "");

  $: available = countries
    ? countries.filter((code) => callingCode(code))
    : listRegions().filter((code) => callingCode(code));

  $: items = buildItems(available, locale);

  /**
   * @param {string[]} codes
   * @param {string} nextLocale
   */
  function buildItems(codes, nextLocale) {
    const collator = new Intl.Collator(nextLocale);
    const list = codes.map((code) => {
      const text = regionName(nextLocale, code) ?? code;
      return {
        id: code,
        text,
        search: searchText([text, code, `+${callingCode(code)}`]),
      };
    });
    return countries
      ? list
      : list.sort((a, b) => collator.compare(a.text, b.text));
  }

  const filterByName = createSearchFilter();
  const DIGITS = /^\+?\d+$/;

  /**
   * A query of digits, with or without the plus, finds the calling codes that
   * start with it. Anything else is a search of the names.
   * @param {{ id: string; search: string }} item
   * @param {string} query
   */
  function shouldFilterItem(item, query) {
    const typed = query.trim();
    return DIGITS.test(typed)
      ? callingCode(item.id).startsWith(typed.replace("+", ""))
      : filterByName(item, query);
  }

  /**
   * @param {{ id: string } | undefined} item
   * @returns {string}
   */
  function itemToString(item) {
    return item ? dial(item.id) : "";
  }

  /**
   * Fill the number field for a country: `text` is formatted by its pattern.
   * @param {string} next
   * @param {string} text digits to fill the national number with
   */
  function setNumber(next, text) {
    const nextFormat = phoneFormat(next);
    const result = createMask(nextFormat.pattern).format(text);
    country = next;
    prevCountry = next;
    national = result.value;
    digits = result.rawValue;
    pattern = nextFormat.pattern;
    update(nextFormat);
  }

  /** @param {{ min: number; max: number }} f */
  function update(f) {
    complete = digits.length >= f.min && digits.length <= f.max;
    const next = digits && country ? `${dial(country)}${digits}` : "";
    value = next;
    lastValue = next;
  }

  $: syncValue(value);
  $: syncCountry(country);
  // After the two that can change `country`, so it reads the new one.
  $: format = phoneFormat(country);
  $: pattern = format.pattern;

  /** @param {string} next */
  function syncValue(next) {
    if (next === lastValue) return;
    lastValue = next;
    const parsed = parseInternational(next);
    if (!parsed) {
      if (!next) {
        national = "";
        digits = "";
        complete = false;
      }
      return;
    }
    const group = regionsForCallingCode(parsed.code).filter((code) =>
      available.includes(code),
    );
    if (group.length === 0) return;
    setNumber(group.includes(country) ? country : group[0], parsed.digits);
  }

  /** @param {string} next */
  function syncCountry(next) {
    if (next === prevCountry) return;
    setNumber(next, digits);
  }

  /**
   * The text of the number field after the user typed. Not the mask's own
   * report: that also fires for text this component sets, and can read the
   * field before it holds it.
   * @param {CustomEvent<string | number | null>} event
   */
  function handleNumberInput(event) {
    const result = createMask(pattern).format(String(event.detail ?? ""));
    if (result.rawValue === digits) return;
    digits = result.rawValue;
    update(format);
    dispatch("change", { value, country, national, complete });
  }

  /**
   * A number pasted or filled in with its country code ("+44 20 7946 0958")
   * switches the country and fills the number.
   * @param {string} text
   * @returns {boolean} true if it was an international number
   */
  function takeInternational(text) {
    const parsed = parseInternational(text);
    if (!parsed) return false;
    const group = regionsForCallingCode(parsed.code).filter((code) =>
      available.includes(code),
    );
    if (group.length === 0) return false;
    setNumber(group.includes(country) ? country : group[0], parsed.digits);
    // The field holds the text that was pasted until the component updates.
    if (ref) ref.value = national;
    dispatch("change", { value, country, national, complete });
    return true;
  }

  /** @param {Event} raw */
  function handleBeforeInput(raw) {
    const event = /** @type {InputEvent} */ (raw);
    if (!(event.target instanceof HTMLInputElement) || event.target !== ref) {
      return;
    }
    if (
      event.inputType !== "insertFromPaste" &&
      event.inputType !== "insertText"
    ) {
      return;
    }
    const text = event.data ?? event.dataTransfer?.getData("text/plain") ?? "";
    if (text.trim().startsWith("+") && takeInternational(text)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  /** @param {Event} event */
  function handleInput(event) {
    // Autofill writes the whole value without a `beforeinput`.
    if (
      event.target === ref &&
      ref?.value.trim().startsWith("+") &&
      takeInternational(ref.value)
    ) {
      event.stopImmediatePropagation();
    }
  }

  /** @param {Event} event */
  function handleCompositionEnd(event) {
    // Firefox inserts text as a composition, so a paste arrives here.
    if (event.target === ref && ref?.value.trim().startsWith("+")) {
      takeInternational(ref.value);
    }
  }

  /** @param {HTMLElement} node */
  function intlEntry(node) {
    node.addEventListener("beforeinput", handleBeforeInput, true);
    node.addEventListener("compositionend", handleCompositionEnd, true);
    node.addEventListener("input", handleInput, true);
    return {
      destroy() {
        node.removeEventListener("beforeinput", handleBeforeInput, true);
        node.removeEventListener("compositionend", handleCompositionEnd, true);
        node.removeEventListener("input", handleInput, true);
      },
    };
  }

  /** @param {CustomEvent<{ selectedId: string }>} event */
  function handleSelect(event) {
    const next = event.detail.selectedId;
    if (next === country) return;
    setNumber(next, digits);
    dispatch("change", { value, country, national, complete });
  }

  // The flags are one module of every flag, loaded once the field mounts: the
  // flag in the field is always on screen, unlike the one in a menu.
  /** @type {import("../flags/all.js").getFlag | undefined} */
  let getFlag;

  onMount(() => {
    if (detect && !country) {
      const guess = localeRegion(locale);
      if (guess && available.includes(guess)) country = guess;
    }
    import("../flags/all.js")
      .then((module) => (getFlag = module.getFlag))
      .catch(() => (getFlag = () => undefined));
  });
</script>

{#if name}
  <input type="hidden" {name} {value} disabled={disabled || undefined} />
{/if}
<InputGroup
  id="{id}-group"
  class="bx--phone-input"
  {helperText}
  invalid={invalid && !readonly}
  {invalidText}
  warn={warn && !readonly}
  {warnText}
  {disabled}
  {size}
  legendText={labelText}
  hideLegend={hideLabel}
  let:describedBy
  let:invalid={showInvalid}
  let:size={fieldSize}
>
  <svelte:fragment slot="legendChildren">
    <slot name="labelChildren">{labelText}</slot>
  </svelte:fragment>
  <div class:bx--phone-input__country={true}>
    <span class:bx--phone-input__flag={true} aria-hidden="true">
      {#if country}
        <Flag flag={getFlag?.(country)} code={getFlag ? country : ""} />
      {/if}
    </span>
    <ComboBox
      id="{id}-country"
      selectedId={country || undefined}
      {items}
      {itemToString}
      {shouldFilterItem}
      {emptyText}
      {disabled}
      {readonly}
      size={fieldSize}
      hideLabel
      labelText={countryLabelText}
      autocomplete="off"
      autoHighlight="first-match"
      clearFilterOnOpen
      on:select={handleSelect}
      let:item
    >
      <span class:bx--intl-picker__option={true}>
        <Flag flag={getFlag?.(item.id)} code={getFlag ? item.id : ""} />
        <span class:bx--intl-picker__text={true} lang={locale}>{item.text}</span
        >
        <span class:bx--intl-picker__trailing={true}>
          <bdi dir="ltr">{dial(item.id)}</bdi>
        </span>
      </span>
    </ComboBox>
  </div>
  <div
    class:bx--phone-input__number={true}
    use:intlEntry
    use:mask={{ pattern: getPattern }}
  >
    <TextInput
      bind:ref
      bind:value={national}
      {id}
      {placeholder}
      {required}
      {readonly}
      size={fieldSize}
      invalid={showInvalid}
      type="tel"
      hideLabel
      labelText={numberLabelText}
      {...$$restProps}
      aria-describedby={joinDescribedBy(
        describedBy,
        $$restProps["aria-describedby"],
      )}
      on:input={handleNumberInput}
      on:focus
      on:blur
      on:keydown
      on:keyup
    />
  </div>
</InputGroup>
