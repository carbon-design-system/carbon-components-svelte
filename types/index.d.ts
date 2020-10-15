// Type definitions for carbon-components-svelte 0.16.0
// Project: https://github.com/IBM/carbon-components-svelte

export class CarbonSvelteComponent {
  $$prop_def: {};

  $$slot_def: {};

  // stub all `on:{eventname}` directives
  $on(eventname: string, handler: (e: Event) => any): () => void;
}

export class Accordion extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify alignment of accordion item chevron icon
     * @default "end"
     */
    align?: "start" | "end";

    /**
     * Specify the size of the accordion
     */
    size?: "sm" | "xl";

    /**
     * Set to `true` to display the skeleton state
     * @default false
     */
    skeleton?: boolean;
  };

  $$slot_def: { default: {} };
}

export class AccordionItem extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the title of the accordion item heading
     * Alternatively, use the named slot "title" (e.g. <div slot="title">...</div>)
     * @default "title"
     */
    title?: string;

    /**
     * Set to `true` to open the first accordion item
     * @default false
     */
    open?: boolean;

    /**
     * Specify the ARIA label for the accordion item chevron icon
     * @default "Expand/Collapse"
     */
    iconDescription?: string;
  };

  $$slot_def: { title: {}; default: {} };
}

export class AccordionSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the number of accordion items to render
     * @default 4
     */
    count?: number;

    /**
     * Specify alignment of accordion item chevron icon
     * @default "end"
     */
    align?: "start" | "end";

    /**
     * Specify the size of the accordion
     */
    size?: "sm" | "xl";

    /**
     * Set to `false` to close the first accordion item
     * @default true
     */
    open?: boolean;
  };
}

export class Breadcrumb extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to hide the breadcrumb trailing slash
     * @default false
     */
    noTrailingSlash?: boolean;

    /**
     * Set to `true` to display skeleton state
     * @default false
     */
    skeleton?: boolean;
  };

  $$slot_def: { default: {} };
}

export class BreadcrumbItem extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the `href` to use an anchor link
     */
    href?: string;

    /**
     * Set to `true` if the breadcrumb item represents the current page
     * @default false
     */
    isCurrentPage?: boolean;
  };

  $$slot_def: { default: { props: any } };
}

export class BreadcrumbSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to hide the breadcrumb trailing slash
     * @default false
     */
    noTrailingSlash?: boolean;

    /**
     * Specify the number of breadcrumb items to render
     * @default 3
     */
    count?: number;
  };
}

export class Button extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the kind of button
     * @default "primary"
     */
    kind?: "primary" | "secondary" | "tertiary" | "ghost" | "danger";

    /**
     * Specify the size of button
     * @default "default"
     */
    size?: "default" | "field" | "small";

    /**
     * Set to `true` for the icon-only variant
     * @default false
     */
    hasIconOnly?: boolean;

    /**
     * Specify the icon from `carbon-icons-svelte` to render
     */
    icon?: typeof import("carbon-icons-svelte/lib/Add16").default;

    /**
     * Specify the ARIA label for the button icon
     */
    iconDescription?: string;

    /**
     * Set the alignment of the tooltip relative to the icon
     * `hasIconOnly` must be set to `true`
     */
    tooltipAlignment?: "start" | "center" | "end";

    /**
     * Set the position of the tooltip relative to the icon
     */
    tooltipPosition?: "top" | "right" | "bottom" | "left";

    /**
     * Set to `true` to render a custom HTML element
     * Props are destructured as `props` in the default slot (e.g. <Button let:props><div {...props}>...</div></Button>)
     * @default false
     */
    as?: boolean;

    /**
     * Set to `true` to display the skeleton state
     * @default false
     */
    skeleton?: boolean;

    /**
     * Set to `true` to disable the button
     * @default false
     */
    disabled?: boolean;

    /**
     * Set the `href` to use an anchor link
     */
    href?: string;

    /**
     * Specify the tabindex
     * @default "0"
     */
    tabindex?: string;

    /**
     * Specify the `type` attribute for the button element
     * @default "button"
     */
    type?: string;

    /**
     * Obtain a reference to the HTML element
     * @default null
     */
    ref?: null | HTMLAnchorElement | HTMLButtonElement;
  };

  $$slot_def: { default: {} };
}

export class ButtonSet extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to stack the buttons vertically
     * @default false
     */
    stacked?: boolean;
  };

  $$slot_def: { default: {} };
}

export class ButtonSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the `href` to use an anchor link
     */
    href?: string;

    /**
     * Set to `true` to use the small variant
     * @default false
     */
    small?: boolean;
  };
}

export class Checkbox extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify whether the checkbox is checked
     * @default false
     */
    checked?: boolean;

    /**
     * Specify whether the checkbox is indeterminate
     * @default false
     */
    indeterminate?: boolean;

    /**
     * Set to `true` to display the skeleton state
     * @default false
     */
    skeleton?: boolean;

    /**
     * Set to `true` for the checkbox to be read-only
     * @default false
     */
    readonly?: boolean;

    /**
     * Set to `true` to disable the checkbox
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set to `true` to visually hide the label text
     * @default false
     */
    hideLabel?: boolean;

    /**
     * Set a name for the input element
     * @default ""
     */
    name?: string;

    /**
     * Specify the title attribute for the label element
     */
    title?: string;

    /**
     * Set an id for the input label
     */
    id?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };
}

export class CheckboxSkeleton extends CarbonSvelteComponent {}

export class ClickableTile extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to click the tile
     * @default false
     */
    clicked?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set the `href`
     */
    href?: string;
  };

  $$slot_def: { default: {} };
}

export class CodeSnippet extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the type of code snippet
     * @default "single"
     */
    type?: "single" | "inline" | "multi";

    /**
     * Set the code snippet text
     * Alternatively, use the default slot (e.g. <CodeSnippet>{`code`}</CodeSnippet>)
     */
    code?: string;

    /**
     * Set to `true` to expand a multi-line code snippet (type="multi")
     * @default false
     */
    expanded?: boolean;

    /**
     * Set to `true` to hide the copy button
     * @default false
     */
    hideCopyButton?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to display the skeleton state
     * @default false
     */
    skeleton?: boolean;

    /**
     * Specify the ARIA label for the copy button icon
     */
    copyButtonDescription?: string;

    /**
     * Specify the ARIA label of the copy button
     */
    copyLabel?: string;

    /**
     * Specify the feedback text displayed when clicking the snippet
     * @default "Copied!"
     */
    feedback?: string;

    /**
     * Set the timeout duration (ms) to display feedback text
     * @default 2000
     */
    feedbackTimeout?: number;

    /**
     * Specify the show less text
     * `type` must be "multi"
     * @default "Show less"
     */
    showLessText?: string;

    /**
     * Specify the show more text
     * `type` must be "multi"
     * @default "Show more"
     */
    showMoreText?: string;

    /**
     * Set to `true` to enable the show more/less button
     * @default false
     */
    showMoreLess?: boolean;

    /**
     * Set an id for the code element
     */
    id?: string;

    /**
     * Obtain a reference to the pre HTML element
     * @default null
     */
    ref?: null | HTMLPreElement;
  };

  $$slot_def: { default: {} };
}

export class CodeSnippetSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the type of code snippet
     * @default "single"
     */
    type?: "single" | "inline" | "multi";
  };
}

type ColumnSize = boolean | number;

interface ColumnSizeDescriptor {
  span?: ColumnSize;
  offset: number;
}

type ColumnBreakpoint = ColumnSize | ColumnSizeDescriptor;

export class Column extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to render a custom HTML element
     * Props are destructured as `props` in the default slot (e.g. <Column let:props><article {...props}>...</article></Column>)
     * @default false
     */
    as?: boolean;

    /**
     * Set to `true` to remove the gutter
     * @default false
     */
    noGutter?: boolean;

    /**
     * Set to `true` to remove the left gutter
     * @default false
     */
    noGutterLeft?: boolean;

    /**
     * Set to `true` to remove the right gutter
     * @default false
     */
    noGutterRight?: boolean;

    /**
     * Specify the aspect ratio of the column
     */
    aspectRatio?: "2x1" | "16x9" | "9x16" | "1x2" | "4x3" | "3x4" | "1x1";

    /**
     * Set the small breakpoint
     */
    sm?: ColumnBreakpoint;

    /**
     * Set the medium breakpoint
     */
    md?: ColumnBreakpoint;

    /**
     * Set the large breakpoint
     */
    lg?: ColumnBreakpoint;

    /**
     * Set the extra large breakpoint
     */
    xlg?: ColumnBreakpoint;

    /**
     * Set the maximum breakpoint
     */
    max?: ColumnBreakpoint;
  };

  $$slot_def: { default: {} };
}

