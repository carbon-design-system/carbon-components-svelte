import type { IconComponent } from "./icon-component.js";

/**
 * The icons components draw themselves, named as in `carbon-icons-svelte`.
 * `tests/utils/icon-context.coverage.test.ts` keeps this list in step with
 * the icons `src/` imports.
 */
export type IconName =
  | "Add"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowsVertical"
  | "Attachment"
  | "Calendar"
  | "CaretDown"
  | "CaretLeft"
  | "CaretRight"
  | "Caution"
  | "Checkbox"
  | "CheckboxCheckedFilled"
  | "Checkmark"
  | "CheckmarkFilled"
  | "CheckmarkOutline"
  | "ChevronDown"
  | "ChevronLeft"
  | "ChevronRight"
  | "CircleDash"
  | "CircleFill"
  | "CircleStroke"
  | "Close"
  | "Column"
  | "Copy"
  | "Critical"
  | "CriticalSeverity"
  | "DiamondFill"
  | "Document"
  | "Download"
  | "Edit"
  | "EditOff"
  | "ErrorFilled"
  | "InProgress"
  | "Incomplete"
  | "Information"
  | "InformationFilled"
  | "InformationSquareFilled"
  | "Launch"
  | "LowSeverity"
  | "Menu"
  | "OverflowMenuHorizontal"
  | "OverflowMenuVertical"
  | "PendingFilled"
  | "RowExpand"
  | "Search"
  | "Settings"
  | "Star"
  | "StarFilled"
  | "StopFilledAlt"
  | "Subtract"
  | "Switcher"
  | "UndefinedFilled"
  | "Undo"
  | "UnknownFilled"
  | "User"
  | "View"
  | "ViewOff"
  | "Warning"
  | "WarningAltFilled"
  | "WarningAltInvertedFilled"
  | "WarningFilled"
  | "WarningSquareFilled";

/** Icons to draw in place of the built-in ones, by name. */
export type IconContext = Partial<
  Record<IconName, Exclude<IconComponent, null>>
>;

/**
 * Swap the icons that components draw themselves, such as a dropdown's
 * `ChevronDown` or a field's `WarningFilled`, for every component in this
 * component and below it. Keys are icon names as in `carbon-icons-svelte`;
 * a name that isn't set keeps the built-in icon. A swapped icon gets the
 * props and classes the built-in one gets, everywhere the library draws
 * it. A nested call adds to the icons set above it. Call during component
 * initialization, such as in the app's root layout.
 */
export function setIconContext(icons: IconContext): void;

/**
 * The icons set by the nearest `setIconContext`, or none. Call during
 * component initialization.
 */
export function getIconContext(): IconContext;
