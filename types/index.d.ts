// Type definitions for carbon-components-svelte 0.8
// https://github.com/IBM/carbon-components-svelte

// Carbon Icon type from carbon-icons-svelte 10.14
// https://github.com/IBM/carbon-icons-svelte
declare class CarbonIcon {
  $$prop_def: {
    id?: string;
    class?: string;
    tabindex?: string;
    focusable?: boolean;
    title?: string;
    style?: string;
    fill?: string;
    stroke?: string;
    width?: string;
    height?: string;
  };
  $$slot_def: {
    default?: {};
  };
}

export class AccordionSkeleton {
  $$prop_def: {
    count?: number; // default: 4
    open?: boolean; // default: true
  };
}

export class Accordion {
  $$prop_def: {
    align?: "start" | "end"; // default: "end"
    skeleton?: boolean; // default: false
  };
}

export class AccordionItem {
  $$prop_def: {
    title?: string; // default: "title"
    open?: boolean; // default: false
    iconDescription?: string; // default: "Expand/Collapse"
  };
}

export class BreadcrumbSkeleton {
  $$prop_def: {
    noTrailingSlash?: boolean; // default: false
    count?: number; // default: 3
  };
}

export class Breadcrumb {
  $$prop_def: {
    noTrailingSlash?: boolean; // default: false
    skeleton?: boolean; // default: false
  };
}

export class BreadcrumbItem {
  $$prop_def: {
    href?: string;
    isCurrentPage?: boolean; // default: false
  };
}

export class ButtonSkeleton {
  $$prop_def: {
    href?: string;
    small?: boolean; // default: false
  };
}

export class Button {
  $$prop_def: {
    kind?: "primary" | "secondary" | "tertiary" | "ghost" | "danger"; // default: "primary"
    size?: "default" | "field" | "small"; // default: "default"
    hasIconOnly?: boolean; // default: false
    icon?: CarbonIcon;
    iconDescription?: string;
    tooltipAlignment?: "start" | "center" | "end";
    tooltipPosition?: "top" | "right" | "bottom" | "left";
    as?: boolean; // default: false
    skeleton?: boolean; // default: false
    disabled?: boolean; // default: false
    href?: string;
    tabindex?: string; // default: "0"
    type?: string; // default: "button"
    ref?: null | HTMLAnchorElement | HTMLButtonElement; // default: null
  };
}

export class CheckboxSkeleton {
  $$prop_def: {};
}

export class Checkbox {
  $$prop_def: {
    checked?: boolean; // default: false
    indeterminate?: boolean; // default: false
    skeleton?: boolean; // default: false
    readonly?: boolean; // default: false
    disabled?: boolean; // default: false
    labelText?: string; // default: ""
    hideLabel?: boolean; // default: false
    name?: string; // default: ""
    title?: string;
    id?: string;
    ref?: null | HTMLInputElement; // default: null
  };
}

export class CodeSnippetSkeleton {
  $$prop_def: {
    type?: "single" | "inline" | "multi"; // default: "single"
  };
}

export class CodeSnippet {
  $$prop_def: {
    type?: "single" | "inline" | "multi"; // default: "single"
    code?: string;
    expanded?: boolean; // default: false
    light?: boolean; // default: false
    skeleton?: boolean; // default: false
    copyButtonDescription?: string;
    copyLabel?: string;
    feedback?: string; // default: "Copied!"
    feedbackTimeout?: number; // default: 2000
    showLessText?: string; // default: "Show more"
    showMoreLess?: boolean; // default: false
    id?: string;
    ref?: null | HTMLPreElement; // default: null
  };
}

interface ComboBoxItem {
  id: string;
  text: string;
}

export class ComboBox {
  $$prop_def: {
    items?: ComboBoxItem[]; // default: []
    itemToString?: (item: ComboBoxItem) => string; // default: (item: ComboBoxItem) => string
    selectedIndex?: number; // default: -1
    value?: string; // default: ""
    size?: "sm" | "xl";
    disabled?: boolean; // default: false
    titleText?: string; // default: ""
    placeholder?: string; // default: ""
    helperText?: string; // default: ""
    invalidText?: string; // default: ""
    invalid?: boolean; // default: false
    light?: boolean; // default: false
    open?: boolean; // default: false
    shouldFilterItem?: (item: ComboBoxItem, value: string) => boolean; // default: () => true
    translateWithId?: (id: any) => string;
    id?: string;
    name?: string;
    ref?: null | HTMLInputElement; // default: null
  };
}

export class ComposedModal {
  $$prop_def: {
    size?: "xs" | "sm" | "lg";
    open?: boolean; // default: false
    danger?: boolean; // default: false
    containerClass?: string; // default: ""
    selectorPrimaryFocus?: string; // default: "[data-modal-primary-focus]"
    ref?: null | HTMLElement; // default: null
  };
}

