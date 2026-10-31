export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * A line as the consumer supplies it. A string is parsed for a leading
 * timestamp and level; an object states them. A `level` is `"debug"`,
 * `"info"`, `"warn"` or `"error"`, or a name for one, such as `"warning"`,
 * `"fatal"` or `"trace"`, in any case.
 */
export type LogLine =
  string | { text: string; level?: string; time?: string | number | Date };

/** A line as the viewer holds it. */
export type LogRow = {
  /** Position in the stream. Ids only grow, and a line keeps its id when older lines are dropped. */
  id: number;
  /** The line as it arrived, for copying. */
  raw: string;
  /** What is drawn, with escape sequences. */
  text: string;
  /** `text` without escape sequences, which is what search reads. */
  plain: string;
  level: LogLevel | undefined;
  time: string | number | Date | undefined;
};

export type ParsedLogLine = {
  text: string;
  level?: LogLevel;
  time?: string | number | Date;
};

/** The levels, least to most severe. */
export const LOG_LEVELS: readonly ["debug", "info", "warn", "error"];

/** The level a name stands for, or `undefined` for a name that is none. */
export function normalizeLevel(name: unknown): LogLevel | undefined;

/**
 * Read a leading ISO-8601 timestamp and level from a line, or `level=...`
 * anywhere in its first 256 characters.
 */
export function parseLogLine(line: string): {
  text: string;
  level?: LogLevel;
  time?: string;
};

/** A timestamp as it is drawn: the time of day, with milliseconds when there are any. */
export function formatLogTime(time: string | number | Date | undefined): string;

/** The text of a line for copying, without escape sequences. */
export function logRowText(row: LogRow): string;

/** A bounded list of log lines, with the level filter applied as lines arrive. */
export function createLogBuffer(options?: {
  maxLines?: number;
  parse?: ((line: string) => ParsedLogLine) | null;
}): {
  readonly rows: LogRow[];
  readonly view: LogRow[];
  readonly counts: Record<LogLevel, number>;
  readonly nextId: number;
  /** Whether any line has had a level. */
  readonly leveled: boolean;
  append(lines: LogLine | ReadonlyArray<LogLine>): {
    added: number;
    dropped: number;
  };
  clear(): void;
  setMaxLines(maxLines: number): number;
  setLevels(levels: ReadonlySet<LogLevel> | null): void;
};
