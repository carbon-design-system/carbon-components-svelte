<script>
  /**
   * @restProps {fieldset}
   * @event {{ value: import("./address-format.js").AddressValue }} change Fired when a field commits, with the whole value.
   * @event {{ from: string; to: string; cleared: import("./address-format.js").AddressField[]; value: import("./address-format.js").AddressValue }} countrychange Fired when the country changes, with the fields the new country cleared.
   */

  /**
   * Specify the address.
   * Fields the country does not have stay out of the form, and `switchCountry`
   * clears them when the person changes the country.
   * @type {import("./address-format.js").AddressValue}
   * @bindable writable
   */
  export let value = {};

  /** Specify the legend text */
  export let legendText = "Address";

  /**
   * Set an id for the fieldset. Every field's id derives from it as
   * `{id}-country`, `{id}-line1`, `{id}-locality`, and so on.
   */
  export let id = uniqueId();

  /**
   * Specify a name prefix for the fields: `"shipping"` posts
   * `shipping.country`, `shipping.line1`, `shipping.locality`, and so on.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the country codes to offer. Defaults to every country the format
   * table holds. A code with no format gets a generic one.
   * @type {string[] | undefined}
   */
  export let countries = undefined;

  /**
   * Specify the locale the country names are written in.
   * It is never read from the browser, so the server and the browser agree.
   */
  export let locale = "en";

  /**
   * Specify the script of the field order and of region names.
   * `"latin"` takes the romanized order where a country has one, such as
   * Japan's: name, street address, city and prefecture, postal code.
   * @type {"native" | "latin"}
   */
  export let script = "native";

  /**
   * Add fields the form leaves out by default.
   * @type {Array<"name" | "organization" | "sortingCode">}
   */
  export let include = [];

  /**
   * Require fields beyond the ones the country requires.
   * @type {import("./address-format.js").AddressField[]}
   */
  export let requiredFields = [];

  /** Specify how many street address fields to show, from 1 to 4 */
  export let addressLines = 2;

  /**
   * Specify the label text of each field, by key (`country`, `name`,
   * `organization`, `line1`, `line2`, `dependentLocality`, `locality`,
   * `region`, `postalCode`, `sortingCode`) or with a function that returns
   * `undefined` to keep the default. The defaults name the field the way
   * its country does: "ZIP code", "Postcode", "PLZ", "CEP", "Prefecture".
   * @type {import("./address-format.js").AddressLabels | undefined}
   */
  export let labels = undefined;

  /** Specify the text added to the label of an optional field. Set to `""` to leave it off. */
  export let optionalText = "optional";

  /** Specify the text of the empty option of the country and region lists */
  export let placeholder = "Select";

  /**
   * Specify the text of a field's error.
   * @type {(field: import("./address-format.js").AddressField | "country", error: import("./address-format.js").AddressError, context: { label: string; example: string }) => string}
   */
  export let errorText = defaultErrorText;

  /**
   * Specify the text announced when the country changes and the fields
   * change with it. `cleared` holds the labels of the fields that were
   * cleared.
   * @type {(context: { country: string; cleared: string[] }) => string}
   */
  export let countryChangeText = defaultCountryChangeText;

  /**
   * Specify the tokens that go in front of each field's `autocomplete`,
   * such as `"shipping"` or `"section-billing billing"`.
   */
  export let autocompletePrefix = "";

  /**
   * Specify the size of the fields.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to disable the fieldset and every field in it */
  export let disabled = false;

  /**
   * Specify formats to use before the built-in table, by country code.
   * @type {Record<string, import("./address-data.js").AddressFormat> | undefined}
   */
  export let formats = undefined;

  /**
   * Specify region lists to use before the built-in ones, by country code,
   * as `key|name|latin name` joined by `~`.
   * @type {Record<string, string> | undefined}
   */
  export let regions = undefined;

  /**
   * Show the errors of every field and move focus to the first invalid one.
   * Call it from a submit handler.
   * @type {() => { valid: boolean; errors: Partial<Record<import("./address-format.js").AddressField | "country", import("./address-format.js").AddressError>> }}
   */
  export function validate() {
    submitted = true;
    tick().then(() => {
      /** @type {HTMLElement | null | undefined} */ (
        container?.querySelector(
          'input[aria-invalid="true"], select[aria-invalid="true"]',
        )
      )?.focus();
    });
    return result;
  }

  import { createEventDispatcher, getContext, tick } from "svelte";
  import FormGroup from "../FormGroup/FormGroup.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import { FORM_CONTEXT_KEY } from "../constants/context-keys.js";
  import { formReset } from "../utils/form-reset.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { ADDRESS_FORMATS } from "./address-data.js";
  import {
    addressLabel,
    autocompleteToken,
    countryName,
    countryOptions,
    fieldValue,
    getAddressFormat,
    layoutFields,
    normalizePostalCode,
    switchCountry,
    validateAddress,
  } from "./address-format.js";

  const dispatch = createEventDispatcher();
  const formContext = getContext(FORM_CONTEXT_KEY);

  // What a form reset restores, as the browser restores a field to the value
  // it was rendered with.
  const initial = JSON.stringify(value ?? {});

  /** @type {null | HTMLElement} */
  let container = null;
  /** @type {Record<string, boolean>} */
  let touched = {};
  let submitted = false;
  let announcement = "";

  /**
   * @param {string} field
   * @param {"required" | "invalid"} error
   * @param {{ label: string; example: string }} context
   */
  function defaultErrorText(field, error, { label, example }) {
    if (field === "country") return "Select a country";
    if (error === "required") return `${label} is required`;
    if (field === "region") return `Select a valid ${label.toLowerCase()}`;
    return example
      ? `Enter a valid ${label} (for example ${example})`
      : `Enter a valid ${label}`;
  }

  /** @param {{ country: string; cleared: string[] }} context */
  function defaultCountryChangeText({ country, cleared }) {
    const changed = `Address fields changed for ${country}.`;
    return cleared.length
      ? `${changed} Cleared: ${cleared.join(", ")}.`
      : changed;
  }

  /**
   * @param {string} key
   * @param {import("./address-format.js").ResolvedAddressFormat} format
   * @param {string} text
   * @param {import("./address-format.js").AddressLabels | undefined} labels
   */
  function labelOf(key, format, text, labels) {
    const custom =
      typeof labels === "function" ? labels(key, format) : labels?.[key];
    return custom || text;
  }

  /**
   * @param {import("./address-format.js").AddressLayoutItem} item
   * @param {import("./address-format.js").ResolvedAddressFormat} format
   * @param {Set<string>} required
   * @param {import("./address-format.js").AddressLabels | undefined} labels
   * @param {string} optionalText
   */
  function describe(item, format, required, labels, optionalText) {
    const label = labelOf(
      item.key,
      format,
      addressLabel(item.field, format, item.index),
      labels,
    );
    const must =
      required.has(item.field) && (item.field !== "lines" || item.index === 0);
    return {
      label,
      required: must,
      text: must || !optionalText ? label : `${label} (${optionalText})`,
    };
  }

  /**
   * @param {Partial<Record<string, import("./address-format.js").AddressError>>} errors
   * @param {Record<string, boolean>} touched
   * @param {boolean} submitted
   * @param {import("./address-format.js").AddressLayoutItem} item
   */
  function shownError(errors, touched, submitted, item) {
    if (item.field === "lines" && item.index > 0) return undefined;
    return submitted || touched[item.key] ? errors[item.field] : undefined;
  }

  /** @param {string} key */
  function fieldName(key) {
    return name ? `${name}.${key}` : undefined;
  }

  /**
   * Svelte's `FullAutoFill` type cannot spell a section name, so the tokens
   * go in untyped.
   * @param {import("./address-format.js").AddressField | "country"} field
   * @param {number} [index]
   * @returns {any}
   */
  function autocomplete(field, index = 0) {
    const token = autocompleteToken(field, index);
    return token
      ? [autocompletePrefix, token].filter(Boolean).join(" ")
      : undefined;
  }

  /** @param {Event} event */
  function handleRegion(event) {
    handleCommit(
      "region",
      0,
      /** @type {HTMLSelectElement} */ (event.currentTarget).value,
    );
  }

  /** @param {string} key */
  function touch(key) {
    if (!touched[key]) touched = { ...touched, [key]: true };
  }

  /**
   * @param {import("./address-format.js").AddressField} field
   * @param {number} index
   * @param {string} text
   */
  function setField(field, index, text) {
    const next = { ...value };
    if (field === "lines") {
      const lines = [...(value?.lines ?? [])];
      while (lines.length <= index) lines.push("");
      lines[index] = text;
      next.lines = lines;
    } else {
      next[field] = text;
    }
    value = next;
  }

  /**
   * @param {import("./address-format.js").AddressField} field
   * @param {number} index
   * @param {string} text
   */
  function handleInput(field, index, text) {
    announcement = "";
    setField(field, index, text);
  }

  /**
   * Tidy a field as it commits, so the postal code takes the country's own
   * form, and tell the owner.
   * @param {import("./address-format.js").AddressField} field
   * @param {number} index
   * @param {string} text
   */
  function handleCommit(field, index, text) {
    const tidy =
      field === "postalCode"
        ? normalizePostalCode(country, text, { formats })
        : text.trim();
    setField(field, index, tidy);
    dispatch("change", { value });
  }

  // The fields restore themselves to empty on a reset, whatever the value
  // says, so they are built again from the restored value.
  let resets = 0;

  function handleReset() {
    resets++;
    value = JSON.parse(initial);
    touched = {};
    submitted = false;
    announcement = "";
    dispatch("change", { value });
  }

  /** @param {Event} event */
  function handleCountry(event) {
    const to = /** @type {HTMLSelectElement} */ (event.currentTarget).value;
    if (!to || to === country) return;
    const from = country;
    const fromFormat = format;
    const moved = switchCountry(value ?? {}, to, { formats, regions });
    value = moved.value;
    touched = {};
    submitted = false;
    announcement = countryChangeText({
      country: countryName(to, locale),
      cleared: moved.cleared.map((field) =>
        labelOf(
          field === "lines" ? "line1" : field,
          fromFormat,
          addressLabel(field, fromFormat),
          labels,
        ),
      ),
    });
    dispatch("countrychange", {
      from,
      to,
      cleared: moved.cleared,
      value: moved.value,
    });
    dispatch("change", { value: moved.value });
  }

  // The country is a primitive, so a keystroke in another field leaves the
  // format, the layout and the labels alone.
  $: country = (value?.country ?? "").toUpperCase();
  $: format = getAddressFormat(country, { formats, regions, script });
  $: layout = layoutFields(format, { addressLines, include });
  $: requiredSet = new Set([...format.required, ...requiredFields]);
  $: codes = countries ?? Object.keys({ ...ADDRESS_FORMATS, ...formats });
  $: countryItems = countryOptions(
    country && !codes.includes(country) ? [...codes, country] : codes,
    locale,
  );
  $: result = validateAddress(value ?? {}, {
    formats,
    regions,
    script,
    required: requiredFields,
  });
  $: errors = result.errors;
  $: fluid = !!formContext?.isFluid;
  $: countryLabel = labelOf(
    "country",
    format,
    addressLabel("country", format),
    labels,
  );
  $: countryError = submitted || touched.country ? errors.country : undefined;