export class ModalBody {
  $$prop_def: {
    hasForm?: boolean; // default: false
    hasScrollingContent?: boolean; // default: false
  };
}

export class ModalFooter {
  $$prop_def: {
    primaryButtonText?: string; // default: ""
    primaryButtonDisabled?: boolean; // default: false
    primaryClass?: string;
    secondaryButtonText?: string; // default: ""
    secondaryClass?: string;
    danger?: boolean; // default: false
  };
}

export class ModalHeader {
  $$prop_def: {
    title?: string; // default: ""
    label?: string; // default: ""
    labelClass?: string; // default: ""
    titleClass?: string; // default: ""
    closeClass?: string; // default: ""
    closeIconClass?: string; // default: ""
    iconDescription?: string; // default: "Close"
  };
}

export class ContentSwitcher {
  $$prop_def: {
    selectedIndex?: number; // default: 0
    light?: boolean; // default: false
  };
}

export class Switch {
  $$prop_def: {
    text?: string; // default: "Provide text"
    selected?: boolean; // default: false
    disabled?: boolean; // default: false
    id?: string;
    ref?: null | HTMLButtonElement; // default: null
  };
}

export class Copy {
  $$prop_def: {
    feedback?: string; // default: "Copied!"
    feedbackTimeout?: number; // default: 2000
    ref?: null | HTMLButtonElement; // default: null
  };
}

export class CopyButton {
  $$prop_def: {
    iconDescription?: string; // default: "Copy to clipboard"
  };
}

export class DataTable {
  $$prop_def: {
    headers?: { key: string; value: string }; // default: []
    rows?: Object[]; // default: []
    size?: "compact" | "short" | "tall";
    title?: string; // default: ""
    description?: string; // default: ""
    zebra?: boolean; // default: false
    sortable?: boolean; // default: false
    stickyHeader?: boolean; // default: false
  };
}

export class Table {
  $$prop_def: {
    size?: "compact" | "short" | "tall";
    zebra?: boolean; // default: false
    useStaticWidth?: boolean; // default: false
    shouldShowBorder?: boolean; // default: false
    sortable?: boolean; // default: false
    stickyHeader?: boolean; // default: false
  };
}

export class TableBody {
  $$prop_def: {};
}

export class TableCell {
  $$prop_def: {};
}

export class TableContainer {
  $$prop_def: {
    title?: string; // default: ""
    description?: string; // default: ""
    stickyHeader?: boolean; // default: false
  };
}

export class TableHead {
  $$prop_def: {};
}

export class TableHeader {
  $$prop_def: {
    scope?: string; // default: "col"
    translateWithId?: () => string; // default: () => ""
    id?: string;
  };
}

export class TableRow {
  $$prop_def: {
    isSelected?: boolean; // default: false
  };
}

export class DataTableSkeleton {
  $$prop_def: {
    columns?: number; // default: 5
    rows?: number; // default: 5
    compact?: boolean; // default: false
    zebra?: boolean; // default: false
    headers?: string[]; // default: []
  };
}

export class DatePickerSkeleton {
  $$prop_def: {
    range?: boolean; // default: false
    id?: string;
  };
}

export class DatePicker {
  $$prop_def: {
    datePickerType?: "simple" | "single" | "range"; // default: "simple"
    value?: string; // default: ""
    appendTo?: HTMLElement; // default: document.body
    dateFormat?: string; // default: "m/d/Y"
    maxDate?: null | string | Date; // default: null
    minDate?: null | string | Date; // default: null
    locale?: string; // default: "en"
    short?: boolean; // default: false
    light?: boolean; // default: false
    id?: string;
  };
}

export class DatePickerInput {
  $$prop_def: {
    size?: "sm" | "xl";
    type?: string; // default: "text"
    placeholder?: string; // default: ""
    iconDescription?: string; // default: ""
    id?: string;
    invalid?: boolean; // default: false
    invalidText?: string; // default: ""
    ref?: null | HTMLInputElement; // default: null
  };
}

export class DropdownSkeleton {
  $$prop_def: {
    inline?: boolean; // default: false
  };
}

type DropdownItemId = string;

type DropdownItemText = string;

interface DropdownItem {
  id: DropdownItemId;
  text: DropdownItemText;
}

export class Dropdown {
  $$prop_def: {
    items?: DropdownItem[]; // default: []
    itemToString?: (item: DropdownItem) => string; // default: (item: DropdownItem) => DropdownItemText | DropdownItemId
    selectedIndex?: number; // default: -1
    type?: "default" | "inline"; // default: "default"
    size?: "sm" | "lg" | "xl";
    open?: boolean; // default: false
    inline?: boolean; // default: false
    light?: boolean; // default: false
    disabled?: boolean; // default: false
    titleText?: string; // default: ""
    invalid?: boolean; // default: false
    invalidText?: string; // default: ""
    helperText?: string; // default: ""
    label?: string;
    translateWithId?: (id: any) => string;
    id?: string;
    name?: string;
    ref?: null | HTMLButtonElement; // default: null
  };
}

