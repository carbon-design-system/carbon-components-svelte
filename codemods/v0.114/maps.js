/**
 * Name maps for the 0.114 upgrade (Carbon v10 to v11). They follow the
 * tables in docs/migrations/v0.114.x.md.
 */

/**
 * v10 color token to v11, by what the color paints. `*` is the default.
 * Other keys are property classes (see `propertyClass`): `border`, `bg`
 * (background fills), `color` (text) and `icon` (SVG fill and stroke).
 * @type {Record<string, Record<string, string>>}
 */
export const COLOR_TOKENS = {
  "ui-background": { "*": "background" },
  "ui-01": { "*": "layer-01" },
  "ui-02": { "*": "layer-02" },
  "ui-03": { bg: "layer-accent-01", "*": "border-subtle-01" },
  "ui-04": { "*": "border-strong-01" },
  "ui-05": {
    bg: "layer-selected-inverse",
    icon: "layer-selected-inverse",
    "*": "border-inverse",
  },
  "text-01": { "*": "text-primary" },
  "text-02": { "*": "text-secondary" },
  "text-03": { "*": "text-placeholder" },
  "text-04": { "*": "text-on-color" },
  "text-05": { "*": "text-helper" },
  "icon-01": { "*": "icon-primary" },
  "icon-02": { "*": "icon-secondary" },
  "icon-03": { "*": "icon-on-color" },
  "link-01": { "*": "link-primary" },
  "link-02": { "*": "link-secondary" },
  "visited-link": { "*": "link-visited" },
  "inverse-01": {
    border: "focus-inset",
    icon: "icon-inverse",
    "*": "text-inverse",
  },
  "inverse-02": { "*": "background-inverse" },
  "inverse-link": { "*": "link-inverse" },
  "inverse-focus-ui": { "*": "focus-inverse" },
  "inverse-hover-ui": { "*": "background-inverse-hover" },
  "inverse-support-01": { "*": "support-error-inverse" },
  "inverse-support-02": { "*": "support-success-inverse" },
  "inverse-support-03": { "*": "support-warning-inverse" },
  "inverse-support-04": { "*": "support-info-inverse" },
  "support-01": { "*": "support-error" },
  "support-02": { "*": "support-success" },
  "support-03": { "*": "support-warning" },
  "support-04": { "*": "support-info" },
  "interactive-01": { "*": "background-brand" },
  "interactive-02": { "*": "button-secondary" },
  "interactive-03": { "*": "button-tertiary" },
  "interactive-04": { border: "border-interactive", "*": "interactive" },
  "brand-01": { "*": "background-brand" },
  "brand-02": { "*": "button-secondary" },
  "brand-03": { "*": "button-tertiary" },
  danger: { "*": "button-danger-primary" },
  "danger-01": { "*": "button-danger-primary" },
  "danger-02": { "*": "button-danger-secondary" },
  "disabled-01": { "*": "field-01" },
  "disabled-02": {
    border: "border-disabled",
    bg: "button-disabled",
    icon: "icon-disabled",
    "*": "text-disabled",
  },
  "disabled-03": {
    bg: "layer-selected-disabled",
    icon: "icon-on-color-disabled",
    "*": "text-on-color-disabled",
  },
  "hover-ui": { "*": "layer-hover-01" },
  "hover-row": { "*": "layer-hover-01" },
  "hover-light-ui": { "*": "layer-hover-02" },
  "hover-field": { "*": "field-hover-01" },
  "hover-selected-ui": { "*": "layer-selected-hover-01" },
  "hover-primary": { "*": "button-primary-hover" },
  "hover-secondary": { "*": "button-secondary-hover" },
  "hover-tertiary": { "*": "button-tertiary-hover" },
  "hover-danger": { "*": "button-danger-hover" },
  "hover-primary-text": { "*": "link-primary-hover" },
  "active-ui": { border: "border-subtle-selected-01", "*": "layer-active-01" },
  "active-01": { border: "border-subtle-selected-01", "*": "layer-active-01" },
  "active-light-ui": { "*": "layer-active-02" },
  "active-primary": { "*": "button-primary-active" },
  "active-secondary": { "*": "button-secondary-active" },
  "active-tertiary": { "*": "button-tertiary-active" },
  "active-danger": { "*": "button-danger-active" },
  "selected-ui": { "*": "layer-selected-01" },
  "selected-light-ui": { "*": "layer-selected-02" },
  "decorative-01": { "*": "border-subtle-02" },
  "skeleton-01": { "*": "skeleton-background" },
  "skeleton-02": { "*": "skeleton-element" },
  "overlay-01": { "*": "overlay" },
};

/**
 * v10 tokens Carbon split into several v11 tokens. Setting one (a CSS
 * declaration or a Theme `tokens` key) has no single v11 equivalent, so the
 * codemod reports it. The lists match the guide's table.
 * @type {Record<string, string[]>}
 */