interface ComboBoxItem {
  id: string;
  text: string;
}

export class ComboBox extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the combobox items
     */
    items?: ComboBoxItem[];

    /**
     * Override the display of a combobox item
     */
    itemToString?: (item: ComboBoxItem) => string;

    /**
     * Set the selected item by value index
     */
    selectedIndex?: number;

    /**
     * Specify the selected combobox value
     * @default ""
     */
    value?: string;

    /**
     * Set the size of the combobox
     */
    size?: "sm" | "xl";

    /**
     * Set to `true` to disable the combobox
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the title text of the combobox
     * @default ""
     */
    titleText?: string;

    /**
     * Specify the placeholder text
     * @default ""
     */
    placeholder?: string;

    /**
     * Specify the helper text
     * @default ""
     */
    helperText?: string;

    /**
     * Specify the invalid state text
     * @default ""
     */
    invalidText?: string;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to open the combobox menu dropdown
     * @default false
     */
    open?: boolean;

    /**
     * Determine if an item should be filtered given the current combobox value
     */
    shouldFilterItem?: (item: ComboBoxItem, value: string) => boolean;

    /**
     * Override the default translation ids
     */
    translateWithId?: (id: any) => string;

    /**
     * Set an id for the list box component
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };
}

export class ComposedModal extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the size of the composed modal
     */
    size?: "xs" | "sm" | "lg";

    /**
     * Set to `true` to open the modal
     * @default false
     */
    open?: boolean;

    /**
     * Set to `true` to use the danger variant
     * @default false
     */
    danger?: boolean;

    /**
     * Set to `true` to prevent the modal from closing when clicking outside
     * @default false
     */
    preventCloseOnClickOutside?: boolean;

    /**
     * Specify a class for the inner modal
     * @default ""
     */
    containerClass?: string;

    /**
     * Specify a selector to be focused when opening the modal
     * @default "[data-modal-primary-focus]"
     */
    selectorPrimaryFocus?: string;

    /**
     * Obtain a reference to the top-level HTML element
     * @default null
     */
    ref?: null | HTMLElement;
  };

  $$slot_def: { default: {} };
}

export class Content extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the id for the main element
     * @default "main-content"
     */
    id?: string;
  };

  $$slot_def: { default: {} };
}

export class ContentSwitcher extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the selected index of the switch item
     * @default 0
     */
    selectedIndex?: number;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;
  };

  $$slot_def: { default: {} };
}

export class Copy extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the feedback text shown after clicking the button
     * @default "Copied!"
     */
    feedback?: string;

    /**
     * Set the timeout duration (ms) to display feedback text
     * @default 2000
     */
    feedbackTimeout?: number;

    /**
     * Obtain a reference to the button HTML element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };

  $$slot_def: { default: {} };
}

export class CopyButton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the title and ARIA label for the copy button
     * @default "Copy to clipboard"
     */
    iconDescription?: string;
  };
}

export class DataTable extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the data table headers
     */
    headers?: { key: string; value: string }[];

    /**
     * Specify the rows the data table should render
     * keys defined in `headers` are used for the row ids
     */
    rows?: Object[];

    /**
     * Set the size of the data table
     */
    size?: "compact" | "short" | "tall";

    /**
     * Specify the title of the data table
     * @default ""
     */
    title?: string;

    /**
     * Specify the description of the data table
     * @default ""
     */
    description?: string;

    /**
     * Set to `true` to use zebra styles
     * @default false
     */
    zebra?: boolean;

    /**
     * Set to `true` for the sortable variant
     * @default false
     */
    sortable?: boolean;

    /**
     * Set to `true` to enable a sticky header
     * @default false
     */
    stickyHeader?: boolean;
  };

  $$slot_def: { default: { props: any } };
}

export class DataTableSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the number of columns
     * @default 5
     */
    columns?: number;

    /**
     * Specify the number of rows
     * @default 5
     */
    rows?: number;

    /**
     * Set the size of the data table
     */
    size?: "compact" | "short" | "tall";

    /**
     * Set to `true` to apply zebra styles to the datatable rows
     * @default false
     */
    zebra?: boolean;

    /**
     * Set to `false` to hide the header
     * @default true
     */
    showHeader?: boolean;

    /**
     * Set the column headers
     * If `headers` has one more items, `count` is ignored
     */
    headers?: string[];

    /**
     * Set to `false` to hide the toolbar
     * @default true
     */
    showToolbar?: boolean;
  };
}

export class DatePicker extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the date picker type
     * @default "simple"
     */
    datePickerType?: "simple" | "single" | "range";

    /**
     * Specify the date picker input value
     * @default ""
     */
    value?: string;

    /**
     * Specify the element to append the calendar to
     */
    appendTo?: HTMLElement;

    /**
     * Specify the date format
     * @default "m/d/Y"
     */
    dateFormat?: string;

    /**
     * Specify the maximum date
     * @default null
     */
    maxDate?: null | string | Date;

    /**
     * Specify the minimum date
     * @default null
     */
    minDate?: null | string | Date;

    /**
     * Specify the locale
     * @default "en"
     */
    locale?: string;

    /**
     * Set to `true` to use the short variant
     * @default false
     */
    short?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set an id for the date picker element
     */
    id?: string;
  };

  $$slot_def: { default: {} };
}

export class DatePickerInput extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the size of the input
     */
    size?: "sm" | "xl";

    /**
     * Specify the input type
     * @default "text"
     */
    type?: string;

    /**
     * Specify the input placeholder text
     * @default ""
     */
    placeholder?: string;

    /**
     * Specify the Regular Expression for the input value
     * @default "\\d{1,2}\\/\\d{1,2}\\/\\d{4}"
     */
    pattern?: string;

    /**
     * Set to `true` to disable the input
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the ARIA label for the calendar icon
     * @default ""
     */
    iconDescription?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set to `true` to visually hide the label text
     * @default false
     */
    hideLabel?: boolean;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the invalid state text
     * @default ""
     */
    invalidText?: string;

    /**
     * Set a name for the input element
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };
}

export class DatePickerSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the range variant
     * @default false
     */
    range?: boolean;

    /**
     * Set an id to be used by the label element
     */
    id?: string;
  };
}

type DropdownItemId = string;

type DropdownItemText = string;

interface DropdownItem {
  id: DropdownItemId;
  text: DropdownItemText;
}

export class Dropdown extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the dropdown items
     */
    items?: DropdownItem[];

    /**
     * Override the display of a dropdown item
     */
    itemToString?: (item: DropdownItem) => string;

    /**
     * Specify the selected item index
     */
    selectedIndex?: number;

    /**
     * Specify the type of dropdown
     * @default "default"
     */
    type?: "default" | "inline";

    /**
     * Specify the size of the dropdown field
     */
    size?: "sm" | "lg" | "xl";

    /**
     * Set to `true` to open the dropdown
     * @default false
     */
    open?: boolean;

    /**
     * Set to `true` to use the inline variant
     * @default false
     */
    inline?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to disable the dropdown
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the title text
     * @default ""
     */
    titleText?: string;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the invalid state text
     * @default ""
     */
    invalidText?: string;

    /**
     * Specify the helper text
     * @default ""
     */
    helperText?: string;

    /**
     * Specify the list box label
     */
    label?: string;

    /**
     * Override the default translation ids
     */
    translateWithId?: (id: any) => string;

    /**
     * Set an id for the list box component
     */
    id?: string;

    /**
     * Specify a name attribute for the list box
     */
    name?: string;

    /**
     * Obtain a reference to the button HTML element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };
}

export class DropdownSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the inline variant
     * @default false
     */
    inline?: boolean;
  };
}

export class ExpandableTile extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to expand the tile
     * @default false
     */
    expanded?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Specify the max height of the tile  (number of pixels)
     * @default 0
     */
    tileMaxHeight?: number;

    /**
     * Specify the padding of the tile (number of pixels)
     * @default 0
     */
    tilePadding?: number;

    /**
     * Specify the icon text of the collapsed tile
     * @default "Interact to expand Tile"
     */
    tileCollapsedIconText?: string;

    /**
     * Specify the icon text of the expanded tile
     * @default "Interact to collapse Tile"
     */
    tileExpandedIconText?: string;

    /**
     * Specify the tabindex
     * @default "0"
     */
    tabindex?: string;

    /**
     * Set an id for the top-level div element
     */
    id?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLElement;
  };

  $$slot_def: { above: {}; below: {} };
}

