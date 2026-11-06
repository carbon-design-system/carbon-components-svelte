<script>
  /**
   * @event {{ value: string; parsed: import("../utils/ip-address.js").ParsedIPAddress | null; error: import("../utils/ip-address.js").IPAddressError | null }} input - Dispatched as the person types.
   * @event {{ value: string; parsed: import("../utils/ip-address.js").ParsedIPAddress | null; error: import("../utils/ip-address.js").IPAddressError | null }} change - Dispatched when the person commits the text (blur or Enter), after it is normalized.
   * @restProps {input}
   */

  /**
   * Specify the field's text.
   * With `normalizeOnBlur`, a valid entry is rewritten to its canonical
   * form when the person commits it. Follows the field when the owning form
   * resets.
   * @type {string}
   * @bindable writable
   */
  export let value = "";

  /**
   * The parsed value: `kind`, `version`, canonical `address`, `prefix`,
   * `start`, `end`, `size` (as `BigInt`), `port`, `zone`, and the canonical
   * `text`. `null` when the field is empty or does not parse.
   * @type {import("../utils/ip-address.js").ParsedIPAddress | null}
   * @bindable readonly
   */
  export let parsed = null;

  /**
   * Whether the text is empty or passes every check (`allow`, `version`,
   * `within`, `excludes`, and the rest). It does not follow `invalid`.
   * @bindable readonly
   */
  export let valid = true;

  /**
   * Forms to accept: a single address, a CIDR block, a range.
   * @type {("address" | "cidr" | "range")[]}
   */
  export let allow = ["address"];

  /**
   * Require one IP version.
   * @type {"any" | 4 | 6}
   */
  export let version = "any";

  /** Set to `true` to accept a port: `1.2.3.4:8080` and `[::1]:443` */
  export let port = false;

  /** Set to `true` to accept an IPv6 zone identifier, as in `fe80::1%eth0` */
  export let zone = false;

  /**
   * How to read an octet with a leading zero, such as `010`. Some systems
   * read it as octal, so the default rejects it and suggests the decimal
   * octet. `"strip"` reads it as decimal.
   * @type {"error" | "strip"}
   */
  export let leadingZeros = "error";

  /**
   * What a CIDR block with host bits set (`10.0.1.77/24`) does. `"error"`
   * suggests the network address; `"mask"` rewrites it to the network
   * address; `"allow"` keeps the address, as an interface address needs.
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
   * Require the entry to sit inside at least one of these CIDR blocks,
   * ranges, or addresses. Entries that do not parse are ignored.
   * @type {string | string[] | undefined}
   */
  export let within = undefined;

  /**
   * Reject an entry that overlaps any of these CIDR blocks, ranges, or
   * addresses. Entries that do not parse are ignored.
   * @type {string | string[] | undefined}
   */
  export let excludes = undefined;

  /**
   * When an error shows. `"blur"` waits until the person commits the text
   * (blur or Enter) and then keeps it up to date as they edit; `"input"`
   * shows it from the first character.
   * @type {"blur" | "input"}
   */
  export let validateOn = "blur";

  /**
   * Set to `false` to leave the text as typed when it is committed.
   * By default a valid entry becomes its canonical form: no leading zeros,
   * RFC 5952 compression for IPv6, lowercase hex.
   */
  export let normalizeOnBlur = true;

  /** Set to `true` to hide the preview of a CIDR block, a range, or a normalized address */
  export let hidePreview = false;

  /**
   * Specify the locale that formats address counts.
   * @type {string}
   */
  export let locale = "en";

  /**
   * Translate the error messages and the preview labels. Return `undefined`
   * to keep the English default. Error ids are the codes of
   * `parseIPAddress` (`"octet-too-large"`, `"host-bits"`, `"outside"`, ...).
   * Preview ids are `"addresses"` (`count`, `one`), `"network"`,
   * `"broadcast"`, `"usable"` (`count`), `"normalized"` and `"example"`.
   * @type {((id: string, params: Record<string, string | number>) => string | undefined) | undefined}
   */
  export let translateWithId = undefined;

  /**
   * Set the size of the input.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Specify the helper text. It defaults to an example of each accepted
   * form; pass an empty string for none.
   * @type {string | undefined}
   */
  export let helperText = undefined;

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /** Set to `true` to indicate an invalid state. It takes over from the parse error. */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the input.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import { joinDescribedBy } from "../utils/field-status.js";
  import {
    checkIPAddressBounds,
    cleanIPAddressText,
    describeIPRange,
    parseIPAddress,
    resolveIPRanges,
  } from "../utils/ip-address.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  // Addresses are not words: no autocorrect, no capital letters, and no
  // spellcheck squiggles under hex. The field reads left to right on a
  // right-to-left page through its CSS, not a `dir` attribute: the attribute
  // would also reset the `--ccs-rtl` hooks the status icon padding reads.
  const INPUT_ATTRS = /** @type {const} */ ({
    autocomplete: "off",
    autocapitalize: "off",
    spellcheck: "false",
  });

  /** Set once the person commits the text, so `validateOn="blur"` can show errors. */
  let touched = false;

  $: previewId = `ip-preview-${id}`;
  $: withinRanges = resolveIPRanges(within);
  $: excludeRanges = resolveIPRanges(excludes);

  /**
   * @param {string} text
   * @param {Record<string, unknown>} _deps  Lists what the result depends on, so `$:` re-runs it.
   */
  function analyze(text, _deps) {
    const typed = cleanIPAddressText(text ?? "");
    if (typed === "") return { typed, parsed: null, error: null };
    const result = parseIPAddress(typed, {
      allow,
      version,
      port,
      zone,
      leadingZeros,
      hostBits,
      minPrefix,
      maxPrefix,
    });
    if (!result.ok) return { typed, parsed: null, error: result.error };
    return {
      typed,
      parsed: result.value,
      error: checkIPAddressBounds(result.value, {
        within: withinRanges,
        excludes: excludeRanges,
      }),
    };
  }

  /**
   * @param {string} id
   * @param {Record<string, string | number>} params
   * @param {string} fallback
   */
  function t(id, params, fallback) {
    return translateWithId?.(id, params) ?? fallback;
  }

  $: analysis = analyze(value, {
    allow,
    version,
    port,
    zone,
    leadingZeros,
    hostBits,
    minPrefix,
    maxPrefix,
    withinRanges,
    excludeRanges,
  });
  $: parsed = analysis.parsed;
  $: valid = analysis.error === null;
  $: errorText = analysis.error
    ? t(analysis.error.code, analysis.error.params, analysis.error.message)
    : "";
  $: showError = !!analysis.error && (validateOn === "input" || touched);

  // The browser's own validity, so a form with a bad address does not submit.
  $: ref?.setCustomValidity(errorText);

  const EXAMPLES = {
    4: {
      address: "10.0.0.1",
      cidr: "10.0.0.0/24",
      range: "10.0.0.1-10.0.0.50",
    },
    6: {
      address: "2001:db8::1",
      cidr: "2001:db8::/32",
      range: "2001:db8::1-2001:db8::ff",
    },
  };

  $: example = (() => {
    const family = version === 6 ? 6 : 4;
    const list = allow.map((kind) => EXAMPLES[family][kind]).filter(Boolean);
    return list.join(", ");
  })();
  $: resolvedHelperText =
    helperText ??
    (example ? t("example", { example }, `Example: ${example}`) : "");

  /** @param {bigint} count */
  function formatCount(count) {
    const bits = count.toString(2).length - 1;
    const power = count === BigInt(1) << BigInt(bits);
    // Beyond what a person can read as digits, a block is a power of two.
    if (count > BigInt(Number.MAX_SAFE_INTEGER) && power) return `2^${bits}`;
    try {
      return count.toLocaleString(locale);
    } catch {
      return count.toString();
    }
  }

  /**
   * @param {import("../utils/ip-address.js").ParsedIPAddress} p
   * @param {string} typed
   */
  function buildPreview(p, typed) {
    if (p.kind === "address") {
      return p.text === typed
        ? null
        : {
            normalized: t("normalized", { text: p.text }, "Normalized"),
            text: p.text,
          };
    }
    const span = describeIPRange(p);
    const count = formatCount(span.size);
    const one = span.size === BigInt(1);
    const rows = [];
    if (
      p.kind === "cidr" &&
      p.version === 4 &&
      p.prefix !== null &&
      p.prefix <= 31
    ) {
      if (span.network && span.broadcast) {
        rows.push({
          label: t("network", {}, "Network"),
          value: span.network,
        });
        rows.push({
          label: t("broadcast", {}, "Broadcast"),
          value: span.broadcast,
        });
      }
      rows.push({
        label: t("usable", { count: formatCount(span.usable) }, "Usable"),
        value: `${span.firstUsable} – ${span.lastUsable}`,
        count: formatCount(span.usable),
      });
    }
    return {
      summary: t(
        "addresses",
        { count, one: one ? 1 : 0 },
        `${count} ${one ? "address" : "addresses"}`,
      ),
      first: span.first,
      last: span.last,
      rows,
    };
  }

  $: preview =
    hidePreview || !analysis.parsed
      ? null
      : buildPreview(analysis.parsed, analysis.typed);

  // The same props go to both branches of the label slot below.
  $: fieldProps = {
    ...INPUT_ATTRS,
    ...$$restProps,
    size,
    labelText,
    hideLabel,
    helperText: resolvedHelperText,
    placeholder,
    disabled,
    readonly,
    required,
    invalid: invalid || showError,
    invalidText: invalid ? invalidText : errorText,
    warn,
    warnText,
    id,
    name,
    "aria-describedby": joinDescribedBy(
      preview && previewId,
      $$restProps["aria-describedby"],
    ),
  };

  /** @param {CustomEvent<string | number | null>} event */
  function handleInput(event) {
    const text = String(event.detail ?? "");
    const a = analyze(text, {});
    dispatch("input", { value: text, parsed: a.parsed, error: a.error });
  }

  /** @param {CustomEvent<string | number | null>} event */
  function handleChange(event) {
    touched = true;
    let text = String(event.detail ?? "");
    const a = analyze(text, {});
    if (normalizeOnBlur && a.parsed) text = a.parsed.text;
    if (text !== value) value = text;
    dispatch("change", { value: text, parsed: a.parsed, error: a.error });
  }

  function handleBlur() {
    touched = true;
  }
