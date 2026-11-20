<script>
  /**
   * A field for choosing an IANA time zone, from the zones the browser knows.
   * @restProps {input}
   * @slot {{}} labelChildren
   * @event change
   * @type {object}
   * @property {string} value - The IANA name, such as `"America/Los_Angeles"`.
   * @property {string} label - The city shown in the field.
   * @property {string} city
   * @property {string} area - The IANA area, such as `"America"`.
   * @property {string} name - The generic name in the UI locale, such as "Pacific Time". Empty where the engine has none.
   * @property {number} offset - Minutes east of UTC at `date`.
   * @property {string} offsetText - The offset as "UTC-08:00".
   * @property {boolean} observesDst - Whether the offset differs between January and July.
   * @property {boolean} dst - Whether `date` falls in daylight time.
   * @property {any} metadata - What `metadata` returned for the zone.
   * @event {null} clear
   */

  /**
   * @event open
   * @type {object}
   * @property {"click" | "keydown" | "input" | "programmatic"} trigger
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * The IANA name of the chosen zone. `""` for none.
   * An alias the engine spells differently, such as "Asia/Kolkata" for
   * "Asia/Calcutta", still selects its zone, and `value` keeps the spelling it
   * was given until the user chooses another.
   * @type {string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the locale the names are written in.
   * The city is always the IANA name, which has no translation in `Intl`.
   * Changing it at runtime renames the field and the menu.
   */
  export let locale = "en";

  /**
   * Limit the list to these IANA names, in this order, instead of every zone
   * the engine knows. A name the engine rejects is dropped. Also the list on
   * an engine without `Intl.supportedValuesOf`, where the default holds only
   * UTC and the browser's own zone.
   * @type {ReadonlyArray<string> | undefined}
   */
  export let values = undefined;

  /**
   * Fill an empty `value` with the browser's zone once the field has mounted.
   * Never runs on the server, so the server's zone cannot leak into the page.
   * No `change` event fires for it. Set to `false` to leave the field empty
   * until the user chooses.
   */
  export let detect = true;

  /**
   * Read each zone's offset at this instant, which decides whether it is in
   * daylight time. Left unset, offsets follow the clock and refresh each
   * minute.
   * @type {Date | undefined}
   */
  export let date = undefined;

  /**
   * Replace an area's heading, which is its name in the UI locale, such as
   * "Americas". Areas that no region names, such as "Atlantic", arrive in
   * English.
   * @type {(area: string, label: string) => string}
   */
  export let groupText = function groupText(_area, label) {
    return label;
  };

  /**
   * Add to the `change` event's detail.
   * @type {((value: string) => any) | undefined}
   */
  export let metadata = undefined;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the placeholder text */
  export let placeholder = "Select a time zone";

  /** Specify the helper text */
  export let helperText = "";

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

  /** Set to `true` to require a value */
  export let required = false;

  /**
   * Set the size of the field.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the direction of the menu.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to always render the menu in a portal, or `false` to keep
   * it in place. Left unset, the menu moves to a portal inside a Modal.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  /** Specify the message shown when nothing matches the query */
  export let emptyText = "No results";

  /**
   * Build the message announced to screen readers as typing changes the
   * number of matches.
   * @type {(count: number) => string}
   */
  export let filterResultsText = function filterResultsText(count) {
    return count === 0
      ? "No results"
      : `${count} result${count === 1 ? "" : "s"} available`;
  };

  /**
   * Specify a name attribute. A hidden input carries it with the IANA name,
   * since the visible field holds the city.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Set an id for the field.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the input element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import IntlPicker from "../IntlPicker/IntlPicker.svelte";
  import { regionName } from "../utils/intl-display-names.js";
  import { createTimeZoneSource } from "../utils/intl-time-zones.js";
  import { uniqueId } from "../utils/unique-id.js";

  let sourceKey = "";
  let prevGroupText = groupText;
  /** @type {import("../utils/intl-time-zones.js").TimeZoneSource} */
  let source;
  $: rebuild(locale, values, date, groupText);

  /**
   * A new source for a change that matters. A `values` array or a `date` that
   * is new but equal changes nothing, so a parent that rebuilds them on every
   * render does not rebuild the list.
   * @param {string} nextLocale
   * @param {ReadonlyArray<string> | undefined} nextValues
   * @param {Date | undefined} nextDate
   * @param {typeof groupText} nextGroupText
   */
  function rebuild(nextLocale, nextValues, nextDate, nextGroupText) {
    const key = `${nextLocale}\n${nextValues ? nextValues.join("\n") : ""}\n${nextDate ? nextDate.getTime() : ""}`;
    if (key === sourceKey && nextGroupText === prevGroupText) return;
    sourceKey = key;
    prevGroupText = nextGroupText;
    source = createTimeZoneSource({
      locale: nextLocale,
      values: nextValues,
      date: nextDate,
      groupText: nextGroupText,
      regionName: (code) => regionName(nextLocale, code),
    });
  }

  $: fieldProps = {
    ...$$restProps,
    kind: /** @type {const} */ ("timeZone"),
    source,
    locale,
    detect,
    metadata,
    labelText,
    hideLabel,
    placeholder,
    helperText,
    invalid,
    invalidText,
    warn,
    warnText,
    disabled,
    readonly,
    required,
    size,
    direction,
    portalMenu,
    emptyText,
    filterResultsText,
    name,
    id,
  };
</script>

{#if $$slots.labelChildren}
  <IntlPicker
    {...fieldProps}
    bind:value
    bind:open
    bind:ref
    on:change
    on:clear
    on:open
    on:close
    on:focus
    on:blur
    on:keydown
    on:keyup
    on:paste
  >
    <svelte:fragment slot="labelChildren">
      <slot name="labelChildren" />
    </svelte:fragment>
  </IntlPicker>
{:else}
  <IntlPicker
    {...fieldProps}
    bind:value
    bind:open
    bind:ref
    on:change
    on:clear
    on:open
    on:close
    on:focus
    on:blur
    on:keydown
    on:keyup
    on:paste
  />
{/if}