export class FileUploaderSkeleton {
  $$prop_def: {};
}

export class FileUploader {
  $$prop_def: {
    status?: "uploading" | "edit" | "complete"; // default: "uploading"
    accept?: string[]; // default: []
    files?: string[]; // default: []
    multiple?: boolean; // default: false
    clearFiles?: () => any; // default: () => void
    labelDescription?: string; // default: ""
    labelTitle?: string; // default: ""
    kind?: "primary" | "secondary" | "tertiary" | "ghost" | "danger"; // default: "primary"
    buttonLabel?: string; // default: ""
    iconDescription?: string; // default: ""
    name?: string;
  };
}

export class FileUploaderButton {
  $$prop_def: {
    accept?: string[]; // default: []
    multiple?: boolean; // default: false
    disabled?: boolean; // default: false
    disableLabelChanges?: boolean; // default: false
    kind?: "primary" | "secondary" | "tertiary" | "ghost" | "danger"; // default: "primary"
    labelText?: string; // default: "Add file"
    role?: string; // default: "button"
    tabindex?: string; // default: "0"
    id?: string;
    name?: string;
    ref?: null | HTMLInputElement; // default: null
  };
}

type Files = string[];

export class FileUploaderDropContainer {
  $$prop_def: {
    accept?: string[]; // default: []
    multiple?: boolean; // default: false
    validateFiles?: (files: Files) => Files; // default: (files: Files) => Files
    labelText?: string; // default: "Add file"
    role?: string; // default: "button"
    disabled?: boolean; // default: false
    tabindex?: string; // default: "0"
    id?: string;
    name?: string; // default: ""
    ref?: null | HTMLInputElement; // default: null
  };
}

export class FileUploaderItem {
  $$prop_def: {
    status?: "uploading" | "edit" | "complete"; // default: "uploading"
    iconDescription?: string; // default: ""
    invalid?: boolean; // default: false
    errorSubject?: string; // default: ""
    errorBody?: string; // default: ""
    id?: string;
    name?: string; // default: ""
  };
}

export class Filename {
  $$prop_def: {
    status?: "uploading" | "edit" | "complete"; // default: "uploading"
    iconDescription?: string; // default: ""
    invalid?: boolean; // default: false
  };
}

export class Form {
  $$prop_def: {};
}

export class FormGroup {
  $$prop_def: {
    invalid?: boolean; // default: false
  };
}

export class FormItem {
  $$prop_def: {};
}

export class FormLabel {
  $$prop_def: {
    id?: string;
  };
}

type ColumnSize = boolean | number;

interface ColumnSizeDescriptor {
  span?: ColumnSize;
  offset: number;
}

type ColumnBreakpoint = ColumnSize | ColumnSizeDescriptor;

export class Column {
  $$prop_def: {
    as?: boolean; // default: false
    noGutter?: boolean; // default: false
    noGutterLeft?: boolean; // default: false
    noGutterRight?: boolean; // default: false
    aspectRatio?: "2x1" | "16x9" | "9x16" | "1x2" | "4x3" | "3x4" | "1x1";
    sm?: ColumnBreakpoint;
    md?: ColumnBreakpoint;
    lg?: ColumnBreakpoint;
    xlg?: ColumnBreakpoint;
    max?: ColumnBreakpoint;
  };
}

export class Grid {
  $$prop_def: {
    as?: boolean; // default: false
    condensed?: boolean; // default: false
    narrow?: boolean; // default: false
    fullWidth?: boolean; // default: false
    noGutter?: boolean; // default: false
    noGutterLeft?: boolean; // default: false
    noGutterRight?: boolean; // default: false
  };
}

export class Row {
  $$prop_def: {
    as?: boolean; // default: false
    condensed?: boolean; // default: false
    narrow?: boolean; // default: false
    noGutter?: boolean; // default: false
    noGutterLeft?: boolean; // default: false
    noGutterRight?: boolean; // default: false
  };
}

export class IconSkeleton {
  $$prop_def: {
    size?: number; // default: 16
  };
}

export class Icon {
  $$prop_def: {
    render?: CarbonIcon;
    skeleton?: boolean; // default: false
  };
}

export class InlineLoading {
  $$prop_def: {
    status?: "active" | "inactive" | "finished" | "error"; // default: "active"
    description?: string;
    iconDescription?: string; // default: "Expand/Collapse"
    successDelay?: number; // default: 1500
  };
}

export class Link {
  $$prop_def: {
    inline?: boolean; // default: false
    disabled?: boolean; // default: false
    ref?: null | HTMLAnchorElement | HTMLParagraphElement; // default: null
  };
}