</script>

<div class:bx--form-item={true} class:bx--ip-address-input={true}>
  {#if $$slots.labelChildren}
    <TextInput
      {...fieldProps}
      bind:value
      bind:ref
      on:input={handleInput}
      on:change={handleChange}
      on:blur={handleBlur}
      on:blur
      on:focus
      on:keydown
      on:keyup
      on:paste
      on:click
    >
      <svelte:fragment slot="labelChildren"
        ><slot name="labelChildren" /></svelte:fragment
      >
    </TextInput>
  {:else}
    <TextInput
      {...fieldProps}
      bind:value
      bind:ref
      on:input={handleInput}
      on:change={handleChange}
      on:blur={handleBlur}
      on:blur
      on:focus
      on:keydown
      on:keyup
      on:paste
      on:click
    />
  {/if}
  {#if preview}
    <div id={previewId} class:bx--ip-address-input__preview={true}>
      {#if "text" in preview}
        <p class:bx--ip-address-input__summary={true}>
          {preview.normalized}: <bdi dir="ltr">{preview.text}</bdi>
        </p>
      {:else}
        <p class:bx--ip-address-input__summary={true}>
          {preview.summary}:
          <bdi dir="ltr">{preview.first} &ndash; {preview.last}</bdi>
        </p>
        {#if preview.rows.length > 0}
          <dl class:bx--ip-address-input__details={true}>
            {#each preview.rows as row (row.label)}
              <dt>{row.label}</dt>
              <dd>
                <bdi dir="ltr">{row.value}</bdi
                >{#if row.count}&nbsp;({row.count}){/if}
              </dd>
            {/each}
          </dl>
        {/if}
      {/if}
    </div>
  {/if}
</div>
