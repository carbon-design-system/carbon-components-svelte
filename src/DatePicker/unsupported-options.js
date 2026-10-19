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
 * }} props
 * @returns {string[]}
 */
export function getPropWarnings({ datePickerType, months, anchor, portalled }) {
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