export class FileUploader extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the file uploader status
     * @default "uploading"
     */
    status?: "uploading" | "edit" | "complete";

    /**
     * Specify the accepted file types
     */
    accept?: string[];

    /**
     * Obtain the uploaded file names
     */
    files?: string[];

    /**
     * Set to `true` to allow multiple files
     * @default false
     */
    multiple?: boolean;

    /**
     * Override the default behavior of clearing the array of uploaded files
     * @constant
     */
    clearFiles?: () => any;

    /**
     * Specify the label description
     * @default ""
     */
    labelDescription?: string;

    /**
     * Specify the label title
     * @default ""
     */
    labelTitle?: string;

    /**
     * Specify the kind of file uploader button
     * @default "primary"
     */
    kind?: "primary" | "secondary" | "tertiary" | "ghost" | "danger";

    /**
     * Specify the button label
     * @default ""
     */
    buttonLabel?: string;

    /**
     * Specify the ARIA label used for the status icons
     * @default "Provide icon description"
     */
    iconDescription?: string;

    /**
     * Specify a name attribute for the file button uploader input
     * @default ""
     */
    name?: string;
  };
}

export class FileUploaderButton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the accepted file types
     */
    accept?: string[];

    /**
     * Set to `true` to allow multiple files
     * @default false
     */
    multiple?: boolean;

    /**
     * Set to `true` to disable the input
     * @default false
     */
    disabled?: boolean;

    /**
     * Set to `true` to disable label changes
     * @default false
     */
    disableLabelChanges?: boolean;

    /**
     * Specify the kind of file uploader button
     * @default "primary"
     */
    kind?: "primary" | "secondary" | "tertiary" | "ghost" | "danger";

    /**
     * Specify the label text
     * @default "Add file"
     */
    labelText?: string;

    /**
     * Specify the label role
     * @default "button"
     */
    role?: string;

    /**
     * Specify `tabindex` attribute
     * @default "0"
     */
    tabindex?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     * @default ""
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };
}

type Files = string[];

export class FileUploaderDropContainer extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the accepted file types
     */
    accept?: string[];

    /**
     * Set to `true` to allow multiple files
     * @default false
     */
    multiple?: boolean;

    /**
     * Override the default behavior of validating uploaded files
     * The default behavior does not validate files
     */
    validateFiles?: (files: Files) => Files;

    /**
     * Specify the label text
     * @default "Add file"
     */
    labelText?: string;

    /**
     * Specify the `role` attribute of the drop container
     * @default "button"
     */
    role?: string;

    /**
     * Set to `true` to disable the input
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify `tabindex` attribute
     * @default "0"
     */
    tabindex?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     * @default ""
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };
}

export class FileUploaderItem extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the file uploader status
     * @default "uploading"
     */
    status?: "uploading" | "edit" | "complete";

    /**
     * Specify the ARIA label used for the status icons
     * @default ""
     */
    iconDescription?: string;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the error subject text
     * @default ""
     */
    errorSubject?: string;

    /**
     * Specify the error body text
     * @default ""
     */
    errorBody?: string;

    /**
     * Set an id for the top-level element
     */
    id?: string;

    /**
     * Specify the file uploader name
     * @default ""
     */
    name?: string;
  };
}

export class FileUploaderSkeleton extends CarbonSvelteComponent {}

export class Filename extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the file name status
     * @default "uploading"
     */
    status?: "uploading" | "edit" | "complete";

    /**
     * Specify the ARIA label used for the status icons
     * @default ""
     */
    iconDescription?: string;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;
  };
}

export class FluidForm extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class Form extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class FormGroup extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Set to `true` to render a form requirement
     * @default false
     */
    message?: boolean;

    /**
     * Specify the message text
     * @default ""
     */
    messageText?: string;

    /**
     * Specify the legend text
     * @default ""
     */
    legendText?: string;
  };

  $$slot_def: { default: {} };
}

export class FormItem extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class FormLabel extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set an id to be used by the label element
     */
    id?: string;
  };

  $$slot_def: { default: {} };
}

export class Grid extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to render a custom HTML element
     * Props are destructured as `props` in the default slot (e.g. <Grid let:props><header {...props}>...</header></Grid>)
     * @default false
     */
    as?: boolean;

    /**
     * Set to `true` to use the condensed variant
     * @default false
     */
    condensed?: boolean;

    /**
     * Set to `true` to use the narrow variant
     * @default false
     */
    narrow?: boolean;

    /**
     * Set to `true` to use the fullWidth variant
     * @default false
     */
    fullWidth?: boolean;

    /**
     * Set to `true` to remove the gutter
     * @default false
     */
    noGutter?: boolean;

    /**
     * Set to `true` to remove the left gutter
     * @default false
     */
    noGutterLeft?: boolean;

    /**
     * Set to `true` to remove the right gutter
     * @default false
     */
    noGutterRight?: boolean;
  };

  $$slot_def: { default: {} };
}

export class Header extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `false` to hide the side nav by default
     * @default true
     */
    expandedByDefault?: boolean;

    /**
     * Set to `true` to open the side nav
     * @default false
     */
    isSideNavOpen?: boolean;

    /**
     * Specify the ARIA label for the header
     */
    uiShellAriaLabel?: string;

    /**
     * Specify the `href` attribute
     */
    href?: string;

    /**
     * Specify the company name
     */
    company?: string;

    /**
     * Specify the platform name
     * Alternatively, use the named slot "platform" (e.g. <span slot="platform">...</span>)
     */
    platformName?: string;

    /**
     * Obtain a reference to the HTML anchor element
     * @default null
     */
    ref?: null | HTMLAnchorElement;
  };

  $$slot_def: { "skip-to-content": {}; platform: {}; default: {} };
}

export class HeaderAction extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to open the panel
     * @default false
     */
    isOpen?: boolean;

    /**
     * Specify the icon props
     */
    icon?: {
      render: typeof import("carbon-icons-svelte/lib/Add16").default;
      skeleton: boolean;
    };

    /**
     * Specify the text
     * Alternatively, use the named slot "text" (e.g. <div slot="text">...</div>)
     */
    text?: string;

    /**
     * Obtain a reference to the button HTML element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };

  $$slot_def: { text: {}; default: {} };
}

export class HeaderActionLink extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the active state
     * @default false
     */
    linkIsActive?: boolean;

    /**
     * Specify the `href` attribute
     */
    href?: string;

    /**
     * Specify the icon props
     */
    icon?: {
      render: typeof import("carbon-icons-svelte/lib/Add16").default;
      skeleton: boolean;
    };

    /**
     * Obtain a reference to the HTML anchor element
     * @default null
     */
    ref?: null | HTMLAnchorElement;
  };
}

export class HeaderActionSearch extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to focus the search
     * @default false
     */
    searchIsActive?: boolean;
  };
}

export class HeaderGlobalAction extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the active variant
     * @default false
     */
    isActive?: boolean;

    /**
     * Specify the icon to render
     */
    icon?: typeof import("carbon-icons-svelte/lib/Add16").default;

    /**
     * Obtain a reference to the HTML button element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };

  $$slot_def: { default: {} };
}

export class HeaderNav extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the ARIA label for the nav
     */
    ariaLabel?: string;
  };

  $$slot_def: { default: {} };
}

export class HeaderNavItem extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the `href` attribute
     */
    href?: string;

    /**
     * Specify the text
     */
    text?: string;

    /**
     * Obtain a reference to the HTML anchor element
     * @default null
     */
    ref?: null | HTMLAnchorElement;
  };
}

export class HeaderNavMenu extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to toggle the expanded state
     * @default false
     */
    expanded?: boolean;

    /**
     * Specify the `href` attribute
     * @default "/"
     */
    href?: string;

    /**
     * Specify the text
     */
    text?: string;

    /**
     * Obtain a reference to the HTML anchor element
     * @default null
     */
    ref?: null | HTMLAnchorElement;

    /**
     * Specify the ARIA label for the chevron icon
     * @default "Expand/Collapse"
     */
    iconDescription?: string;
  };

  $$slot_def: { default: {} };
}

export class HeaderPanelDivider extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class HeaderPanelLink extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the `href` attribute
     */
    href?: string;

    /**
     * Obtain a reference to the HTML anchor element
     * @default null
     */
    ref?: null | HTMLAnchorElement;
  };

  $$slot_def: { default: {} };
}

export class HeaderPanelLinks extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class HeaderUtilities extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class Icon extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the icon from `carbon-icons-svelte` to render
     * Icon size must be 16px (e.g. `Add16`, `Task16`)
     */
    render?: typeof import("carbon-icons-svelte/lib/Add16").default;

    /**
     * Set to `true` to display the skeleton state
     * @default false
     */
    skeleton?: boolean;
  };
}

export class IconSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the size of the icon
     * @default 16
     */
    size?: number;
  };
}

