/** Prop combinations that have no effect, so they don't fail silently. */
export function getPropWarnings(props: {
  datePickerType?: string;
  months: number;
  anchor: HTMLElement | undefined;
  portalled: boolean;
}): string[];

/** Presets pick one date or one range. */
export function getPresetsWarning(
  datePickerType: string | undefined,
): string | undefined;

/** `short` only narrows the field of a `"simple"` picker. */
export function getShortWarning(
  datePickerType: string | undefined,
): string | undefined;
