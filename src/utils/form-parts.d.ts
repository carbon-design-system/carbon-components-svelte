import type { Writable } from "svelte/store";

export type FormPartKind = "label" | "helper" | "invalid" | "warn";

export type FormParts = Record<FormPartKind, string[]>;

export type FormPart = {
  (id: string | undefined): void;
  /** Suffix a default id with the part's ordinal among parts of its kind. */
  numbered: (id: string | undefined) => string | undefined;
};

/**
 * Registry of the form parts (`FormLabel`, `FormHelperText`,
 * `FormRequirement`) mounted inside a `FormItem` or `FormGroup`.
 */
export function createFormParts(): {
  parts: Writable<FormParts>;
  part: (kind: FormPartKind) => FormPart;
};

/**
 * The `aria-describedby` value for the mounted parts: invalid messages,
 * then warnings, then helper text.
 */
export function partsDescribedBy(parts: FormParts): string | undefined;