export class InlineLoading extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the loading status
     * @default "active"
     */
    status?: "active" | "inactive" | "finished" | "error";

    /**
     * Set the loading description
     */
    description?: string;

    /**
     * Specify the ARIA label for the loading icon
     */
    iconDescription?: string;

    /**
     * Specify the timeout delay (ms) after `status` is set to "success"
     * @default 1500
     */
    successDelay?: number;
  };
}

export class InlineNotification extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the type of notification
     * @default "inline"
     */
    notificationType?: "toast" | "inline";

    /**
     * Specify the kind of notification
     * @default "error"
     */
    kind?:
      | "error"
      | "info"
      | "info-square"
      | "success"
      | "warning"
      | "warning-alt";

    /**
     * Set to `true` to use the low contrast variant
     * @default false
     */
    lowContrast?: boolean;

    /**
     * Set the timeout duration (ms) to hide the notification after opening it
     * @default 0
     */
    timeout?: number;

    /**
     * Set the `role` attribute
     * @default "alert"
     */
    role?: string;

    /**
     * Specify the title text
     * @default "Title"
     */
    title?: string;

    /**
     * Specify the subtitle text
     * @default ""
     */
    subtitle?: string;

    /**
     * Set to `true` to hide the close button
     * @default false
     */
    hideCloseButton?: boolean;

    /**
     * Specify the ARIA label for the icon
     * @default "Closes notification"
     */
    iconDescription?: string;
  };

  $$slot_def: { default: {}; actions: {} };
}

export class Link extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the href value
     */
    href?: string;

    /**
     * Set to `true` to use the inline variant
     * @default false
     */
    inline?: boolean;

    /**
     * Set to `true` to disable the checkbox
     * @default false
     */
    disabled?: boolean;

    /**
     * Set to `true` to allow visited styles
     * @default false
     */
    visited?: boolean;

    /**
     * Obtain a reference to the top-level HTML element
     * @default null
     */
    ref?: null | HTMLAnchorElement | HTMLParagraphElement;
  };

  $$slot_def: { default: {} };
}

export class ListBox extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the size of the list box
     */
    size?: "sm" | "xl";

    /**
     * Set the type of the list box
     * @default "default"
     */
    type?: "default" | "inline";

    /**
     * Set to `true` to open the list box
     * @default false
     */
    open?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to disable the list box
     * @default false
     */
    disabled?: boolean;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the invalid state text
     * @default ""
     */
    invalidText?: string;
  };

  $$slot_def: { default: {} };
}

type ListBoxFieldTranslationId = "close" | "open";

export class ListBoxField extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to disable the list box field
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the role attribute
     * @default "combobox"
     */
    role?: string;

    /**
     * Specify the tabindex
     * @default "-1"
     */
    tabindex?: string;

    /**
     * Default translation ids
     * @constant
     * @default { close: "close", open: "open" }
     */
    translationIds?: { close: "close"; open: "open" };

    /**
     * Override the default translation ids
     */
    translateWithId?: (id: ListBoxFieldTranslationId) => string;

    /**
     * Set an id for the top-level element
     */
    id?: string;

    /**
     * Obtain a reference to the top-level HTML element
     * @default null
     */
    ref?: null | HTMLElement;
  };

  $$slot_def: { default: {} };
}

export class ListBoxMenu extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set an id for the top-level element
     */
    id?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLDivElement;
  };

  $$slot_def: { default: {} };
}

type ListBoxMenuIconTranslationId = "close" | "open";

export class ListBoxMenuIcon extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to open the list box menu icon
     * @default false
     */
    open?: boolean;

    /**
     * Default translation ids
     * @constant
     * @default { close: "close", open: "open" }
     */
    translationIds?: { close: "close"; open: "open" };

    /**
     * Override the default translation ids
     */
    translateWithId?: (id: ListBoxMenuIconTranslationId) => string;
  };
}

export class ListBoxMenuItem extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to enable the active state
     * @default false
     */
    active?: boolean;

    /**
     * Set to `true` to enable the highlighted state
     * @default false
     */
    highlighted?: boolean;
  };

  $$slot_def: { default: {} };
}

type ListBoxSelectionTranslationId = "clearAll" | "clearSelection";

export class ListBoxSelection extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the number of selected items
     */
    selectionCount?: any;

    /**
     * Set to `true` to disable the list box selection
     * @default false
     */
    disabled?: boolean;

    /**
     * Default translation ids
     * @constant
     * @default {     clearAll: "clearAll",     clearSelection: "clearSelection",   }
     */
    translationIds?: { clearAll: "clearAll"; clearSelection: "clearSelection" };

    /**
     * Override the default translation ids
     */
    translateWithId?: (id: ListBoxSelectionTranslationId) => string;

    /**
     * Obtain a reference to the top-level HTML element
     * @default null
     */
    ref?: null | HTMLElement;
  };
}

export class ListItem extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class Loading extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the small variant
     * @default false
     */
    small?: boolean;

    /**
     * Set to `false` to disable the active state
     * @default true
     */
    active?: boolean;

    /**
     * Set to `false` to disable the overlay
     * @default true
     */
    withOverlay?: boolean;

    /**
     * Specify the label description
     * @default "Active loading indicator"
     */
    description?: string;

    /**
     * Set an id for the label element
     */
    id?: string;
  };
}

export class Modal extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the size of the modal
     */
    size?: "xs" | "sm" | "lg";

    /**
     * Set to `true` to open the modal
     * @default false
     */
    open?: boolean;

    /**
     * Set to `true` to use the danger variant
     * @default false
     */
    danger?: boolean;

    /**
     * Set to `true` to enable alert mode
     * @default false
     */
    alert?: boolean;

    /**
     * Set to `true` to use the passive variant
     * @default false
     */
    passiveModal?: boolean;

    /**
     * Specify the modal heading
     */
    modalHeading?: string;

    /**
     * Specify the modal label
     */
    modalLabel?: string;

    /**
     * Specify the ARIA label for the modal
     */
    modalAriaLabel?: string;

    /**
     * Specify the ARIA label for the close icon
     * @default "Close the modal"
     */
    iconDescription?: string;

    /**
     * Set to `true` if the modal contains form elements
     * @default false
     */
    hasForm?: boolean;

    /**
     * Set to `true` if the modal contains scrolling content
     * @default false
     */
    hasScrollingContent?: boolean;

    /**
     * Specify the primary button text
     * @default ""
     */
    primaryButtonText?: string;

    /**
     * Set to `true` to disable the primary button
     * @default false
     */
    primaryButtonDisabled?: boolean;

    /**
     * Set to `true` for the primary button to be triggered when pressing "Enter"
     * @default true
     */
    shouldSubmitOnEnter?: boolean;

    /**
     * Specify the secondary button text
     * @default ""
     */
    secondaryButtonText?: string;

    /**
     * Specify a selector to be focused when opening the modal
     * @default "[data-modal-primary-focus]"
     */
    selectorPrimaryFocus?: string;

    /**
     * Set to `true` to prevent the modal from closing when clicking outside
     * @default false
     */
    preventCloseOnClickOutside?: boolean;

    /**
     * Set an id for the top-level element
     */
    id?: string;

    /**
     * Obtain a reference to the top-level HTML element
     * @default null
     */
    ref?: null | HTMLElement;
  };

  $$slot_def: { label: {}; heading: {}; default: {} };
}

