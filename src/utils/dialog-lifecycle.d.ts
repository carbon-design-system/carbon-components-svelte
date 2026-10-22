import type { OutsideDismiss } from "./outside-dismiss.js";

export interface DialogLifecycle {
  close: (trigger: string) => void;
  outsideDismiss: OutsideDismiss;
  setMounted: () => void;
  syncOpen: (open: boolean) => void;
}

export interface DialogLifecycleOptions {
  dispatch: (name: string, detail?: object, opts?: object) => boolean;
  setOpen: (open: boolean) => void;
  preventCloseOnClickOutside: () => boolean | undefined;
  passive: () => boolean;
  saveFocusReturn: () => void;
  restoreFocusReturn: () => void;
  getContainer: () => Element | null;
  focus: () => void;
  getOpen: () => boolean;
}

/** Shared open/close lifecycle for `Modal` and `ComposedModal`. */
export function createDialogLifecycle(
  options: DialogLifecycleOptions,
): DialogLifecycle;

/**
 * Carbon v11's outside-click rule: a passive dialog closes unless
 * `preventCloseOnClickOutside` is `true`; a transactional one stays open
 * unless it is explicitly `false`.
 */
export function closesOnOutsideClick(
  preventCloseOnClickOutside: boolean | undefined,
  passive: boolean,
): boolean;
