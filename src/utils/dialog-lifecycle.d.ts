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
  preventCloseOnClickOutside: () => boolean;
  saveFocusReturn: () => void;
  focus: () => void;
  getOpen: () => boolean;
}

/** Shared open/close lifecycle for `Modal` and `ComposedModal`. */
export function createDialogLifecycle(
  options: DialogLifecycleOptions,
): DialogLifecycle;