export class ListBox {
  $$prop_def: {
    size?: "sm" | "xl";
    type?: "default" | "inline"; // default: "default"
    open?: boolean; // default: false
    light?: boolean; // default: false
    disable?: boolean; // default: false
    invalid?: boolean; // default: false
    invalidText?: string; // default: ""
  };
}

type ListBoxFieldTranslationId = "close" | "open";

export class ListBoxField {
  $$prop_def: {
    disabled?: boolean; // default: false
    role?: string; // default: "combobox"
    tabindex?: string; // default: "-1"
    translateWithId?: (id: ListBoxFieldTranslationId) => string; // default: (id) => string
    id?: string;
    ref?: null | HTMLElement; // default: null
  };
}

export class ListBoxMenu {
  $$prop_def: {
    id?: string;
  };
}

type ListBoxMenuIconTranslationId = "close" | "open";

export class ListBoxMenuIcon {
  $$prop_def: {
    open?: boolean; // default: false
    translateWithId?: (id: ListBoxMenuIconTranslationId) => string; // default: (id) => string
  };
}

export class ListBoxMenuItem {
  $$prop_def: {
    active?: boolean; // default: false
    highlighted?: boolean; // default: false
  };
}

type ListBoxSelectionTranslationId = "clearAll" | "clearSelection";

export class ListBoxSelection {
  $$prop_def: {
    selectionCount?: any;
    disabled?: boolean; // default: false
    translateWithId?: (id: ListBoxSelectionTranslationId) => string; // default: (id) => string
    ref?: null | HTMLElement; // default: null
  };
}

export class ListItem {
  $$prop_def: {};
}

export class Loading {
  $$prop_def: {
    small?: boolean; // default: false
    active?: boolean; // default: true
    withOverlay?: boolean; // default: false
    description?: string; // default: "Active loading indicator"
    id?: string;
  };
}

export class Modal {
  $$prop_def: {
    size?: "xs" | "sm" | "lg";
    open?: boolean; // default: false
    danger?: boolean; // default: false
    passiveModal?: boolean; // default: false
    modalHeading?: string;
    modalLabel?: string;
    modalAriaLabel?: string;
    iconDescription?: string; // default: "Close the modal"
    hasForm?: boolean; // default: false
    hasScrollingContent?: boolean; // default: false
    primaryButtonText?: string; // default: ""
    primaryButtonDisabled?: boolean; // default: false
    shouldSubmitOnEnter?: boolean; // default: true
    secondaryButtonText?: string; // default: ""
    selectorPrimaryFocus?: string; // default: "[data-modal-primary-focus]"
    id?: string;
    ref?: null | HTMLElement; // default: null
  };
}

type MultiSelectItemId = string;

type MultiSelectItemText = string;

interface MultiSelectItem {
  id: MultiSelectItemId;
  text: MultiSelectItemText;
}

export class MultiSelect {
  $$prop_def: {
    items?: MultiSelectItem[]; // default: []
    itemToString?: (item: MultiSelectItem) => string; // default: (item: MultiSelectItem) =>  MultiSelectItemText | MultiSelectItemId
    selectedIds?: MultiSelectItemId[]; // default: []
    value?: string; // default: ""
    size?: "sm" | "lg" | "xl";
    type?: "default" | "inline"; // default: "default"
    selectionFeedback?: "top" | "fixed" | "top-after-reopen"; // default: "top-after-reopen"
    disabled?: boolean; // default: false
    filterable?: boolean; // default: false
    filterItem?: (item: MultiSelectItem, value: string) => string; // default: (item: MultiSelectItem, value: string) => string
    open?: boolean; // default: false
    light?: boolean; // default: false
    locale?: string; // default: "en"
    placeholder?: string; // default: ""
    sortItem?: (a: MultiSelectItem, b: MultiSelectItem) => MultiSelectItem; // default: (a: MultiSelectItem, b: MultiSelectItem) => MultiSelectItem
    translateWithId?: (id: any) => string;
    titleText?: string; // default: ""
    useTitleInItem?: boolean; // default: false
    invalid?: boolean; // default: false
    invalidText?: string; // default: ""
    helperText?: string; // default: ""
    label?: string;
    id?: string;
    name?: string;
  };
}

export class InlineNotification {
  $$prop_def: {
    notificationType?: "toast" | "inline"; // default: "toast"
    kind?:
      | "error"
      | "info"
      | "info-square"
      | "success"
      | "warning"
      | "warning-alt"; // default: "error"
    lowContrast?: boolean; // default: false
    role?: string; // default: "alert"
    title?: string; // default: "Title"
    subtitle?: string; // default: ""
    hideCloseButton?: boolean; // default: false
    iconDescription?: string; // default: "Closes notification"
  };
}

