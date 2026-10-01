// @ts-check
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
 * Options of flatpickr that the calendar does not implement: the time
 * picker, the native mobile picker, and the month dropdown.
 */
const NOT_IMPLEMENTED = [
  "enableTime",
  "enableSeconds",
  "noCalendar",
  "time_24hr",
  "hourIncrement",
  "minuteIncrement",
  "defaultHour",
  "defaultMinute",
  "defaultSeconds",
  "minTime",
  "maxTime",
  "disableMobile",
  "monthSelectorType",
];

/**
 * `flatpickrProps` follows flatpickr's option names, but Carbon overrides,
 * ignores, or does not implement some of them. Without a message those fail silently.
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
      "is not supported. The calendar is given the input element itself.",
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

  for (const option of NOT_IMPLEMENTED) {
    rules.push([option, true, "is not supported."]);
  }

  return rules
    .filter(
      ([option, applies]) => applies && flatpickrProps[option] !== undefined,
    )
    .map(
      ([option, , message]) => `${PREFIX}flatpickrProps.${option} ${message}`,
    );
}