export const SPLIT_TOKENS = {
  "ui-03": ["border-subtle-01 (borders)", "layer-accent-01 (fills)"],
  "ui-04": ["border-strong-01", "toggle-off"],
  "ui-05": ["border-inverse", "layer-selected-inverse"],
  "inverse-01": ["text-inverse", "icon-inverse", "focus-inset"],
  "interactive-01": ["button-primary (buttons)", "background-brand"],
  "interactive-04": ["interactive", "border-interactive"],
  "disabled-01": ["field-01", "layer-01"],
  "disabled-02": [
    "text-disabled",
    "icon-disabled",
    "button-disabled",
    "border-disabled",
  ],
  "disabled-03": [
    "text-on-color-disabled",
    "icon-on-color-disabled",
    "layer-selected-disabled",
  ],
  "hover-ui": ["layer-hover-01", "background-hover", "field-hover-01"],
  "hover-row": ["layer-hover-01", "background-hover", "field-hover-01"],
  "hover-selected-ui": ["layer-selected-hover-01", "background-selected-hover"],
  "active-ui": [
    "layer-active-01",
    "background-active",
    "border-subtle-selected-01",
  ],
  "active-01": [
    "layer-active-01",
    "background-active",
    "border-subtle-selected-01",
  ],
  "selected-ui": ["layer-selected-01", "background-selected"],
};

/** v10 type style name to v11. */
export const TYPE_STYLES = {
  "caption-01": "label-01",
  "caption-02": "label-02",
  "body-short-01": "body-compact-01",
  "body-short-02": "body-compact-02",
  "body-long-01": "body-01",
  "body-long-02": "body-02",
  "productive-heading-01": "heading-compact-01",
  "productive-heading-02": "heading-compact-02",
  "productive-heading-03": "heading-03",
  "productive-heading-04": "heading-04",
  "productive-heading-05": "heading-05",
  "productive-heading-06": "heading-06",
  "productive-heading-07": "heading-07",
  "expressive-heading-01": "heading-01",
  "expressive-heading-02": "heading-02",
  "expressive-heading-03": "fluid-heading-03",
  "expressive-heading-04": "fluid-heading-04",
  "expressive-heading-05": "fluid-heading-05",
  "expressive-heading-06": "fluid-heading-06",
  "expressive-paragraph-01": "fluid-paragraph-01",
  "quotation-01": "fluid-quotation-01",
  "quotation-02": "fluid-quotation-02",
  "display-01": "fluid-display-01",
  "display-02": "fluid-display-02",
  "display-03": "fluid-display-03",
  "display-04": "fluid-display-04",
};

/** Components that dropped `light` in favor of `Layer`. */
export const LIGHT_COMPONENTS = new Set([
  "TextInput",
  "PasswordInput",
  "TextArea",
  "NumberInput",
  "Select",
  "Search",
  "SearchMenu",
  "ComboBox",
  "Dropdown",
  "MultiSelect",
  "ListBox",
  "DatePicker",
  "TimePicker",
  "Slider",
  "RangeSlider",
  "CopyInput",
  "PinCodeInput",
  "CodeSnippet",
  "OverflowMenu",
  "Popover",
  "Tile",
  "ClickableTile",
  "ExpandableTile",
  "RadioTile",
  "SelectableTile",
]);

/** Fields inside these already sit on the next layer. */
export const MODAL_COMPONENTS = new Set([
  "Modal",
  "ComposedModal",
  "ModalBody",
  "ConfirmModal",
]);

/** Props that take a fill token name, where `layer-03` changed color. */
export const LAYER_03_PROPS = {
  Box: ["fill"],
  ScrollGradient: ["color", "background"],
};

/** `flatpickrProps` keys that move to a DatePicker prop of another name. */
export const FLATPICKR_RENAMES = {
  minDate: "minDate",
  maxDate: "maxDate",
  allowInput: "allowInput",
  closeOnSelect: "closeOnSelect",
  conjunction: "conjunction",
  inline: "inline",
  showMonths: "months",
  positionElement: "anchor",
  allowInvalidPreload: "keepOutOfRangeValue",
  ignoredFocusElements: "keepOpenFor",
  disable: "disabledDates",
  enable: "enabledDates",
  altFormat: "displayFormat",
};

const TIME_OPTIONS = [
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
];

/**
 * Advice for a `flatpickrProps` key the codemod leaves in place.
 * @param {string} key
 */
export function flatpickrAdvice(key) {
  if (key === "position") {
    return "use `align` and `direction` with `portalMenu`";
  }
  if (key === "defaultDate") return "use `value` or `selectedDates`";
  if (key === "altInput") return "set `displayFormat` instead";
  if (key === "shorthandCurrentMonth") return 'use `monthLabel="short"`';
  if (key === "onDayCreate") return "use `dayClass` or `dayDescription`";
  if (key.startsWith("on")) {
    return "use an event: `on:change`, `on:open`, `on:close`, `on:view` or `on:error`";
  }
  if (key === "plugins") {
    return 'use `datePickerType="range"`, `"month"` or `"week"`; other plugins are not supported';
  }
  if (TIME_OPTIONS.includes(key)) {
    return "the calendar has no time picker; pair it with `TimePicker`";
  }
  return "it has no DatePicker prop";
}

const BORDER_PROPERTY = /^(?:border|outline|box-shadow|column-rule)/;

/**
 * Sorts a CSS property into the class `COLOR_TOKENS` picks by.
 * @param {string | undefined} property
 * @returns {"border" | "bg" | "color" | "icon" | "*" | undefined}
 *   `undefined` when the property is unknown or is itself a variable.
 */
export function propertyClass(property) {
  if (!property || property.startsWith("--") || property.startsWith("$")) {
    return undefined;
  }
  const name = property.toLowerCase();
  if (BORDER_PROPERTY.test(name)) return "border";
  if (name === "fill" || name === "stroke") return "icon";
  if (name.startsWith("background")) return "bg";
  if (
    name === "color" ||
    name === "caret-color" ||
    name === "text-decoration-color"
  ) {
    return "color";
  }
  return "*";
}
