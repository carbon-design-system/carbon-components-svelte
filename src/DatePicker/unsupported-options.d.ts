export interface UnsupportedOptionContext {
  datePickerType?: string;
  portalled: boolean;
  displayFormat: string | undefined;
  disabledDates: ReadonlyArray<unknown>;
  enabledDates: ReadonlyArray<unknown>;
}

/**
 * Messages for `flatpickrProps` options that Carbon overrides or ignores.
 */
export function getUnsupportedOptionWarnings(
  flatpickrProps: Record<string, unknown> | undefined,
  context: UnsupportedOptionContext,
): string[];

/**
 * The message for `short` on a type it has no effect on, or `undefined`
 * for a `"simple"` picker.
 */
export function getShortWarning(
  datePickerType: string | undefined,
): string | undefined;