export class NotificationActionButton {
  $$prop_def: {};
}

export class NotificationButton {
  $$prop_def: {
    notificationType?: "toast" | "inline"; // default: "toast"
    renderIcon?: CarbonIcon;
    iconDescription?: string; // default: "Close icon"
  };
}

export class NotificationIcon {
  $$prop_def: {
    kind?:
      | "error"
      | "info"
      | "info-square"
      | "success"
      | "warning"
      | "warning-alt"; // default: "error"
    notificationType?: "toast" | "inline"; // default: "toast"
    iconDescription?: string; // default: "Closes notification"
  };
}

export class NotificationTextDetails {
  $$prop_def: {
    notificationType?: "toast" | "inline"; // default: "toast"
    title?: string; // default: "Title"
    subtitle?: string; // default: ""
    caption?: string; // default: "Caption"
  };
}

export class ToastNotification {
  $$prop_def: {
    notificationType?: "toast" | "inline"; // default: "toast"
    kind?:
      | "error"
      | "info"
      | "info-square"
      | "success"
      | "warning"
      | "warning-alt"; // default: "error"
    lowContrast?: boolean; // default: false
    timeout?: number; // default: 0
    role?: string; // default: "alert"
    title?: string; // default: "Title"
    subtitle?: string; // default: ""
    caption?: string; // default: "Caption"
    iconDescription?: string; // default: "Closes notification"
    hideCloseButton?: boolean; // default: false
  };
}

export class NumberInputSkeleton {
  $$prop_def: {
    hideLabel?: boolean; // default: false
  };
}

type NumberInputTranslationId = "increment" | "decrement";

export class NumberInput {
  $$prop_def: {
    size?: "sm" | "xl";
    value?: string; // default: ""
    step?: number; // default: 1
    max?: number;
    min?: number;
    light?: boolean; // default: false
    readonly?: boolean; // default: false
    mobile?: boolean; // default: false
    allowEmpty?: boolean; // default: false
    disabled?: boolean; // default: false
    iconDescription?: string; // default: ""
    invalid?: boolean; // default: false
    invalidText?: string; // default: "Provide invalidText"
    helperText?: string; // default: ""
    label?: string; // default: ""
    hideLabel?: boolean; // default: false
    translateWithId?: (id: NumberInputTranslationId) => string; // default: (id: NumberInputTranslationId) => string
    id?: string;
    name?: string;
    ref?: null | HTMLInputElement; // default: null
  };
}

export class OrderedList {
  $$prop_def: {
    nested?: boolean; // default: false
  };
}

export class OverflowMenu {
  $$prop_def: {
    direction?: "top" | "bottom"; // default: "bottom"
    open?: boolean; // default: false
    light?: boolean; // default: false
    flipped?: boolean; // default: false
    menuOptionsClass?: string;
    icon?: CarbonIcon;
    iconClass?: string;
    iconDescription?: string; // default: "Open and close list of options"
    id?: string;
  };
}

export class OverflowMenuItem {
  $$prop_def: {
    text?: string; // default: "Provide text"
    href?: string; // default: ""
    primaryFocus?: boolean; // default: false
    disabled?: boolean; // default: false
    hasDivider?: boolean; // default: false
    danger?: boolean; // default: false
    requireTitle?: boolean; // default: false
    id?: string;
    ref?: null | HTMLAnchorElement | HTMLButtonElement; // default: null
  };
}

export class PaginationSkeleton {
  $$prop_def: {};
}

export class Pagination {
  $$prop_def: {
    page?: number; // default: 1
    total?: number; // default: 0
    disabled?: boolean; // default: false
    forwardText?: string; // default: "Next page"
    backwardText?: string; // default: "Previous page"
    itemsPerPageText?: string; // default: "Items per page:"
    itemText?: (min: number, max: number) => string; // default: (min: number, max: number) => string
    itemRangeText?: (min: number, max: number, total: number) => string; // default: (min: number, max: number, total: number) => string
    pageInputDisabled?: boolean; // default: false
    pageSize?: number; // default: 10
    pageSizes?: number[]; // default: [10]
    pagesUnknown?: boolean; // default: false
    pageText?: (page: number) => string; // default: (current: number) => string
    pageRangeText?: (current: number, total: number) => string; // default: (current: number, total: number) => string
    id?: string;
  };
}

export class PaginationItem {
  $$prop_def: {
    page?: number; // default: 0
    active?: boolean; // default: false
  };
}

export class PaginationNav {
  $$prop_def: {
    page?: number; // default: 0
    total?: number; // default: 10
    shown?: number; // default: 10
    loop?: boolean; // default: false
    forwardText?: string; // default: "Next page"
    backwardText?: string; // default: "Next page"
  };
}

