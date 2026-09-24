/**
 * Build an `announceStatus(text)` function for a visually-hidden live
 * region. The text is reset first so announcing the same message
 * twice still mutates the DOM — live regions only fire on an actual
 * text change.
 */
export declare function createStatusAnnouncer(
  setStatusText: (text: string) => void,
): (text: string) => Promise<void>;

export type CreateMenuCloseHandlerOptions = {
  getOpen: () => boolean;
  setOpen: (open: boolean) => void;
  dispatch: (event: "close", detail: { trigger: string }) => void;
};

/**
 * Build a `close(trigger)` function that dismisses a menu and
 * notifies consumers of the cause. Guarded so a dismissal gesture
 * fired while already closed does not emit a phantom event.
 */
export declare function createMenuCloseHandler(
  options: CreateMenuCloseHandlerOptions,
): (trigger: string) => void;

/**
 * The tail shared by `clear()` implementations: wait for bindings to
 * settle, then optionally reopen and/or focus.
 */
export declare function applyPostClearOptions(
  options: { open?: boolean; focus?: boolean } | undefined,
  setOpen: (open: boolean) => void,
  getFocusTarget: () => HTMLElement | null | undefined,
): Promise<void>;
