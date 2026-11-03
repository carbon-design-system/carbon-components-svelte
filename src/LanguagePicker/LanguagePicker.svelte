<script>
  /**
   * A field for choosing a language by its BCP 47 tag, from the languages the
   * browser can name, each shown in the UI locale and in itself.
   * @restProps {input}
   * @slot {{}} labelChildren
   * @event change
   * @type {object}
   * @property {string} value - The language tag, such as `"fr"` or `"pt-BR"`.
   * @property {string} label - The name shown in the field.
   * @property {string} name - The name in the UI locale.
   * @property {string} endonym - The name in the language itself, such as "français". Empty where it is the same as `name`, or the engine has no data.
   * @property {"ltr" | "rtl"} dir - The direction the language is written in.
   * @property {any} metadata - What `metadata` returned for the language.
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
   * The BCP 47 tag of the chosen language. `""` for none.
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
   * Limit the list to these language tags, in this order, instead of every
   * language the engine can name.
   * @type {ReadonlyArray<string> | undefined}
   */
  export let values = undefined;

  /**
   * Set to `true` to add the script and region variants people most often
   * need, such as "pt-BR", "es-419" and "zh-Hant", beside their languages.
   */
  export let variants = false;

  /**
   * Set how a variant is named.
   * - `"standard"`: "Portuguese (Brazil)", which sorts beside "Portuguese".
   * - `"dialect"`: "Brazilian Portuguese", where the engine knows one.
   * @type {"standard" | "dialect"}
   */
  export let languageDisplay = "standard";

  /**
   * Fill an empty `value` with the browser's best language that the list has
   * once the field has mounted. No `change` event fires for it.
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
  export let placeholder = "Select a language";

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
   * Specify a name attribute. A hidden input carries it with the language tag,
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
  import { createLanguageSource } from "../utils/intl-languages.js";
  import { uniqueId } from "../utils/unique-id.js";

  let sourceKey = "";
  /** @type {import("../utils/intl-languages.js").LanguageSource} */
  let source;
  $: rebuild(locale, values, variants, languageDisplay);

  /**
   * A new source for a change that matters. A `values` array that is new but
   * equal changes nothing.
   * @param {string} nextLocale
   * @param {ReadonlyArray<string> | undefined} nextValues
   * @param {boolean} nextVariants
   * @param {"standard" | "dialect"} nextDisplay
   */
  function rebuild(nextLocale, nextValues, nextVariants, nextDisplay) {
    const key = `${nextLocale}\n${nextVariants}\n${nextDisplay}\n${nextValues ? nextValues.join("\n") : ""}`;
    if (key === sourceKey) return;
    sourceKey = key;
    source = createLanguageSource({
      locale: nextLocale,
      values: nextValues,
      variants: nextVariants,
      languageDisplay: nextDisplay,
    });
  }

  $: fieldProps = {
    ...$$restProps,
    kind: /** @type {const} */ ("language"),
    source,
    locale,
    detect,
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