export class ModalBody extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` if the modal contains form elements
     * @default false
     */
    hasForm?: boolean;

    /**
     * Set to `true` if the modal contains scrolling content
     * @default false
     */
    hasScrollingContent?: boolean;
  };

  $$slot_def: { default: {} };
}

export class ModalFooter extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the primary button text
     * @default ""
     */
    primaryButtonText?: string;

    /**
     * Set to `true` to disable the primary button
     * @default false
     */
    primaryButtonDisabled?: boolean;

    /**
     * Specify a class for the primary button
     */
    primaryClass?: string;

    /**
     * Specify the secondary button text
     * @default ""
     */
    secondaryButtonText?: string;

    /**
     * Specify a class for the secondary button
     */
    secondaryClass?: string;

    /**
     * Set to `true` to use the danger variant
     * @default false
     */
    danger?: boolean;
  };

  $$slot_def: { default: {} };
}

export class ModalHeader extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the modal title
     * @default ""
     */
    title?: string;

    /**
     * Specify the modal label
     * @default ""
     */
    label?: string;

    /**
     * Specify the label class
     * @default ""
     */
    labelClass?: string;

    /**
     * Specify the title class
     * @default ""
     */
    titleClass?: string;

    /**
     * Specify the close class
     * @default ""
     */
    closeClass?: string;

    /**
     * Specify the close icon class
     * @default ""
     */
    closeIconClass?: string;

    /**
     * Specify the ARIA label for the close icon
     * @default "Close"
     */
    iconDescription?: string;
  };

  $$slot_def: { default: {} };
}

type MultiSelectItemId = string;

type MultiSelectItemText = string;

interface MultiSelectItem {
  id: MultiSelectItemId;
  text: MultiSelectItemText;
}

export class MultiSelect extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the multiselect items
     */
    items?: MultiSelectItem[];

    /**
     * Override the display of a multiselect item
     */
    itemToString?: (item: MultiSelectItem) => string;

    /**
     * Set the selected ids
     */
    selectedIds?: MultiSelectItemId[];

    /**
     * Specify the multiselect value
     * @default ""
     */
    value?: string;

    /**
     * Set the size of the combobox
     */
    size?: "sm" | "lg" | "xl";

    /**
     * Specify the type of multiselect
     * @default "default"
     */
    type?: "default" | "inline";

    /**
     * Specify the selection feedback after selecting items
     * @default "top-after-reopen"
     */
    selectionFeedback?: "top" | "fixed" | "top-after-reopen";

    /**
     * Set to `true` to disable the dropdown
     * @default false
     */
    disabled?: boolean;

    /**
     * Set to `true` to filter items
     * @default false
     */
    filterable?: boolean;

    /**
     * Override the filtering logic
     * The default filtering is an exact string comparison
     */
    filterItem?: (item: MultiSelectItem, value: string) => string;

    /**
     * Set to `true` to open the dropdown
     * @default false
     */
    open?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Specify the locale
     * @default "en"
     */
    locale?: string;

    /**
     * Specify the placeholder text
     * @default ""
     */
    placeholder?: string;

    /**
     * Override the sorting logic
     * The default sorting compare the item text value
     */
    sortItem?: (a: MultiSelectItem, b: MultiSelectItem) => MultiSelectItem;

    /**
     * Override the default translation ids
     */
    translateWithId?: (id: any) => string;

    /**
     * Specify the title text
     * @default ""
     */
    titleText?: string;

    /**
     * Set to `true` to pass the item to `itemToString` in the checkbox
     * @default false
     */
    useTitleInItem?: boolean;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the invalid state text
     * @default ""
     */
    invalidText?: string;

    /**
     * Specify the helper text
     * @default ""
     */
    helperText?: string;

    /**
     * Specify the list box label
     * @default ""
     */
    label?: string;

    /**
     * Set an id for the list box component
     */
    id?: string;

    /**
     * Specify a name attribute for the select
     */
    name?: string;
  };
}

export class NotificationActionButton extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class NotificationButton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the type of notification
     * @default "toast"
     */
    notificationType?: "toast" | "inline";

    /**
     * Specify the icon from `carbon-icons-svelte` to render
     */
    renderIcon?: typeof import("carbon-icons-svelte/lib/Add16").default;

    /**
     * Specify the title of the icon
     */
    title?: string;

    /**
     * Specify the ARIA label for the icon
     * @default "Close icon"
     */
    iconDescription?: string;
  };
}

export class NotificationIcon extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the kind of notification icon
     * @default "error"
     */
    kind?:
      | "error"
      | "info"
      | "info-square"
      | "success"
      | "warning"
      | "warning-alt";

    /**
     * Set the type of notification
     * @default "toast"
     */
    notificationType?: "toast" | "inline";

    /**
     * Specify the ARIA label for the icon
     * @default "Closes notification"
     */
    iconDescription?: string;
  };
}

export class NotificationTextDetails extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the type of notification
     * @default "toast"
     */
    notificationType?: "toast" | "inline";

    /**
     * Specify the title text
     * @default "Title"
     */
    title?: string;

    /**
     * Specify the subtitle text
     * @default ""
     */
    subtitle?: string;

    /**
     * Specify the caption text
     * @default "Caption"
     */
    caption?: string;
  };

  $$slot_def: { default: {} };
}

type NumberInputTranslationId = "increment" | "decrement";

export class NumberInput extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the size of the input
     */
    size?: "sm" | "xl";

    /**
     * Specify the input value
     * @default ""
     */
    value?: string;

    /**
     * Specify the step increment
     * @default 1
     */
    step?: number;

    /**
     * Specify the maximum value
     */
    max?: number;

    /**
     * Specify the minimum value
     */
    min?: number;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` for the input to be read-only
     * @default false
     */
    readonly?: boolean;

    /**
     * Set to `true` to enable the mobile variant
     * @default false
     */
    mobile?: boolean;

    /**
     * Set to `true` to allow for an empty value
     * @default false
     */
    allowEmpty?: boolean;

    /**
     * Set to `true` to disable the input
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the ARIA label for the increment icons
     * @default ""
     */
    iconDescription?: string;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the invalid state text
     * @default ""
     */
    invalidText?: string;

    /**
     * Specify the helper text
     * @default ""
     */
    helperText?: string;

    /**
     * Specify the label text
     * @default ""
     */
    label?: string;

    /**
     * Set to `true` to visually hide the label text
     * @default false
     */
    hideLabel?: boolean;

    /**
     * Override the default translation ids
     */
    translateWithId?: (id: NumberInputTranslationId) => string;

    /**
     * Default translation ids
     * @constant
     * @default {     increment: "increment",     decrement: "decrement",   }
     */
    translationIds?: { increment: "increment"; decrement: "decrement" };

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };

  $$slot_def: { label: {} };
}

export class NumberInputSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to hide the label text
     * @default false
     */
    hideLabel?: boolean;
  };
}

export class OrderedList extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the nested variant
     * @default false
     */
    nested?: boolean;
  };

  $$slot_def: { default: {} };
}

export class OverflowMenu extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the direction of the overflow menu relative to the button
     * @default "bottom"
     */
    direction?: "top" | "bottom";

    /**
     * Set to `true` to open the menu
     * @default false
     */
    open?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to flip the menu relative to the button
     * @default false
     */
    flipped?: boolean;

    /**
     * Specify the menu options class
     */
    menuOptionsClass?: string;

    /**
     * Specify the icon from `carbon-icons-svelte` to render
     */
    icon?: typeof import("carbon-icons-svelte/lib/Add16").default;

    /**
     * Specify the icon class
     */
    iconClass?: string;

    /**
     * Specify the ARIA label for the icon
     * @default "Open and close list of options"
     */
    iconDescription?: string;

    /**
     * Set an id for the button element
     */
    id?: string;
  };

  $$slot_def: { menu: {}; default: {} };
}

export class OverflowMenuItem extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the item text
     * Alternatively, use the default slot for a custom element
     * @default "Provide text"
     */
    text?: string;

    /**
     * Specify the `href` attribute if the item is a link
     * @default ""
     */
    href?: string;

    /**
     * Set to `true` if the item should be focused when opening the menu
     * @default false
     */
    primaryFocus?: boolean;

    /**
     * Set to `true` to disable the item
     * @default false
     */
    disabled?: boolean;

    /**
     * Set to `true` to include a divider
     * @default false
     */
    hasDivider?: boolean;

    /**
     * Set to `true` to use the danger variant
     * @default false
     */
    danger?: boolean;

    /**
     * Set to `false` to omit the button `title` attribute
     * @default true
     */
    requireTitle?: boolean;

    /**
     * Set an id for the top-level element
     */
    id?: string;

    /**
     * Obtain a reference to the HTML element
     * @default null
     */
    ref?: null | HTMLAnchorElement | HTMLButtonElement;
  };

  $$slot_def: { default: {} };
}

export class Pagination extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the current page index
     * @default 1
     */
    page?: number;

    /**
     * Specify the total number of items
     * @default 0
     */
    totalItems?: number;

    /**
     * Set to `true` to disable the pagination
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the forward button text
     * @default "Next page"
     */
    forwardText?: string;

    /**
     * Specify the backward button text
     * @default "Previous page"
     */
    backwardText?: string;

    /**
     * Specify the items per page text
     * @default "Items per page:"
     */
    itemsPerPageText?: string;

    /**
     * Override the item text
     */
    itemText?: (min: number, max: number) => string;

    /**
     * Override the item range text
     */
    itemRangeText?: (min: number, max: number, total: number) => string;

    /**
     * Set to `true` to disable the page input
     * @default false
     */
    pageInputDisabled?: boolean;

    /**
     * Set to `true` to disable the page size input
     * @default false
     */
    pageSizeInputDisabled?: boolean;

    /**
     * Specify the number of items to display in a page
     * @default 10
     */
    pageSize?: number;

    /**
     * Specify the available page sizes
     */
    pageSizes?: number[];

    /**
     * Set to `true` if the number of pages is unknown
     * @default false
     */
    pagesUnknown?: boolean;

    /**
     * Override the page text
     */
    pageText?: (page: number) => string;

    /**
     * Override the page range text
     */
    pageRangeText?: (current: number, total: number) => string;

    /**
     * Set an id for the top-level element
     */
    id?: string;
  };
}

