<script>
  /**
   * @event {{ value: string; source: "enter" | "delimiter" | "paste" | "blur" }} add - Cancelable. Dispatched before an entry is added; call `preventDefault()` to keep it out.
   * @event {{ value: string; index: number }} remove - Cancelable. Dispatched before an entry is removed; call `preventDefault()` to keep it.
   * @event {{ value: string; reason: "duplicate" | "max" | "validate"; message?: string }} invalid - Dispatched when an entry is rejected.
   * @event {string[]} change - Dispatched after entries are added or removed.
   * @restProps {input}
   */

  /**
   * Specify the entries, each in canonical form.
   * Follows the field when the owning form resets.
   * @type {string[]}
   * @bindable writable
   */
  export let value = [];

  /**
   * The parsed entries, in the order of `value`.
   * @type {import("../utils/ip-address.js").ParsedIPAddress[]}
   * @bindable readonly
   */
  export let parsed = [];

  /**
   * Forms an entry may take. Allowing `"range"` stops whitespace from
   * splitting pasted text, since a range is written with spaces around its
   * hyphen.
   * @type {("address" | "cidr" | "range")[]}
   */
  export let allow = ["address", "cidr"];

  /**
   * Require one IP version.
   * @type {"any" | 4 | 6}
   */
  export let version = "any";

  /**
   * How to read an octet with a leading zero, such as `010`.
   * @type {"error" | "strip"}
   */
  export let leadingZeros = "error";

  /**
   * What a CIDR block with host bits set (`10.0.1.77/24`) does.
   * @type {"error" | "mask" | "allow"}
   */
  export let hostBits = "error";

  /**
   * Shortest prefix length (largest block) a CIDR block may have.
   * @type {number | undefined}
   */
  export let minPrefix = undefined;

  /**
   * Longest prefix length (smallest block) a CIDR block may have.
   * @type {number | undefined}
   */
  export let maxPrefix = undefined;

  /**
   * Require each entry to sit inside at least one of these CIDR blocks,
   * ranges, or addresses.
   * @type {string | string[] | undefined}
   */
  export let within = undefined;

  /**
   * Reject an entry that overlaps any of these CIDR blocks, ranges, or
   * addresses.
   * @type {string | string[] | undefined}
   */
  export let excludes = undefined;

  /**
   * Translate the rejection messages. Return `undefined` to keep the
   * English default. Ids are the codes of `parseIPAddress`
   * (`"octet-too-large"`, `"host-bits"`, `"outside"`, ...).
   * @type {((id: string, params: Record<string, string | number>) => string | undefined) | undefined}
   */
  export let translateWithId = undefined;

  /**
   * Set the size of the field. Tags scale with it.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Specify the helper text.
   * @type {string}
   */
  export let helperText = "";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Set to `true` to disable the field and its tags */
  export let disabled = false;

  /** Set to `true` to show the entries without letting users add or remove any */
  export let readonly = false;

  /** Set to `true` to require at least one entry */
  export let required = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Maximum number of entries.
   * @type {number | undefined}
   */
  export let max = undefined;

  /** Set an id for the text input */
  export let id = uniqueId();

  /**
   * Specify a name to submit each entry as a hidden input with the form.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the text input element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import Tag from "../Tag/Tag.svelte";
  import TagInput from "../TagInput/TagInput.svelte";
  import {
    checkIPAddressBounds,
    cleanIPAddressText,
    parseIPAddress,
    resolveIPRanges,
  } from "../utils/ip-address.js";
  import { uniqueId } from "../utils/unique-id.js";

  $: withinRanges = resolveIPRanges(within);
  $: excludeRanges = resolveIPRanges(excludes);
  // A range is written with spaces around its hyphen, so whitespace cannot
  // split pasted text when ranges are allowed. Pasted line breaks still do.
  $: delimiter = allow.includes("range") ? /[,;]/ : /[\s,;]/;

  // Addresses are not words: no capital letters, no spellcheck squiggles under
  // hex, and they read left to right on a right-to-left page.
  const INPUT_ATTRS = /** @type {const} */ ({
    autocapitalize: "off",
    spellcheck: "false",
    dir: "ltr",
  });

  /** @param {string} text */
  function parseEntry(text) {
    const result = parseIPAddress(text, {
      allow,
      version,
      leadingZeros,
      hostBits,
      minPrefix,
      maxPrefix,
    });
    if (!result.ok) return { value: null, error: result.error };
    return {
      value: result.value,
      error: checkIPAddressBounds(result.value, {
        within: withinRanges,
        excludes: excludeRanges,
      }),
    };
  }

  // TagInput holds these; they read the options when called, so a change to
  // an option needs no new function.
  /** @param {string} raw */
  function normalize(raw) {
    const text = cleanIPAddressText(raw);
    const entry = parseEntry(text);
    return entry.value ? entry.value.text : text;
  }

  /** @param {string} tag */
  function validate(tag) {
    const { error } = parseEntry(tag);
    if (!error) return true;
    return translateWithId?.(error.code, error.params) ?? error.message;
  }

  // The same props go to both branches of the label slot below.
  $: fieldProps = {
    ...INPUT_ATTRS,
    ...$$restProps,
    size,
    labelText,
    hideLabel,
    helperText,
    placeholder,
    disabled,
    readonly,
    required,
    invalid,
    invalidText,
    warn,
    warnText,
    max,
    id,
    name,
    delimiter,
    normalize,
    validate,
    isDuplicate: (/** @type {string} */ a, /** @type {string} */ b) => a === b,
  };

  // `value` and the options are what the statement depends on.
  $: parsed = parseAll(
    value,
    allow,
    version,
    leadingZeros,
    hostBits,
    minPrefix,
    maxPrefix,
    withinRanges,
    excludeRanges,
  );

  /**
   * @param {string[]} entries
   * @param {...unknown} _options
   */
  function parseAll(entries, ..._options) {
    return entries.flatMap((text) => {
      const entry = parseEntry(text);
      return entry.value ? [entry.value] : [];
    });
  }
</script>

{#if $$slots.labelChildren}
  <TagInput
    {...fieldProps}
    bind:value
    bind:ref
    on:add
    on:remove
    on:invalid
    on:change
    on:focus
    on:blur
    on:keydown
    on:paste
  >
    <svelte:fragment slot="labelChildren"
      ><slot name="labelChildren" /></svelte:fragment
    >
    <svelte:fragment slot="tag" let:tag let:props>
      <Tag {...props}><bdi dir="ltr">{tag}</bdi></Tag>
    </svelte:fragment>
  </TagInput>
{:else}
  <TagInput
    {...fieldProps}
    bind:value
    bind:ref
    on:add
    on:remove
    on:invalid
    on:change
    on:focus
    on:blur
    on:keydown
    on:paste
  >
    <svelte:fragment slot="tag" let:tag let:props>
      <Tag {...props}><bdi dir="ltr">{tag}</bdi></Tag>
    </svelte:fragment>
  </TagInput>
{/if}
