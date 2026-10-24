/**
 * Find the control under a tooltip at a viewport point: the control the
 * pointer would reach there without the tooltip. The tooltip, its holders
 * and its trigger don't count.
 */
export function findCoveredControl(
  tooltip: Element,
  x: number,
  y: number,
  trigger?: Element | null,
): Element | null;

export type CloseOverControlsParams = {
  /** Close the tooltip at once. */
  onCover: () => void;
  /**
   * The element that shows the tooltip. Needed for a portalled tooltip; an
   * inline tooltip sits inside it.
   */
  trigger?: Element | null;
};

/**
 * Close a tooltip when the mouse moves onto a part of it that covers
 * another control, so the pointer and the next click reach that control.
 * Svelte action for a portalled tooltip, or for a trigger with its inline
 * tooltip inside.
 */
export function closeOverControls(
  node: HTMLElement,
  params: CloseOverControlsParams,
): {
  update: (params: CloseOverControlsParams) => void;
  destroy: () => void;
};
