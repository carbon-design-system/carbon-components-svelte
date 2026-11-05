// @ts-check
const PREFIX = "[carbon-components-svelte] DatePicker: ";

/**
 * Prop combinations that have no effect, so they don't fail silently.
 *
 * @param {{
 *   datePickerType?: string;
 *   months: number;
 *   anchor: HTMLElement | undefined;
 *   portalled: boolean;
 *   timeGranularity?: string;
 *   minuteStep?: number;
 * }} props
 * @returns {string[]}
 */
export function getPropWarnings({
  datePickerType,
  months,
  anchor,
  portalled,
  timeGranularity,
  minuteStep = 1,
}) {
  /** @type {string[]} */
  const messages = [];
  if (months > 1 && datePickerType === "week") {
    messages.push(
      `${PREFIX}months is not supported with datePickerType="week".`,
    );
  }
  if (anchor && !portalled) {
    messages.push(`${PREFIX}anchor has no effect unless portalMenu is set.`);
  }
  if (
    timeGranularity &&
    datePickerType !== "single" &&
    datePickerType !== "range"
  ) {
    messages.push(
      `${PREFIX}timeGranularity is only supported with datePickerType="single" or "range".`,
    );
  }
  if (
    timeGranularity &&
    !(Number.isInteger(minuteStep) && minuteStep > 0 && 60 % minuteStep === 0)
  ) {
    messages.push(
      `${PREFIX}minuteStep must divide 60; ${minuteStep} falls back to 1.`,
    );
  }
  return messages;
}

/**
 * `short` only narrows the field of a `"simple"` picker.
 *
 * @param {string | undefined} datePickerType
 * @returns {string | undefined}
 */
export function getShortWarning(datePickerType) {
  if (datePickerType === "simple") return undefined;
  return `${PREFIX}short only applies to datePickerType="simple"; it has no effect on "${datePickerType}".`;
}
