<script>
  /**
   * @template {keyof HTMLElementTagNameMap} [Tag="p"]
   * @slot {{}}
   */

  /**
   * Set the Carbon type style. Use `"inherit"` to apply no type style and
   * keep the parent's font size, weight, and line height, for example to
   * recolor text inside a component slot.
   * @type {"inherit" | "label-01" | "label-02" | "helper-text-01" | "helper-text-02" | "legal-01" | "legal-02" | "body-compact-01" | "body-compact-02" | "body-01" | "body-02" | "code-01" | "code-02" | "heading-compact-01" | "heading-compact-02" | "heading-01" | "heading-02" | "heading-03" | "heading-04" | "heading-05" | "heading-06" | "heading-07" | "fluid-heading-03" | "fluid-heading-04" | "fluid-heading-05" | "fluid-heading-06" | "fluid-paragraph-01" | "fluid-quotation-01" | "fluid-quotation-02" | "fluid-display-01" | "fluid-display-02" | "fluid-display-03" | "fluid-display-04"}
   */
  export let type = "body-01";

  /**
   * Set the text color using a Carbon text token.
   * @type {"primary" | "secondary" | "placeholder" | "helper" | "on-color" | "inverse" | "error" | "success" | "link" | "disabled"}
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

  /** Set to `true` to avoid orphaned words at the end of wrapped paragraphs */
  export let pretty = false;

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
   * @type {Tag}
   */
  export let tag = /** @type {Tag} */ ("p");

  $: resolvedMaxWidth =
    maxWidth == null
      ? undefined
      : typeof maxWidth === "number"
        ? `${maxWidth}px`
        : maxWidth;

  $: truncated = lines !== undefined;
  $: multiline = truncated && lines > 1;
  $: front = truncated && !multiline && clamp === "front";

  $: textClass = [
    type && type !== "inherit" && `bx--type-${type}`,
    color && `bx--type-text-${color}`,
    weight && `bx--type-${weight}`,
    italic && "bx--type-italic",
    family && `bx--type-${family}`,
    wrap === "break-word" && "bx--type-break-word",
    wrap === "nowrap" && "bx--type-nowrap",
    balance && "bx--type-balance",
    pretty && "bx--type-pretty",
    fullWidth && "bx--type-full-width",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<svelte:element
  this={tag}
  {...$$restProps}
  style:max-width={resolvedMaxWidth}
  style:--ccs-truncate-lines={multiline ? lines : undefined}
  class={textClass}
  class:bx--text-truncate--multiline={multiline}
  class:bx--text-truncate--front={front}
  class:bx--text-truncate--end={truncated && !multiline && clamp !== "front"}
>
  <!-- The front clamp sets `direction: rtl`, which would move a leading
    slash or a trailing period to the other end. -->
  {#if front}
    <bdi><slot /></bdi>
  {:else}
    <slot />
  {/if}
</svelte:element>
