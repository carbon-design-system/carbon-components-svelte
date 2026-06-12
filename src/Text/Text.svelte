<script>
  import truncate from "../Truncate/truncate.js";

  /**
   * @restProps {any}
   * @slot {{}}
   */

  /**
   * Set the Carbon type style.
   * @type {"caption-01" | "caption-02" | "label-01" | "label-02" | "helper-text-01" | "helper-text-02" | "body-short-01" | "body-short-02" | "body-long-01" | "body-long-02" | "code-01" | "code-02" | "heading-01" | "heading-02" | "productive-heading-01" | "productive-heading-02" | "productive-heading-03" | "productive-heading-04" | "productive-heading-05" | "productive-heading-06" | "productive-heading-07" | "expressive-paragraph-01" | "expressive-heading-01" | "expressive-heading-02" | "expressive-heading-03" | "expressive-heading-04" | "expressive-heading-05" | "expressive-heading-06" | "quotation-01" | "quotation-02" | "display-01" | "display-02" | "display-03" | "display-04"}
   */
  export let type = "body-long-01";

  /**
   * Set the text color using a Carbon text token.
   * @type {"primary" | "secondary" | "placeholder" | "helper" | "on-color" | "inverse" | "error" | "disabled"}
   */
  export let color = undefined;

  /**
   * Set the font weight.
   * @type {"light" | "regular" | "semibold"}
   */
  export let weight = undefined;

  /** Set to `true` to render italic text */
  export let italic = false;

  /**
   * Set the font family.
   * @type {"mono" | "sans" | "serif" | "sans-condensed" | "sans-hebrew"}
   */
  export let family = undefined;

  /**
   * Set text wrapping behavior.
   * @type {"break-word" | "nowrap"}
   */
  export let wrap = undefined;

  /** Set to `true` to balance line lengths across broken headings and short blocks */
  export let balance = false;

  /**
   * Set the max width. Numbers are treated as pixels; strings accept any CSS length (e.g. `"38ch"`, `"20rem"`).
   * @type {number | string | undefined}
   */
  export let maxWidth = undefined;

  /** Set to `true` to span the full width of the container */
  export let fullWidth = false;

  /**
   * Truncate text after this many lines. Values above `1` use multiline mode (end clamp only).
   * @type {number | undefined}
   */
  export let lines = undefined;

  /**
   * Specify `"end"` or `"front"`. `"front"` only works when `lines` is `1`.
   * @type {"end" | "front"}
   */
  export let clamp = "end";

  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "p";

  $: resolvedMaxWidth =
    maxWidth == null
      ? undefined
      : typeof maxWidth === "number"
        ? `${maxWidth}px`
        : maxWidth;

  $: textClass = [
    type && `bx--type-${type}`,
    color && `bx--type-text-${color}`,
    weight && `bx--type-${weight}`,
    italic && "bx--type-italic",
    family && `bx--type-${family}`,
    wrap === "break-word" && "bx--type-break-word",
    wrap === "nowrap" && "bx--type-nowrap",
    balance && "bx--type-balance",
    fullWidth && "bx--type-full-width",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

{#if lines !== undefined}
  <svelte:element
    this={tag}
    use:truncate={{ lines, clamp }}
    {...$$restProps}
    style:max-width={resolvedMaxWidth}
    class={textClass}
  >
    <slot />
  </svelte:element>
{:else}
  <svelte:element
    this={tag}
    {...$$restProps}
    style:max-width={resolvedMaxWidth}
    class={textClass}
  >
    <slot />
  </svelte:element>
{/if}
