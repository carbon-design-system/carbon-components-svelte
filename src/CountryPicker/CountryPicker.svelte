<script>
  /**
   * A field for choosing a country or territory by its ISO 3166 region code,
   * from the regions the browser can name.
   * @restProps {input}
   * @slot {{}} labelChildren
   * @event change
   * @type {object}
   * @property {string} value - The region code, such as `"CH"`.
   * @property {string} label - The name shown in the field.
   * @property {string} name - The name in the UI locale.
   * @property {string} nativeName - The name in the region's main language, such as "Schweiz". Empty where it is the UI language or the engine has no data.
   * @property {any} metadata - What `metadata` returned for the region.
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
   * The ISO 3166-1 alpha-2 code of the chosen region, or a UN M.49 code such
   * as `"150"` when `values` lists one. `""` for none.
   * @type {string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the locale the names are written in.
   * Changing it at runtime renames the field and the menu.
   * Where the browser has no data for the locale, names are in English.
   */
  export let locale = "en";

  /**
   * Limit the list to these region codes, in this order, instead of every
   * country and territory the engine can name. UN M.49 codes name groups
   * ("019" is the Americas).
   * @type {ReadonlyArray<string> | undefined}
   */
  export let values = undefined;

  /**
   * Set how a region's flag shows in the menu.
   * - `"auto"`: the region's `Flag`, and its code in a box of the same size
   *   where none is drawn yet. The flags load when the menu first opens.
   * - `"badge"`: the code in a box.
   * - `"none"`: the name alone.
   * @type {"auto" | "badge" | "none"}
   */
  export let flag = "auto";

  /**
   * Fill an empty `value` with the region the UI `locale` is most likely
   * used in ("US" for `"en"`) once the field has mounted. No `change` event
   * fires for it.
   */
  export let detect = false;

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
  export let placeholder = "Select a country or region";

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
   * Specify a name attribute. A hidden input carries it with the region code,
   * since the visible field holds the name.
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
  import { createRegionSource } from "../utils/intl-regions.js";
  import { uniqueId } from "../utils/unique-id.js";

  let sourceKey = "";
  /** @type {import("../utils/intl-regions.js").RegionSource} */
  let source;
  $: rebuild(locale, values);

  /**
   * A new source for a change that matters. A `values` array that is new but
   * equal changes nothing.
   * @param {string} nextLocale
   * @param {ReadonlyArray<string> | undefined} nextValues
   */
  function rebuild(nextLocale, nextValues) {
    const key = `${nextLocale}\n${nextValues ? nextValues.join("\n") : ""}`;
    if (key === sourceKey) return;
    sourceKey = key;
    source = createRegionSource({ locale: nextLocale, values: nextValues });
  }

  // The flags are one module of every flag, so load it the first time the
  // menu opens, and only for a picker that shows them. A page that never opens
  // the menu never fetches it.
  /** @type {import("../flags/all.js").getFlag | undefined} */
  let getFlag;
  let loading = false;
  $: if (flag === "auto" && open && !loading) load();

  /** @type {"flag" | "badge" | "none"} */
  let shownFlag = "none";
  $: shownFlag = flag === "auto" ? "flag" : flag;

  async function load() {
    loading = true;
    try {
      getFlag = (await import("../flags/all.js")).getFlag;
    } catch {
      // Offline, or a blocked chunk: every row shows its code instead.
      getFlag = () => undefined;
    }
  }

  $: fieldProps = {
    ...$$restProps,
    kind: /** @type {const} */ ("region"),
    source,
    locale,
    detect,
    flag: shownFlag,
    getFlag,
    lang: locale,
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