</script>

<FormGroup {...$$restProps} {id} {disabled} {legendText}>
  <div
    bind:this={container}
    use:formReset={handleReset}
    class:bx--address-form={true}
    class:bx--address-form--fluid={fluid}
  >
    <div
      class:bx--address-form__field={true}
      style:--ccs-address-form-span="12"
    >
      <Select
        id="{id}-country"
        name={fieldName("country")}
        labelText={countryLabel}
        selected={country}
        required
        {size}
        autocomplete={autocomplete("country")}
        invalid={!!countryError}
        invalidText={countryError
          ? errorText("country", countryError, {
              label: countryLabel,
              example: "",
            })
          : ""}
        on:change={handleCountry}
        on:blur={() => touch("country")}
      >
        <SelectItem value="" text={placeholder} disabled hidden />
        {#each countryItems as item (item.value)}
          <SelectItem value={item.value} text={item.text} />
        {/each}
      </Select>
    </div>
    {#key resets}
      {#each layout as item (item.key)}
        {@const meta = describe(
          item,
          format,
          requiredSet,
          labels,
          optionalText,
        )}
        {@const error = shownError(errors, touched, submitted, item)}
        <div
          class:bx--address-form__field={true}
          style:--ccs-address-form-span={item.span}
        >
          {#if item.field === "region" && format.regions}
            <Select
              id="{id}-{item.key}"
              name={fieldName(item.key)}
              labelText={meta.text}
              selected={fieldValue(value, "region")}
              required={meta.required}
              {size}
              autocomplete={autocomplete("region")}
              invalid={!!error}
              invalidText={error
                ? errorText(item.field, error, {
                    label: meta.label,
                    example: "",
                  })
                : ""}
              on:change={handleRegion}
              on:blur={() => touch(item.key)}
            >
              <SelectItem
                value=""
                text={meta.required ? placeholder : ""}
                disabled={meta.required}
                hidden={meta.required}
              />
              {#each format.regions as region (region.value)}
                <SelectItem value={region.value} text={region.text} />
              {/each}
            </Select>
          {:else}
            <TextInput
              id="{id}-{item.key}"
              name={fieldName(item.key)}
              labelText={meta.text}
              value={fieldValue(value, item.field, item.index)}
              required={meta.required}
              {size}
              autocomplete={autocomplete(item.field, item.index)}
              invalid={!!error}
              invalidText={error
                ? errorText(item.field, error, {
                    label: meta.label,
                    example:
                      item.field === "postalCode" ? format.postalExample : "",
                  })
                : ""}
              on:input={(event) =>
                handleInput(item.field, item.index, `${event.detail ?? ""}`)}
              on:change={(event) =>
                handleCommit(item.field, item.index, `${event.detail ?? ""}`)}
              on:blur={() => touch(item.key)}
            />
          {/if}
        </div>
      {/each}
    {/key}
  </div>
  <div class:bx--visually-hidden={true} role="status" aria-live="polite">
    {announcement}
  </div>
</FormGroup>
