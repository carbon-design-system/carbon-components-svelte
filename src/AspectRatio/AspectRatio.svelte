<script>
  /**
   * Specify the aspect ratio. Accepts one of the named ratios, or any
   * positive `"WxH"` string (decimals allowed, e.g. `"21x9"` or `"2.35x1"`)
   * for a ratio outside that list. A string that is neither a named ratio
   * nor a valid positive `WxH` pair falls back to `"2x1"`.
   * @type {"2x1" | "2x3" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2" | `${number}x${number}`}
   */
  export let ratio = "2x1";

  /** Set to `true` to stretch the slotted content to fill the aspect box */
  export let fill = false;

  /**
   * Align the slotted content along the cross axis. Makes the aspect box a flex container.
   * @type {"start" | "center" | "end" | undefined}
   */
  export let align = undefined;

  /**
   * Justify the slotted content along the main axis. Makes the aspect box a flex container.
   * @type {"start" | "center" | "end" | "space-between" | "space-around" | "space-evenly" | undefined}
   */
  export let justify = undefined;

  /**
   * Specify the HTML tag to render for the outer element.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";

  const KNOWN_RATIOS = [
    "2x1",
    "2x3",
    "16x9",
    "4x3",
    "1x1",
    "3x4",
    "3x2",
    "9x16",
    "1x2",
  ];
  const CUSTOM_RATIO_PATTERN = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/;

  /**
   * Parse a "WxH" string into positive width/height numbers, or `null` if
   * it isn't one (not a string, wrong shape, or zero/negative on either side).
   * @param {unknown} value
   */
  function parseCustomRatio(value) {
    if (typeof value !== "string") return null;
    const match = CUSTOM_RATIO_PATTERN.exec(value);
    if (!match) return null;
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (!(width > 0) || !(height > 0)) return null;
    return { width, height };
  }

  $: customRatio = KNOWN_RATIOS.includes(ratio)
    ? null
    : parseCustomRatio(ratio);
  $: resolvedRatio = KNOWN_RATIOS.includes(ratio)
    ? ratio
    : customRatio
      ? undefined
      : "2x1";
  $: customRatioPercentage = customRatio
    ? `${((customRatio.height / customRatio.width) * 100).toFixed(3)}%`
    : undefined;
</script>

<svelte:element
  this={tag}
  class:bx--aspect-ratio={true}
  class:bx--aspect-ratio--2x1={resolvedRatio === "2x1"}
  class:bx--aspect-ratio--2x3={resolvedRatio === "2x3"}
  class:bx--aspect-ratio--16x9={resolvedRatio === "16x9"}
  class:bx--aspect-ratio--4x3={resolvedRatio === "4x3"}
  class:bx--aspect-ratio--1x1={resolvedRatio === "1x1"}
  class:bx--aspect-ratio--3x4={resolvedRatio === "3x4"}
  class:bx--aspect-ratio--3x2={resolvedRatio === "3x2"}
  class:bx--aspect-ratio--9x16={resolvedRatio === "9x16"}
  class:bx--aspect-ratio--1x2={resolvedRatio === "1x2"}
  class:bx--aspect-ratio--custom={customRatio !== null}
  style:--ccs-aspect-ratio={customRatioPercentage}
  {...$$restProps}
>
  <div
    class:bx--aspect-ratio--object={true}
    class:bx--aspect-ratio--fill={fill}
    class:bx--aspect-ratio--align-start={align === "start"}
    class:bx--aspect-ratio--align-center={align === "center"}
    class:bx--aspect-ratio--align-end={align === "end"}
    class:bx--aspect-ratio--justify-start={justify === "start"}
    class:bx--aspect-ratio--justify-center={justify === "center"}
    class:bx--aspect-ratio--justify-end={justify === "end"}
    class:bx--aspect-ratio--justify-space-between={justify === "space-between"}
    class:bx--aspect-ratio--justify-space-around={justify === "space-around"}
    class:bx--aspect-ratio--justify-space-evenly={justify === "space-evenly"}
  >
    <slot />
  </div>
</svelte:element>
