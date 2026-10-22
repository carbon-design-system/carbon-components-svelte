export type NoteKind =
  "token" | "light" | "flatpickr" | "layer-03" | "theme" | "parse";

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
  /** Rewrite Box and ScrollGradient `"layer-03"` to `"layer-accent"`. */
  keepLayer03Color?: boolean;
};

export function transform(
  source: string,
  options: Options,
): { code: string; notes: Note[] };

/** What the CLI calls each kind of note. */
export const NOTE_TITLES: Record<NoteKind, string>;

/** What the CLI says once per run, since no file shows it. */
export const SUMMARY: string[];
