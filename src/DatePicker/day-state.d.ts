export interface DayStateContext {
  /** Picked dates; a range is `[start, end?]`. */
  selected: ReadonlyArray<Date>;
  range?: boolean;
  today: Date;
  isEnabled: (date: Date) => boolean;
  /** A day that can't be picked now, such as outside a range's length limits. */
  isBlocked?: (date: Date) => boolean;
}

export interface DayState {
  selected: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  inRange: boolean;
  disabled: boolean;
  /** Can't be picked now, but still takes focus, as at a range's limit. */
  blocked: boolean;
  today: boolean;
}

/** The class each state adds to a day cell. */
export const DAY_STATE_CLASSES: Readonly<
  Record<Exclude<keyof DayState, "blocked">, string>
>;

/** The state of one day cell, shared by the calendar engine and DateCalendar. */
export function dayState(
  date: Date,
  context: DayStateContext,
  outside?: "previous" | "next",
): DayState;

/** A day cell's full class list. */
export function dayClassName(state: DayState, outside: boolean): string;
