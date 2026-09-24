const PREFIX = "[carbon-components-svelte] DatePicker: ";

/**
 * @typedef {{
 *   datePickerType?: string;
 *   portalled: boolean;
 *   displayFormat: string | undefined;
 *   disabledDates: ReadonlyArray<unknown>;
 *   enabledDates: ReadonlyArray<unknown>;
 * }} UnsupportedOptionContext
 */

/**
 * `flatpickrProps` is typed as flatpickr's options, but Carbon overrides or
 * ignores some of them. Without a message those fail silently.
 *
 * @param {Record<string, unknown> | undefined} flatpickrProps
 * @param {UnsupportedOptionContext} context
 * @returns {string[]}
 */
export function getUnsupportedOptionWarnings(flatpickrProps, context) {
  if (!flatpickrProps) return [];

  /** @type {Array<[option: string, applies: boolean, message: string]>} */
  const rules = [
    [
      "wrap",
      !!flatpickrProps.wrap,
      "is not supported. Flatpickr is given the input element itself.",
    ],
    ["mode", true, "is ignored. Use datePickerType instead."],
    [
      "showMonths",
      context.datePickerType === "week" &&
        Number(flatpickrProps.showMonths) > 1,
      'is not supported with datePickerType="week".',
    ],
    [
      "positionElement",
      !context.portalled,
      "has no effect unless portalMenu is set.",
    ],
    ["appendTo", !context.portalled, "is overridden unless portalMenu is set."],
    ["altInput", !!context.displayFormat, "is ignored. displayFormat is set."],
    ["altFormat", !!context.displayFormat, "is ignored. displayFormat is set."],
    [
      "disable",
      context.disabledDates.length > 0,
      "is ignored. disabledDates is set.",
    ],
    [
      "enable",
      context.enabledDates.length > 0,
      "is ignored. enabledDates is set.",
    ],
  ];

  return rules
    .filter(
      ([option, applies]) => applies && flatpickrProps[option] !== undefined,
    )
    .map(
      ([option, , message]) => `${PREFIX}flatpickrProps.${option} ${message}`,
    );
}
