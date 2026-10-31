export type Control =
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Whether `node` is a form control that carries a user value. */
export function isControl(node: unknown): node is Control;

/** The comparable value of one control. */
export function controlValue(control: Control): string;

export interface FormSnapshot {
  /** Retake every baseline; the form reads clean. */
  capture: () => void;
  /** Re-compare one control to its baseline. */
  check: (control: Control) => void;
  /** Re-read every control, including ones added since the last read. */
  checkAll: () => void;
  /** Re-compare every radio, since unchecking fires no event. */
  checkRadios: () => void;
  isDirty: () => boolean;
}

/** Per-element dirty bookkeeping for a form or any container. */
export function createFormSnapshot(root: HTMLElement): FormSnapshot;
