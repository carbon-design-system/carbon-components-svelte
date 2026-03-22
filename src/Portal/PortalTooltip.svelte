<script>
  import FloatingPortal from "./FloatingPortal.svelte";

  /**
   * Element to position the tooltip next to.
   * @type {null | HTMLElement}
   */
  export let anchor = null;

  /**
   * Preferred edge of the anchor to place the tooltip.
   * The underlying `FloatingPortal` flips to the opposite side when there is not enough space.
   * @type {"bottom" | "top" | "left" | "right"}
   */
  export let direction = "top";

  /**
   * Set to `true` to show the tooltip in the portal.
   * @type {boolean}
   */
  export let open = false;

  /**
   * Text shown when the default slot is empty.
   * @type {string}
   */
  export let text = "";

  /**
   * When `"icon"` or `"definition"`, sets `data-tooltip-type` and applies Carbon
   * `tooltip--content` typography to the portalled body (via package CSS).
   * @type {"icon" | "definition" | undefined}
   */
  export let tooltipType = undefined;

  /**
   * Set on the portalled content when using a11y tooltips (`role="tooltip"`).
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Extra horizontal space (px) between anchor and tooltip when placed to the left of the anchor.
   * @type {number}
   */
  export let horizontalGapLeft = 0;

  /**
   * Extra horizontal space (px) between anchor and tooltip when placed to the right of the anchor.
   * @type {number}
   */
  export let horizontalGapRight = 0;

  /**
   * Extra vertical space (px) between anchor and tooltip when placed above the anchor.
   * @type {number}
   */
  export let gapTop = 0;

  /**
   * Extra vertical space (px) between anchor and tooltip when placed below the anchor.
   * @type {number}
   */
  export let gapBottom = 0;

  /**
   * Vertical nudge (px) when the tooltip is placed to the left of the anchor (`intrinsicAlign` along the vertical edge).
   * @type {number}
   */
  export let verticalAlignOffsetLeft = 0;

  /**
   * Vertical nudge (px) when the tooltip is placed to the right of the anchor (`intrinsicAlign` along the vertical edge).
   * @type {number}
   */
  export let verticalAlignOffsetRight = 0;

  /**
   * Align portalled tooltip to the anchor (see `FloatingPortal` `intrinsicAlign`).
   * @type {"start" | "center" | "end"}
   */
  export let intrinsicAlign = "center";
</script>

<FloatingPortal
  {anchor}
  {direction}
  {open}
  {horizontalGapLeft}
  {horizontalGapRight}
  {gapTop}
  {gapBottom}
  {verticalAlignOffsetLeft}
  {verticalAlignOffsetRight}
  {intrinsicAlign}
  intrinsicWidth={true}
  let:direction={actualDirection}
>
  <div
    class:bx--tooltip-portal={true}
    data-direction={actualDirection ?? direction}
    data-tooltip-type={tooltipType}
  >
    <span class:bx--tooltip-portal__caret={true}></span>
    <span
      class:bx--tooltip-portal__content={true}
      class:bx--assistive-text={Boolean(tooltipType)}
      role={id ? "tooltip" : undefined}
      {id}
    >
      <slot>{text}</slot>
    </span>
  </div>
</FloatingPortal>