export class PaginationNav extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the current page index
     * @default 0
     */
    page?: number;

    /**
     * Specify the total number of pages
     * @default 10
     */
    total?: number;

    /**
     * Specify the total number of pages to show
     * @default 10
     */
    shown?: number;

    /**
     * Set to `true` to loop the navigation
     * @default false
     */
    loop?: boolean;

    /**
     * Specify the forward button text
     * @default "Next page"
     */
    forwardText?: string;

    /**
     * Specify the backward button text
     * @default "Previous page"
     */
    backwardText?: string;
  };
}

export class PaginationSkeleton extends CarbonSvelteComponent {}

export class PasswordInput extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the size of the input
     */
    size?: "sm" | "xl";

    /**
     * Specify the input value
     * @default ""
     */
    value?: string;

    /**
     * Specify the input type
     * @default "password"
     */
    type?: string;

    /**
     * Specify the placeholder text
     * @default ""
     */
    placeholder?: string;

    /**
     * Specify the hide password label text
     * @default "Hide password"
     */
    hidePasswordLabel?: string;

    /**
     * Specify the show password label text
     * @default "Show password"
     */
    showPasswordLabel?: string;

    /**
     * Set the alignment of the tooltip relative to the icon
     */
    tooltipAlignment?: "start" | "center" | "end";

    /**
     * Set the position of the tooltip relative to the icon
     */
    tooltipPosition?: "top" | "right" | "bottom" | "left";

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to disable the input
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the helper text
     * @default ""
     */
    helperText?: string;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set to `true` to visually hide the label text
     * @default false
     */
    hideLabel?: boolean;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the text for the invalid state
     * @default ""
     */
    invalidText?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };
}

export class ProgressIndicator extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the current step index
     * @default 0
     */
    currentIndex?: number;

    /**
     * Set to `true` to use the vertical variant
     * @default false
     */
    vertical?: boolean;

    /**
     * Set to `true` to specify whether the progress steps should be split equally in size in the div
     * @default false
     */
    spaceEqually?: boolean;
  };

  $$slot_def: { default: {} };
}

export class ProgressIndicatorSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the vertical variant
     * @default false
     */
    vertical?: boolean;
  };
}