export class PaginationOverflow {
  $$prop_def: {
    fromIndex?: number; // default: 0
    count?: number; // default: 0
  };
}

export class ProgressIndicatorSkeleton {
  $$prop_def: {};
}

export class ProgressIndicator {
  $$prop_def: {
    currentIndex?: number; // default: 0
  };
}

export class ProgressStep {
  $$prop_def: {
    complete?: boolean; // default: false
    current?: boolean; // default: false
    disabled?: boolean; // default: false
    invalid?: boolean; // default: false
    descripton?: string; // default: ""
    label?: string; // default: ""
    secondaryLabel?: string; // default: ""
    id?: string;
  };
}

export class RadioButtonSkeleton {
  $$prop_def: {};
}

export class RadioButton {
  $$prop_def: {
    value?: string; // default: ""
    checked?: boolean; // default: false
    disabled?: boolean; // default: false
    labelPosition?: "right" | "left"; // default: "right"
    labelText?: string; // default: ""
    hideLabel?: boolean; // default: false
    id?: string;
    name?: string; // default: ""
    ref?: null | HTMLInputElement; // default: null
  };
}

export class RadioButtonGroup {
  $$prop_def: {
    selected?: string;
    disabled?: boolean; // default: false
    labelPosition?: "right" | "left"; // default: "right"
    orientation?: "horizontal" | "vertical"; // default: "horizontal"
  };
}

export class SearchSkeleton {
  $$prop_def: {
    small?: boolean; // default: false
  };
}

export class Search {
  $$prop_def: {
    small?: boolean; // default: false
    size?: "sm" | "lg";
    skeleton?: boolean; // default: false
    light?: boolean; // default: false
    value?: string; // default: "text"
    type?: string; // default: "text"
    placeholder?: string; // default: "Search..."
    autocomplete?: "on" | "off"; // default: "off"
    autofocus?: boolean; // default: false
    closeButtonLabelText?: string; // default: "Clear search input"
    labelText?: string; // default: ""
    id?: string;
    ref?: null | HTMLInputElement; // default: null
  };
}

export class SelectSkeleton {
  $$prop_def: {
    hideLabel?: boolean; // default: false
  };
}

export class Select {
  $$prop_def: {
    selected?: string;
    size?: "sm" | "xl";
    inline?: boolean; // default: false
    light?: boolean; // default: false
    disabled?: boolean; // default: false
    id?: string;
    name?: string;
    invalid?: boolean; // default: false
    invalidText?: string; // default: ""
    helperText?: string; // default: ""
    noLabel?: boolean; // default: false
    labelText?: string; // default: ""
    hideLabel?: boolean; // default: false
    ref?: null | HTMLSelectElement; // default: null
  };
}

export class SelectItem {
  $$prop_def: {};
}

export class SelectItemGroup {
  $$prop_def: {
    disabled?: boolean; // default: false
    label?: string; // default: "Provide label"
  };
}

export class SkeletonPlaceholder {
  $$prop_def: {};
}

export class SkeletonText {
  $$prop_def: {
    lines?: number; // default: 3
    heading?: boolean; // default: false
    paragraph?: boolean; // default: false
    width?: string; // default: "100%"
  };
}

export class SliderSkeleton {
  $$prop_def: {
    hideLabel?: boolean; // default: false
  };
}

export class Slider {
  $$prop_def: {
    id?: string;
    invalid?: boolean; // default: false
    labelText?: string; // default: ""
    light?: boolean; // default: false
    name?: string; // default: ""
    ref?: null | HTMLElement; // default: null
  };
}

export class StructuredListSkeleton {
  $$prop_def: {
    rows?: number; // default: 5
    border?: boolean; // default: false
  };
}

export class StructuredList {
  $$prop_def: {
    selected?: string;
    border?: boolean; // default: false
    selection?: boolean; // default: false
  };
}

export class StructuredListBody {
  $$prop_def: {};
}

export class StructuredListCell {
  $$prop_def: {
    head?: boolean; // default: false
    noWrap?: boolean; // default: false
  };
}

export class StructuredListHead {
  $$prop_def: {};
}

export class StructuredListInput {
  $$prop_def: {
    checked?: boolean; // default: false
    title?: string; // default: "title"
    value?: string; // default: "value"
    id?: string;
    name?: string; // default: ""
    ref?: null | HTMLInputElement; // default: null
  };
}

export class StructuredListRow {
  $$prop_def: {
    head?: boolean; // default: false
    label?: boolean; // default: false
    tabindex?: string; // default: "0"
  };
}

export class Tab {
  $$prop_def: {
    id?: string;
  };
}

export class TabContent {
  $$prop_def: {
    id?: string;
  };
}

export class Tabs {
  $$prop_def: {};
}

export class TabsSkeleton {
  $$prop_def: {};
}

export class TagSkeleton {
  $$prop_def: {};
}

