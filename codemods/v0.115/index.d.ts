export type NoteKind =
  | "theme"
  | "deprecated"
  | "form-field"
  | "combo-box"
  | "size"
  | "layout"
  | "classes"
  | "required"
  | "data-table"
  | "dialog"
  | "notification"
  | "parse";

export type Note = {
  line: number;
  column: number;
  kind: NoteKind;
  message: string;
};

export type Options = {
  /** Picks the file type by extension. */
  filename: string;
  /** `parse` from `svelte/compiler`. Without it, markup is not migrated. */
  parse?: (source: string) => unknown;
  /** Add `size="xl"` to a SearchMenu with no `size`, keeping 48px. */
  keepSizes?: boolean;
};

export function transform(
  source: string,
  options: Options,
): { code: string; notes: Note[] };

/** What the CLI calls each kind of note. */
export const NOTE_TITLES: Record<NoteKind, string>;

/** What the CLI says once per run, since no file shows it. */
export const SUMMARY: string[];