export class ProgressStep extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` for the complete variant
     * @default false
     */
    complete?: boolean;

    /**
     * Set to `true` to use the current variant
     * @default false
     */
    current?: boolean;

    /**
     * Set to `true` to disable the progress step
     * @default false
     */
    disabled?: boolean;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the step description
     * @default ""
     */
    description?: string;

    /**
     * Specify the step label
     * @default ""
     */
    label?: string;

    /**
     * Specify the step secondary label
     * @default ""
     */
    secondaryLabel?: string;

    /**
     * Set an id for the top-level element
     */
    id?: string;
  };

  $$slot_def: { default: { props: any } };
}

export class RadioButton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the value of the radio button
     * @default ""
     */
    value?: string;

    /**
     * Set to `true` to check the radio button
     * @default false
     */
    checked?: boolean;

    /**
     * Set to `true` to disable the radio button
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the label position
     * @default "right"
     */
    labelPosition?: "right" | "left";

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set to `true` to visually hide the label text
     * @default false
     */
    hideLabel?: boolean;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the checkbox input
     * @default ""
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };
}

export class RadioButtonGroup extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the selected radio button value
     */
    selected?: string;

    /**
     * Set to `true` to disable the radio buttons
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the label position
     * @default "right"
     */
    labelPosition?: "right" | "left";

    /**
     * Specify the orientation of the radio buttons
     * @default "horizontal"
     */
    orientation?: "horizontal" | "vertical";

    /**
     * Set an id for the container div element
     */
    id?: string;
  };

  $$slot_def: { default: {} };
}

export class RadioButtonSkeleton extends CarbonSvelteComponent {}

export class RadioTile extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to check the tile
     * @default false
     */
    checked?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Specify the value of the radio input
     * @default ""
     */
    value?: string;

    /**
     * Specify the tabindex
     * @default "0"
     */
    tabindex?: string;

    /**
     * Specify the ARIA label for the radio tile checkmark icon
     * @default "Tile checkmark"
     */
    iconDescription?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     * @default ""
     */
    name?: string;
  };

  $$slot_def: { default: {} };
}

export class Row extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to render a custom HTML element
     * Props are destructured as `props` in the default slot (e.g. <Row let:props><section {...props}>...</section></Row>)
     * @default false
     */
    as?: boolean;

    /**
     * Set to `true` to use the condensed variant
     * @default false
     */
    condensed?: boolean;

    /**
     * Set to `true` to use the narrow variant
     * @default false
     */
    narrow?: boolean;

    /**
     * Set to `true` to remove the gutter
     * @default false
     */
    noGutter?: boolean;

    /**
     * Set to `true` to remove the left gutter
     * @default false
     */
    noGutterLeft?: boolean;

    /**
     * Set to `true` to remove the right gutter
     * @default false
     */
    noGutterRight?: boolean;
  };

  $$slot_def: { default: {} };
}

export class Search extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the small variant
     * @default false
     */
    small?: boolean;

    /**
     * Specify the size of the search input
     */
    size?: "sm" | "lg";

    /**
     * Set to `true` to display the skeleton state
     * @default false
     */
    skeleton?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to disable the search input
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the value of the search input
     * @default ""
     */
    value?: string;

    /**
     * Specify the `type` attribute of the search input
     * @default "text"
     */
    type?: string;

    /**
     * Specify the `placeholder` attribute of the search input
     * @default "Search..."
     */
    placeholder?: string;

    /**
     * Specify the `autocomplete` attribute
     * @default "off"
     */
    autocomplete?: "on" | "off";

    /**
     * Set to `true` to auto focus the search element
     * @default false
     */
    autofocus?: boolean;

    /**
     * Specify the close button label text
     * @default "Clear search input"
     */
    closeButtonLabelText?: string;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };
}

export class SearchSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the small variant
     * @default false
     */
    small?: boolean;
  };
}

export class Select extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the selected item value
     */
    selected?: string;

    /**
     * Set the size of the select input
     */
    size?: "sm" | "xl";

    /**
     * Set to `true` to use the inline variant
     * @default false
     */
    inline?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to disable the select element
     * @default false
     */
    disabled?: boolean;

    /**
     * Set an id for the select element
     */
    id?: string;

    /**
     * Specify a name attribute for the select element
     */
    name?: string;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the invalid state text
     * @default ""
     */
    invalidText?: string;

    /**
     * Specify the helper text
     * @default ""
     */
    helperText?: string;

    /**
     * Set to `true` to not render a label
     * @default false
     */
    noLabel?: boolean;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set to `true` to visually hide the label text
     * @default false
     */
    hideLabel?: boolean;

    /**
     * Obtain a reference to the select HTML element
     * @default null
     */
    ref?: null | HTMLSelectElement;
  };

  $$slot_def: { default: {} };
}

export class SelectItem extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the option value
     * @default ""
     */
    value?: string;

    /**
     * Specify the option text
     * @default ""
     */
    text?: string;

    /**
     * Set to `true` to hide the option
     * @default false
     */
    hidden?: boolean;

    /**
     * Set to `true` to disable the option
     * @default false
     */
    disabled?: boolean;
  };
}

export class SelectItemGroup extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to disable the optgroup element
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the label attribute of the optgroup element
     * @default "Provide label"
     */
    label?: string;
  };

  $$slot_def: { default: {} };
}

export class SelectSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to hide the label text
     * @default false
     */
    hideLabel?: boolean;
  };
}

export class SelectableTile extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to select the tile
     * @default false
     */
    selected?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Specify the title of the selectable tile
     * @default "title"
     */
    title?: string;

    /**
     * Specify the value of the selectable tile
     * @default "value"
     */
    value?: string;

    /**
     * Specify the tabindex
     * @default "0"
     */
    tabindex?: string;

    /**
     * Specify the ARIA label for the selectable tile checkmark icon
     * @default "Tile checkmark"
     */
    iconDescription?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     * @default ""
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };

  $$slot_def: { default: {} };
}

export class SideNav extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the fixed variant
     * @default false
     */
    fixed?: boolean;

    /**
     * Specify the ARIA label for the nav
     */
    ariaLabel?: string;

    /**
     * Set to `true` to toggle the expanded state
     * @default false
     */
    isOpen?: boolean;
  };

  $$slot_def: { default: {} };
}

export class SideNavItems extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class SideNavLink extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to select the current link
     * @default false
     */
    isSelected?: boolean;

    /**
     * Specify the `href` attribute
     */
    href?: string;

    /**
     * Specify the text
     */
    text?: string;

    /**
     * Specify the icon props
     */
    icon?: {
      render: typeof import("carbon-icons-svelte/lib/Add16").default;
      skeleton: boolean;
    };

    /**
     * Obtain a reference to the HTML anchor element
     * @default null
     */
    ref?: null | HTMLAnchorElement;
  };
}

export class SideNavMenu extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to toggle the expanded state
     * @default false
     */
    expanded?: boolean;

    /**
     * Specify the text
     */
    text?: string;

    /**
     * Specify the icon props
     */
    icon?: {
      render: typeof import("carbon-icons-svelte/lib/Add16").default;
      skeleton: boolean;
    };

    /**
     * Obtain a reference to the HTML button element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };

  $$slot_def: { default: {} };
}

export class SideNavMenuItem extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to select the item
     */
    isSelected?: boolean;

    /**
     * Specify the `href` attribute
     */
    href?: string;

    /**
     * Specify the item text
     */
    text?: string;

    /**
     * Obtain a reference to the HTML anchor element
     * @default null
     */
    ref?: null | HTMLAnchorElement;
  };
}

export class SkeletonPlaceholder extends CarbonSvelteComponent {}

export class SkeletonText extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the number of lines to render
     * @default 3
     */
    lines?: number;

    /**
     * Set to `true` to use the heading size variant
     * @default false
     */
    heading?: boolean;

    /**
     * Set to `true` to use the paragraph size variant
     * @default false
     */
    paragraph?: boolean;

    /**
     * Specify the width of the text (% or px)
     * @default "100%"
     */
    width?: string;
  };
}

export class SkipToContent extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the `href` attribute
     * @default "#main-content"
     */
    href?: string;

    /**
     * Specify the tabindex
     * @default "0"
     */
    tabindex?: string;
  };

  $$slot_def: { default: {} };
}

export class Slider extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the value of the slider
     * @default 0
     */
    value?: number;

    /**
     * Set the maximum slider value
     * @default 100
     */
    max?: number;

    /**
     * Specify the label for the max value
     * @default ""
     */
    maxLabel?: string;

    /**
     * Set the minimum slider value
     * @default 0
     */
    min?: number;

    /**
     * Specify the label for the min value
     * @default ""
     */
    minLabel?: string;

    /**
     * Set the step value
     * @default 1
     */
    step?: number;

    /**
     * Set the step multiplier value
     * @default 4
     */
    stepMultiplier?: number;

    /**
     * Set to `true` to require a value
     * @default false
     */
    required?: boolean;

    /**
     * Specify the input type
     * @default "number"
     */
    inputType?: string;

    /**
     * Set to `true` to disable the slider
     * @default false
     */
    disabled?: boolean;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to hide the text input
     * @default false
     */
    hideTextInput?: boolean;

    /**
     * Set an id for the slider div element
     */
    id?: string;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set a name for the slider element
     * @default ""
     */
    name?: string;

    /**
     * Obtain a reference to the HTML element
     * @default null
     */
    ref?: null | HTMLElement;
  };
}

export class SliderSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to hide the label text
     * @default false
     */
    hideLabel?: boolean;
  };
}

export class StructuredList extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the selected structured list row value
     */
    selected?: string;

    /**
     * Set to `true` to use the bordered variant
     * @default false
     */
    border?: boolean;

    /**
     * Set to `true` to use the selection variant
     * @default false
     */
    selection?: boolean;
  };

  $$slot_def: { default: {} };
}

export class StructuredListBody extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class StructuredListCell extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use as a header
     * @default false
     */
    head?: boolean;

    /**
     * Set to `true` to prevent wrapping
     * @default false
     */
    noWrap?: boolean;
  };

  $$slot_def: { default: {} };
}

export class StructuredListHead extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class StructuredListInput extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to check the input
     * @default false
     */
    checked?: boolean;

    /**
     * Specify the title of the input
     * @default "title"
     */
    title?: string;

    /**
     * Specify the value of the input
     * @default "value"
     */
    value?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     * @default ""
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };
}

export class StructuredListRow extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use as a header
     * @default false
     */
    head?: boolean;

    /**
     * Set to `true` to render a label slot
     * @default false
     */
    label?: boolean;

    /**
     * Specify the tabindex
     * @default "0"
     */
    tabindex?: string;
  };

  $$slot_def: { default: {} };
}

export class StructuredListSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the number of rows
     * @default 5
     */
    rows?: number;

    /**
     * Set to `true` to use the bordered variant
     * @default false
     */
    border?: boolean;
  };
}

export class Switch extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the switch text
     * Alternatively, use the named slot "text" (e.g. <span slot="text">...</span>)
     * @default "Provide text"
     */
    text?: string;

    /**
     * Set to `true` for the switch to be selected
     * @default false
     */
    selected?: boolean;

    /**
     * Set to `true` to disable the switch
     * @default false
     */
    disabled?: boolean;

    /**
     * Set an id for the button element
     */
    id?: string;

    /**
     * Obtain a reference to the button HTML element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };

  $$slot_def: { default: {} };
}

export class Tab extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the tab label
     * Alternatively, use the default slot (e.g. <Tab><span>Label</span></Tab>)
     * @default ""
     */
    label?: string;

    /**
     * Specify the href attribute
     * @default "#"
     */
    href?: string;

    /**
     * Set to `true` to disable the tab
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the tabindex
     * @default "0"
     */
    tabindex?: string;

    /**
     * Set an id for the top-level element
     */
    id?: string;

    /**
     * Obtain a reference to the anchor HTML element
     * @default null
     */
    ref?: null | HTMLAnchorElement;
  };

  $$slot_def: { default: {} };
}

export class TabContent extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set an id for the top-level element
     */
    id?: string;
  };

  $$slot_def: { default: {} };
}

export class Table extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the size of the table
     */
    size?: "compact" | "short" | "tall";

    /**
     * Set to `true` to use zebra styles
     * @default false
     */
    zebra?: boolean;

    /**
     * Set to `true` to use static width
     * @default false
     */
    useStaticWidth?: boolean;

    /**
     * Set to `true` for the bordered variant
     * @default false
     */
    shouldShowBorder?: boolean;

    /**
     * Set to `true` for the sortable variant
     * @default false
     */
    sortable?: boolean;

    /**
     * Set to `true` to enable a sticky header
     * @default false
     */
    stickyHeader?: boolean;
  };

  $$slot_def: { default: {} };
}

export class TableBody extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class TableCell extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class TableContainer extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the title of the data table
     * @default ""
     */
    title?: string;

    /**
     * Specify the description of the data table
     * @default ""
     */
    description?: string;

    /**
     * Set to `true` to enable a sticky header
     * @default false
     */
    stickyHeader?: boolean;
  };

  $$slot_def: { default: {} };
}

export class TableHead extends CarbonSvelteComponent {
  $$slot_def: { default: {} };
}

export class TableHeader extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the `scope` attribute
     * @default "col"
     */
    scope?: string;

    /**
     * Override the default id translations
     */
    translateWithId?: () => string;

    /**
     * Set an id for the top-level element
     */
    id?: string;
  };

  $$slot_def: { default: {} };
}

export class TableRow extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to select the row
     * @default false
     */
    isSelected?: boolean;
  };

  $$slot_def: { default: {} };
}

export class Tabs extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the selected tab index
     * @default 0
     */
    selected?: number;

    /**
     * Specify the type of tabs
     * @default "default"
     */
    type?: "default" | "container";

    /**
     * Specify the ARIA label for the chevron icon
     * @default "Show menu options"
     */
    iconDescription?: string;

    /**
     * Specify the tab trigger href attribute
     * @default "#"
     */
    triggerHref?: string;
  };

  $$slot_def: { default: {}; content: {} };
}

export class TabsSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the number of tabs to render
     * @default 4
     */
    count?: number;
  };
}

export class Tag extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the type of tag
     */
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

    /**
     * Set to `true` to use filterable variant
     * @default false
     */
    filter?: boolean;

    /**
     * Set to `true` to disable a filterable tag
     * @default false
     */
    disabled?: boolean;

    /**
     * Set to `true` to display the skeleton state
     * @default false
     */
    skeleton?: boolean;

    /**
     * Set the title for the close button in a filterable tag
     * @default "Clear filter"
     */
    title?: string;

    /**
     * Set an id for the filterable tag
     */
    id?: string;
  };

  $$slot_def: { default: {} };
}

export class TagSkeleton extends CarbonSvelteComponent {}

export class TextArea extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the textarea value
     * @default ""
     */
    value?: string;

    /**
     * Specify the placeholder text
     * @default ""
     */
    placeholder?: string;

    /**
     * Specify the number of cols
     * @default 50
     */
    cols?: number;

    /**
     * Specify the number of rows
     * @default 4
     */
    rows?: number;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to disable the input
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the helper text
     * @default ""
     */
    helperText?: string;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set to `true` to visually hide the label text
     * @default false
     */
    hideLabel?: boolean;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the text for the invalid state
     * @default ""
     */
    invalidText?: string;

    /**
     * Set an id for the textarea element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     */
    name?: string;

    /**
     * Obtain a reference to the textarea HTML element
     * @default null
     */
    ref?: null | HTMLTextAreaElement;
  };
}

export class TextAreaSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to visually hide the label text
     * @default false
     */
    hideLabel?: boolean;
  };
}

export class TextInput extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the size of the input
     */
    size?: "sm" | "xl";

    /**
     * Specify the input value
     * @default ""
     */
    value?: string;

    /**
     * Specify the input type
     * @default ""
     */
    type?: string;

    /**
     * Specify the placeholder text
     * @default ""
     */
    placeholder?: string;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to disable the input
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the helper text
     * @default ""
     */
    helperText?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     */
    name?: string;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set to `true` to visually hide the label text
     * @default false
     */
    hideLabel?: boolean;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the invalid state text
     * @default ""
     */
    invalidText?: string;

    /**
     * Set to `true` to indicate an warning state
     * @default false
     */
    warn?: boolean;

    /**
     * Specify the warning state text
     * @default ""
     */
    warnText?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;

    /**
     * Set to `true` to mark the field as required
     * @default false
     */
    required?: boolean;

    /**
     * Set to `true` to use inline version
     * @default false
     */
    inline?: boolean;
  };
}

export class TextInputSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to hide the label text
     * @default false
     */
    hideLabel?: boolean;
  };
}

export class Tile extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;
  };

  $$slot_def: { default: {} };
}

export class TileGroup extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the selected tile value
     */
    selected?: string;

    /**
     * Set to `true` to disable the tile group
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the legend text
     * @default ""
     */
    legend?: string;
  };

  $$slot_def: { default: {} };
}

export class TimePicker extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the input value
     * @default ""
     */
    value?: string;

    /**
     * Specify the input type
     * @default "text"
     */
    type?: string;

    /**
     * Specify the input placeholder text
     * @default "hh=mm"
     */
    placeholder?: string;

    /**
     * Specify the `pattern` attribute for the input element
     * @default "(1[012]|[1-9]):[0-5][0-9](\\s)?"
     */
    pattern?: string;

    /**
     * Specify the `maxlength` input attribute
     * @default 5
     */
    maxlength?: number;

    /**
     * Set to `true` to enable the light variant
     * @default false
     */
    light?: boolean;

    /**
     * Set to `true` to disable the input
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set to `true` to visually hide the label text
     * @default false
     */
    hideLabel?: boolean;

    /**
     * Set to `true` to indicate an invalid state
     * @default false
     */
    invalid?: boolean;

    /**
     * Specify the invalid state text
     * @default ""
     */
    invalidText?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };

  $$slot_def: { default: {} };
}

export class TimePickerSelect extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the select value
     * @default ""
     */
    value?: string;

    /**
     * Set to `true` to disable the select
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the ARIA label for the chevron icon
     * @default "Open list of options"
     */
    iconDescription?: string;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     *
     * @default true
     */
    hideLabel?: boolean;

    /**
     * Set an id for the select element
     */
    id?: string;

    /**
     * Specify a name attribute for the select element
     */
    name?: string;

    /**
     * Obtain a reference to the select HTML element
     * @default null
     */
    ref?: null | HTMLSelectElement;
  };

  $$slot_def: { default: {} };
}

export class ToastNotification extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the type of notification
     * @default "toast"
     */
    notificationType?: "toast" | "inline";

    /**
     * Specify the kind of notification
     * @default "error"
     */
    kind?:
      | "error"
      | "info"
      | "info-square"
      | "success"
      | "warning"
      | "warning-alt";

    /**
     * Set to `true` to use the low contrast variant
     * @default false
     */
    lowContrast?: boolean;

    /**
     * Set the timeout duration (ms) to hide the notification after opening it
     * @default 0
     */
    timeout?: number;

    /**
     * Set the `role` attribute
     * @default "alert"
     */
    role?: string;

    /**
     * Specify the title text
     * @default "Title"
     */
    title?: string;

    /**
     * Specify the subtitle text
     * @default ""
     */
    subtitle?: string;

    /**
     * Specify the caption text
     * @default "Caption"
     */
    caption?: string;

    /**
     * Specify the ARIA label for the icon
     * @default "Closes notification"
     */
    iconDescription?: string;

    /**
     * Set to `true` to hide the close button
     * @default false
     */
    hideCloseButton?: boolean;
  };

  $$slot_def: { default: {} };
}

export class Toggle extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to toggle the checkbox input
     * @default false
     */
    toggled?: boolean;

    /**
     * Set to `true` to disable checkbox input
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the label for the untoggled state
     * @default "Off"
     */
    labelA?: string;

    /**
     * Specify the label for the toggled state
     * @default "On"
     */
    labelB?: string;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the checkbox input
     */
    name?: string;
  };
}

export class ToggleSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set an id for the input element
     */
    id?: string;
  };
}

export class ToggleSmall extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to toggle the checkbox input
     * @default false
     */
    toggled?: boolean;

    /**
     * Set to `true` to disable checkbox input
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the label for the untoggled state
     * @default "Off"
     */
    labelA?: string;

    /**
     * Specify the label for the toggled state
     * @default "On"
     */
    labelB?: string;

    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the checkbox input
     */
    name?: string;
  };
}

export class ToggleSmallSkeleton extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the label text
     * @default ""
     */
    labelText?: string;

    /**
     * Set an id for the input element
     */
    id?: string;
  };
}

export class Tooltip extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set the direction of the tooltip relative to the button
     * @default "bottom"
     */
    direction?: "top" | "right" | "bottom" | "left";

    /**
     * Set to `true` to open the tooltip
     * @default false
     */
    open?: boolean;

    /**
     * Set to `true` to hide the tooltip icon
     * @default false
     */
    hideIcon?: boolean;

    /**
     * Specify the icon from `carbon-icons-svelte` to render for the tooltip button
     * Icon size must be 16px (e.g. `Add16`, `Task16`)
     */
    icon?: typeof import("carbon-icons-svelte/lib/Add16").default;

    /**
     * Specify the ARIA label for the tooltip button
     * @default ""
     */
    iconDescription?: string;

    /**
     * Specify the icon name attribute
     * @default ""
     */
    iconName?: string;

    /**
     * Set the button tabindex
     * @default "0"
     */
    tabindex?: string;

    /**
     * Set an id for the tooltip
     */
    tooltipId?: string;

    /**
     * Set an id for the tooltip button
     */
    triggerId?: string;

    /**
     * Set the tooltip button text
     * @default ""
     */
    triggerText?: string;

    /**
     * Obtain a reference to the trigger text HTML element
     * @default null
     */
    ref?: null | HTMLElement;

    /**
     * Obtain a reference to the tooltip HTML element
     * @default null
     */
    refTooltip?: null | HTMLElement;

    /**
     * Obtain a reference to the icon HTML element
     * @default null
     */
    refIcon?: null | HTMLElement;
  };

  $$slot_def: { triggerText: {}; icon: {}; default: {} };
}

export class TooltipDefinition extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the tooltip text
     * @default ""
     */
    tooltipText?: string;

    /**
     * Set the alignment of the tooltip relative to the icon
     * @default "center"
     */
    align?: "start" | "center" | "end";

    /**
     * Set the direction of the tooltip relative to the icon
     * @default "bottom"
     */
    direction?: "top" | "bottom";

    /**
     * Set an id for the tooltip div element
     */
    id?: string;

    /**
     * Obtain a reference to the button HTML element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };

  $$slot_def: { default: {} };
}

export class TooltipIcon extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Specify the tooltip text
     * @default ""
     */
    tooltipText?: string;

    /**
     * Set the alignment of the tooltip relative to the icon
     * @default "center"
     */
    align?: "start" | "center" | "end";

    /**
     * Set the direction of the tooltip relative to the icon
     * @default "bottom"
     */
    direction?: "top" | "right" | "bottom" | "left";

    /**
     * Set an id for the span element
     */
    id?: string;

    /**
     * Obtain a reference to the button HTML element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };

  $$slot_def: { default: {} };
}

export class UnorderedList extends CarbonSvelteComponent {
  $$prop_def: {
    /**
     * Set to `true` to use the nested variant
     * @default false
     */
    nested?: boolean;
  };

  $$slot_def: { default: {} };
}