export class Tag {
  $$prop_def: {
    type?:
      | "red"
      | "magenta"
      | "purple"
      | "blue"
      | "cyan"
      | "teal"
      | "green"
      | "gray"
      | "cool-gray"
      | "warm-gray"
      | "high-contrast";
    filter?: boolean; // default: false
    disabled?: boolean; // default: false
    skeleton?: boolean; // default: false
    title?: string; // default: "Clear filter"
    id?: string;
  };
}

export class TextAreaSkeleton {
  $$prop_def: {
    hideLabel?: boolean; // default: false
  };
}

export class TextArea {
  $$prop_def: {
    value?: string; // default: ""
    placeholder?: string; // default: ""
    cols?: number; // default: 50
    rows?: number; // default: 4
    light?: boolean; // default: false
    disabled?: boolean; // default: false
    helperText?: string; // default: ""
    labelText?: string; // default: ""
    hideLabel?: boolean; // default: false
    invalid?: boolean; // default: false
    invalidText?: string; // default: ""
    id?: string;
    name?: string;
    ref?: null | HTMLTextAreaElement; // default: null
  };
}

export class PasswordInput {
  $$prop_def: {
    size?: "sm" | "xl";
    value?: string; // default: ""
    type?: string; // default: "password"
    placeholder?: string; // default: ""
    hidePasswordLabel?: string; // default: "Hide password"
    showPasswordLabel?: string; // default: "Show password"
    tooltipAlignment?: "start" | "center" | "end"; // default: "center"
    tooltipPosition?: "top" | "right" | "bottom" | "left"; // default: "bottom"
    light?: boolean; // default: false
    disabled?: boolean; // default: false
    helperText?: string; // default: ""
    labelText?: string; // default: ""
    hideLabel?: boolean; // default: false
    invalid?: boolean; // default: false
    invalidText?: string; // default: ""
    id?: string;
    name?: string;
    ref?: null | HTMLInputElement; // default: null
  };
}

export class TextInputSkeleton {
  $$prop_def: {
    hideLabel?: boolean; // default: false
  };
}

export class TextInput {
  $$prop_def: {
    size?: "sm" | "xl";
    value?: string; // default: ""
    type?: string; // default: ""
    placeholder?: string; // default: ""
    light?: boolean; // default: false
    disabled?: boolean; // default: false
    helperText?: string; // default: ""
    id?: string;
    name?: string;
    labelText?: string; // default: ""
    hideLabel?: boolean; // default: false
    invalid?: boolean; // default: false
    invalidText?: string; // default: ""
    ref?: null | HTMLInputElement; // default: null
  };
}

export class ClickableTile {
  $$prop_def: {
    clicked?: boolean; // default: false
    light?: boolean; // default: false
  };
}

export class ExpandableTile {
  $$prop_def: {
    expanded?: boolean; // default: false
    light?: boolean; // default: false
    tileMaxHeight?: number; // default: 0
    tilePadding?: number; // default: 0
    tileCollapsedIconText?: string; // default: "Interact to expand Tile"
    tileExpandedIconText?: string; // default: "Interact to collapse Tile"
    tabindex?: string; // default: "0"
    id?: string;
    ref?: null | HTMLElement; // default: null
  };
}

export class RadioTile {
  $$prop_def: {
    checked?: boolean; // default: false
    light?: boolean; // default: false
    value?: string; // default: ""
    tabindex?: string; // default: "0"
    iconDescription?: string; // default: "Tile checkmark"
    id?: string;
    name?: string; // default: ""
  };
}

export class SelectableTile {
  $$prop_def: {
    selected?: boolean; // default: false
    light?: boolean; // default: false
    title?: string; // default: "title"
    value?: string; // default: "value"
    tabindex?: string; // default: "0"
    iconDescription?: string; // default: "Tile checkmark"
    id?: string;
    name?: string; // default: ""
    ref?: null | HTMLInputElement; // default: null
  };
}

export class Tile {
  $$prop_def: {
    light?: boolean; // default: false
  };
}

export class TileGroup {
  $$prop_def: {
    selected?: string;
    disabled?: boolean; // default: false
    legend?: string;
  };
}

export class TimePicker {
  $$prop_def: {
    value?: string; // default: ""
    type?: string; // default: "text"
    placeholder?: string; // default: "hh=mm"
    pattern?: string; // default: "(1[012]|[1-9]):[0-5][0-9](\\s)?"
    maxLength?: number; // default: 5
    light?: boolean; // default: false
    disabled?: boolean; // default: false
    labelText?: string; // default: ""
    hideLabel?: boolean; // default: false
    invalid?: boolean; // default: false
    invalidText?: string; // default: "Invalid time format."
    id?: string;
    name?: string;
    ref?: null | HTMLInputElement; // default: null
  };
}

