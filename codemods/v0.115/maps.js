/**
 * Tables for the 0.115 upgrade. They follow docs/migrations/v0.115.x.md.
 */

/**
 * Theme `render` value to the component that replaces it, with the labels
 * a `toggle`, `select` or `dropdown` object left out got before (Toggle,
 * Select and Dropdown defaults) and get now.
 * @type {Record<string, { component: string; before: Record<string, string>; after: Record<string, string> }>}
 */
export const THEME_CONTROLS = {
  toggle: {
    component: "ThemeToggle",
    before: { labelText: "", labelA: "Off", labelB: "On" },
    after: { labelText: "Dark mode", labelA: "", labelB: "" },
  },
  select: {
    component: "ThemeSelect",
    before: { labelText: "" },
    after: { labelText: "Themes" },
  },
  dropdown: {
    component: "ThemeDropdown",
    before: { labelText: "" },
    after: { labelText: "Themes" },
  },
};

/**
 * Form fields whose `class` and `style` moved to the root (#5645), and the
 * selector that reaches the control they used to land on.
 * @type {Record<string, string>}
 */
export const FORM_FIELDS = {
  TextInput: "input",
  PasswordInput: "input",
  TextArea: "textarea",
  NumberInput: "input",
  Select: "select",
  ComboBox: "input",
  TimePicker: "input",
  Search: "input",
  TagInput: "input",
  CopyInput: "input",
  DatePickerInput: "input",
  MultiSelect: ".bx--list-box__field",
  SearchMenu: "input",
  FileUploaderButton: "",
};

/** Classes on a form field's control, which a consumer class used to join. */
export const CONTROL_CLASSES = [
  "bx--text-input",
  "bx--text-area",
  "bx--select-input",
  "bx--time-picker__input-field",
  "bx--search-input",
  "bx--date-picker__input",
  "bx--list-box__field",
  "bx--tag-input__input",
];

/**
 * Props the markup now says for itself (#5646, #5651). They are no-ops
 * where `:has()` reads the same thing, so the codemod drops them.
 * @type {Record<string, Record<string, string>>}
 */
export const DEPRECATED_PROPS = {
  CardFooter: { actionSet: "the footer finds its CardActions" },
  CardAction: {
    iconOnly: "the action finds an icon-only Button or OverflowMenu",
  },
  ListBoxMenuItem: { hasLeftIcon: "the option finds its left icon" },
  ContentSwitcher: {
    iconOnly: "the switcher fits switches that all set `icon`",
  },
};

/**
 * Classes no longer rendered (#5646, #5650, #5651, #5652), and what to
 * select instead.
 * @type {Record<string, string>}
 */
export const REMOVED_CLASSES = {
  "bx--card__header--actions": ".bx--card__header:has(> .bx--card__actions)",
  "bx--list-box__menu-item__option--icon-left":
    ".bx--list-box__menu-item__option:has(> .bx--list-box__menu-item__icon--left)",
  "bx--tabs--tall": ".bx--tabs:has(.bx--tabs__nav-item-secondary-label)",
  "bx--tabs__nav-item--secondary-label":
    ".bx--tabs__nav-item:has(.bx--tabs__nav-item-secondary-label)",
  "bx--tabs__nav-link--single-line":
    ".bx--tabs__nav-link:not(:has(> .bx--tabs__nav-item-label-wrapper))",
  "bx--content-switcher--icon-only":
    ".bx--content-switcher:has(> .bx--content-switcher-btn--icon)",
  "bx--tile--decorator": ".bx--tile:has(> .bx--tile--inner-decorator)",
  "bx--card--decorator": ".bx--card:has(~ .bx--card__decorator)",
  "bx--modal--decorator": ".bx--modal:has(.bx--modal--inner__decorator)",
  "bx--side-panel--decorator":
    ".bx--side-panel:has(.bx--side-panel__decorator)",
  "bx--checkbox-wrapper--decorator":
    ".bx--checkbox-wrapper:has(> .bx--checkbox-wrapper-inner--decorator)",
  "bx--radio-button-wrapper--decorator":
    ".bx--radio-button-wrapper:has(> .bx--radio-button-wrapper-inner--decorator)",
  "bx--checkbox-group--decorator":
    ".bx--checkbox-group:has(> .bx--checkbox-group-inner--decorator)",
  "bx--radio-button-group--decorator":
    ".bx--radio-button-group:has(> .bx--radio-button-group-inner--decorator)",
  "bx--text-input__field-wrapper--decorator":
    ".bx--text-input__field-wrapper:has(> .bx--text-input__field-inner-wrapper--decorator)",
  "bx--text-area__wrapper--decorator":
    ".bx--text-area__wrapper:has(> .bx--text-area__inner-wrapper--decorator)",
  "bx--number__input-wrapper--decorator":
    ".bx--number__input-wrapper:has(> .bx--number__inner-wrapper--decorator)",
  "bx--select-input__wrapper--decorator":
    ".bx--select-input__wrapper:has(> .bx--select__inner-wrapper--decorator)",
  "bx--date-picker-input__wrapper--decorator":
    ".bx--date-picker-input__wrapper:has(> .bx--date-picker-input-inner-wrapper--decorator)",
  "bx--list-box--decorator":
    ".bx--list-box:has(> .bx--list-box__inner-wrapper--decorator)",
  "bx--data-table-header--decorator":
    ".bx--data-table-header:has(> .bx--data-table-header__decorator)",
  "bx--table-sort__header--decorator":
    ".bx--table-sort__header:has(.bx--table-sort__decorator-wrapper)",
  "bx--table-header-label--decorator":
    ".bx--table-header-label:has(> .bx--table-header-label--decorator-inner)",
};

/** InputGroup children that now split the row evenly (#4848). */
export const INPUT_GROUP_SPLIT = new Set([
  "Search",
  "SearchMenu",
  "DatePicker",
  "Dropdown",
  "ComboBox",
  "MultiSelect",
]);

/** InputGroup children that now take the group's size when unsized. */
export const INPUT_GROUP_SIZED = new Set([
  "ContentSwitcher",
  "ToggleButtonGroup",
  "OverflowMenu",
  "MenuButton",
  "ComboButton",
]);

/** Fields that show their own invalid state on a blocked submit. */
export const REQUIRED_FIELDS = new Set([
  "TextInput",
  "Select",
  "Checkbox",
  "CheckboxGroup",
  "RadioButtonGroup",
  "TileGroup",
  "DatePickerInput",
]);

/** Notifications that close on Escape (#5838). */
export const NOTIFICATIONS = new Set([
  "InlineNotification",
  "ToastNotification",
]);
