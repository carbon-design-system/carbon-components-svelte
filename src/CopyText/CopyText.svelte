<script>
  /**
   * @restProps {span}
   * @event {null} copy
   * @event {{ error: unknown }} copy:error
   * @slot {{}}
   */

  /**
   * Specify the text to copy.
   * Also rendered as the value when the default slot is empty.
   * When unset, the rendered value text is copied at click time.
   * @type {string | undefined}
   */
  export let text = undefined;

  /** Set the title and ARIA label for the copy button */
  export let iconDescription = "Copy to clipboard";

  /** Set the feedback text shown after clicking the button */
  export let feedback = "Copied!";

  /** Set the feedback text shown when copying fails */
  export let errorFeedback = "Failed to copy";

  /** Set the timeout duration (ms) to display feedback text */
  export let feedbackTimeout = COPY_FEEDBACK_TIMEOUT_MS;

  /**
   * Override the default copy behavior (`navigator.clipboard.writeText` with
   * a `document.execCommand("copy")` fallback).
   * @type {(text: string) => void | Promise<void>}
   */
  export let copy = copyText;

  /**
   * Set how the "Copied!" feedback tooltip is rendered.
   * See `CopyButton` for details.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  /**
   * Set the tooltip placement in floating-ui form: the side, then `start`
   * or `end` along it, as Popover's `align` takes. Above and below,
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * When set, takes precedence over `tooltipPosition` and `tooltipAlignment`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | undefined}
   */
  export let tooltipAlign = undefined;

  /**
   * Set the position of the tooltip relative to the button.
   * @deprecated use `tooltipAlign`
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Set the alignment of the tooltip relative to the button.
   * @deprecated use `tooltipAlign`
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Obtain a reference to the root element.
   * @type {null | HTMLSpanElement}
   * @bindable readonly
   */
  export let ref = null;

  import CopyButton from "../CopyButton/CopyButton.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { COPY_FEEDBACK_TIMEOUT_MS } from "../utils/copy-feedback.js";
  import { copyText } from "../utils/copy-text.js";
  import { tooltipPlacement } from "../utils/tooltip-align.js";

  /** @type {null | HTMLSpanElement} */
  let valueNode = null;

  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  $: ({
    position: effectiveTooltipPosition,
    alignment: effectiveTooltipAlignment,
  } = tooltipPlacement(tooltipAlign, tooltipPosition, tooltipAlignment));
</script>

<span bind:this={ref} class:bx--copy-text={true} {...wrapperProps}>
  <span bind:this={valueNode} class:bx--copy-text__value={true}
    ><slot>{text ?? ""}</slot></span
  ><CopyButton
    kind="ghost"
    size="sm"
    {iconDescription}
    {feedback}
    {errorFeedback}
    {feedbackTimeout}
    {portalTooltip}
    tooltipPosition={effectiveTooltipPosition}
    tooltipAlignment={effectiveTooltipAlignment}
    text=""
    copy={() => copy(text ?? valueNode?.textContent?.trim() ?? "")}
    aria-label={ariaLabel ?? iconDescription}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    on:copy
    on:copy:error
  />
</span>
