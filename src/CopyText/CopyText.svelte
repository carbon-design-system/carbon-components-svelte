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
   * Set the position of the tooltip relative to the button.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Set the alignment of the tooltip relative to the button.
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
  import { COPY_FEEDBACK_TIMEOUT_MS } from "../utils/copy-feedback.js";
  import { copyText } from "../utils/copy-text.js";

  /** @type {null | HTMLSpanElement} */
  let valueNode = null;
</script>

<span bind:this={ref} class:bx--copy-text={true} {...$$restProps}>
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
    {tooltipPosition}
    {tooltipAlignment}
    text=""
    copy={() => copy(text ?? valueNode?.textContent?.trim() ?? "")}
    on:copy
    on:copy:error
  />
</span>
