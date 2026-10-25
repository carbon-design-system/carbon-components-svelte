export type CopyActionState = "idle" | "pending" | "copied" | "error";

export interface CopyActionParams {
  /** Text to copy. Ignored when `getText` is set. */
  text?: string;
  /**
   * Resolve the text on click, for example a token fetched from an API.
   * While it is pending the node gets `aria-busy="true"` and further clicks
   * are ignored.
   */
  getText?: () => string | Promise<string>;
  /** Override the clipboard write. Defaults to `copyText`. */
  copy?: (text: string) => void | Promise<void>;
  /** Called after a successful copy with the text that was written. */
  onCopy?: (text: string) => void;
  /** Called when `getText` or the write rejects. */
  onError?: (error: unknown) => void;
  /** Called on every transition, including back to `"idle"` after `feedbackTimeout`. */
  onStateChange?: (state: CopyActionState) => void;
  /** Milliseconds the node stays in the `"copied"` or `"error"` state. */
  feedbackTimeout?: number;
  /** Ignore clicks while `false`. */
  enabled?: boolean;
}

/**
 * Svelte action: copies `text` (or the result of `getText`) to the
 * clipboard when the node is clicked and reflects the state on the node.
 * @param node - The element to copy from
 * @param params - Copy behavior and callbacks
 * @returns Object with update and destroy methods
 */
export function copy(
  node: HTMLElement,
  params?: CopyActionParams,
): {
  update: (params?: CopyActionParams) => void;
  destroy: () => void;
};