export class TimePickerSelect {
  $$prop_def: {
    value?: string; // default: ""
    disabled?: boolean; // default: false
    iconDescription?: string; // default: "Expand/Collapse"
    labelText?: string; // default: ""
    hideLabel?: boolean; // default: false
    id?: string;
    name?: string;
    ref?: null | HTMLSelectElement; // default: null
  };
}

export class ToggleSkeleton {
  $$prop_def: {
    labelText?: string; // default: ""
    id?: string;
  };
}

export class Toggle {
  $$prop_def: {
    toggled?: boolean; // default: false
    disabled?: boolean; // default: false
    labelA?: string; // default: "Off"
    labelB?: string; // default: "On"
    labelText?: string; // default: ""
    id?: string;
    name?: string;
  };
}

export class ToggleSmallSkeleton {
  $$prop_def: {
    labelText?: string; // default: ""
    id?: string;
  };
}

export class ToggleSmall {
  $$prop_def: {
    toggled?: boolean; // default: false
    disabled?: boolean; // default: false
    labelA?: string; // default: "Off"
    labelB?: string; // default: "On"
    labelText?: string; // default: ""
    id?: string;
    name?: string;
  };
}

export class Tooltip {
  $$prop_def: {
    direction?: "top" | "right" | "bottom" | "left"; // default: "bottom"
    open?: boolean; // default: false
    hideIcon?: boolean; // default: false
    icon?: CarbonIcon; // default: Information16
    iconDescription?: string; // default: ""
    iconName?: string; // default: ""
    tabindex?: string; // default: "0"
    tooltipId?: string;
    triggerId?: string;
    triggerText?: string; // default: ""
    ref?: null | HTMLElement; // default: null
  };
}

export class TooltipDefinition {
  $$prop_def: {
    tooltipText?: string; // default: ""
    align?: "start" | "center" | "end"; // default: "center"
    direction?: "top" | "bottom"; // default: "bottom"
    id?: string;
    ref?: null | HTMLButtonElement; // default: null
  };
}

export class TooltipIcon {
  $$prop_def: {
    tooltipText?: string; // default: ""
    align?: "start" | "center" | "end"; // default: "center"
    direction?: "top" | "right" | "bottom" | "left"; // default: "bottom"
    id?: string;
    ref?: null | HTMLButtonElement; // default: null
  };
}

export class Content {
  $$prop_def: {
    id?: string; // default: "main-content"
  };
}

export class SkipToContent {
  $$prop_def: {
    href?: string; // default: "#main-content"
    tabindex?: string; // default: "0"
  };
}

export class UnorderedList {
  $$prop_def: {
    nested?: boolean; // default: false
  };
}

export class Header {
  $$prop_def: {
    isSideNavOpen?: boolean; // default: false
    uiShellAriaLabel?: string;
    href?: string;
    company?: string;
    platformName?: string;
  };
}

export class HeaderAction {
  $$prop_def: {
    isOpen?: boolean; // default: false
    icon?: { render: CarbonIcon; skeleton: boolean };
    text?: string;
  };
}

export class HeaderActionLink {
  $$prop_def: {
    linkIsActive?: boolean; // default: false
    href?: string;
    icon?: { render: CarbonIcon; skeleton: boolean };
  };
}

export class HeaderActionSearch {
  $$prop_def: {
    searchIsActive?: boolean; // default: false
  };
}

export class HeaderNav {
  $$prop_def: {
    ariaLabel?: string;
  };
}

export class HeaderNavItem {
  $$prop_def: {
    href?: string;
    text?: string;
  };
}

export class HeaderNavMenu {
  $$prop_def: {
    expanded?: boolean; // default: false
    href?: string; // default: "/"
    text?: string;
    iconDescription?: string; // default: "Expand/Collapse"
  };
}

export class HeaderPanelDivider {
  $$prop_def: {};
}

export class HeaderPanelLink {
  $$prop_def: {
    href?: string;
  };
}

export class HeaderPanelLinks {
  $$prop_def: {};
}

export class HeaderUtilities {
  $$prop_def: {};
}

export class HamburgerMenu {
  $$prop_def: {
    ariaLabel?: string;
    isOpen?: boolean; // default: false
  };
}

export class SideNav {
  $$prop_def: {
    ariaLabel?: string;
    isOpen?: boolean; // default: false
  };
}

export class SideNavItems {
  $$prop_def: {};
}

export class SideNavLink {
  $$prop_def: {
    isSelected?: boolean; // default: false
    href?: string;
    text?: string;
    icon?: { render: CarbonIcon; skeleton: boolean };
  };
}

export class SideNavMenu {
  $$prop_def: {
    expanded?: boolean;
    text?: string;
    icon?: { render: CarbonIcon; skeleton: boolean };
  };
}

export class SideNavMenuItem {
  $$prop_def: {};
}
