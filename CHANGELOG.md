# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## Unreleased -->

## [0.62.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.62.3) - 2022-03-26

**Fixes**

- fix `TreeView` filter logic in expandNodes/collapseNodes
- correctly render slotted label in `NumberInput`
- only render expandable `DataTable` row content when expanded

## [0.62.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.62.2) - 2022-03-23

**Fixes**

- `DataTable` expandable variant should work with zebra styles
- `DatePicker` `flatpickrProps` should override default `flatpickr` options

**Documentation**

- add `DataTable` "Expandable (zebra styles)" example

## [0.62.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.62.1) - 2022-03-20

**Fixes**

- fix `ToolbarSearch` standalone usage where "DataTable" context can be undefined

## [0.62.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.62.0) - 2022-03-19

**Breaking Changes**

- remove `Copy` component
- do not prevent default submit behavior in `Form`

**Features**

- add `shouldFilterRows` prop to `ToolbarSearch` to support auto-filterable `DataTable` rows
- make `SideNavLink` text slottable
- make `icon` prop slottable in `ContextMenuOption`, `Link`, `Tag`, `HeaderAction`, `HeaderActionLink`, `SideNavLink`, `SideNavMenu`
- make `MultiSelect` slottable
- make `Dropdown` slottable
- make `ComboBox` slottable

**Fixes**

- stop click propagation on `HeaderAction` button

**Refactor**

- inline `Copy` component in `CopyButton`, `CodeSnippet`
- use native `bind:value` in `Search`
- use native `bind:value` in `TextArea`

**Documentation**

- add `DataTable` "Filterable" and "Filterable (custom)" examples
- add `MultiSelect` "Custom slot" example
- add `Dropdown` "Custom slot" example
- add `ComboBox` "Custom slot" example
- add note that `items` object in `ComboBox`, `Dropdown`, `MultiSelect` requires a unique `id`
- add `ClickableTile` "Prevent default behavior" example
- add `Form` "Prevent default behavior" example
- fix broken link in `Checkbox` docs

## [0.61.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.61.1) - 2022-03-13

**Fixes**

- do not generate CSS file from `css/_popover.scss`

## [0.61.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.61.0) - 2022-03-13

**Breaking Changes**

- remove `HeaderActionSlideTransition` interface from `HeaderAction`; type transition prop as `SlideParams`
- rename `Breakpoint` "on:match" event to "on:change"
- move `Breakpoint` breakpoints to `carbon-components-svelte/src/Breakpoint/breakpoints`

**Features**

- support `DataTable` non-selectable rows
- expose `MultiSelect` highlightedId as a prop
- add `breakpointObserver` store as an alternative to `Breakpoint`

**Fixes**

- audit `HeaderAction` text styles
- visually align `HeaderActionLink` icon with `HeaderAction` icon
- fix `MultiSelect` filterable selection error
- correctly type `FileUploaderDropContainer` validateFiles prop
- inline `Popover` SCSS from `carbon-components@10.47`

**Refactor**

- remove usage of deprecated `Icon` component
- use direct component imports where possible

**Documentation**

- add `DataTable` "Non-selectable rows" example
- add `OverflowMenu` "Disabled items" example
- add `Breakpoint` "Store and Breakpoint Values" example

## [0.60.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.60.0) - 2022-02-26

**Features**

- add `RadioButtonGroup` `hiddenLegend` prop to visually hide the legend
- add `ProgressBar` `size` prop to support small size variant

**Fixes**

- update `DatePicker` calendar instance if options change

**Refactor**

- remove `StructuredList` `overflow-y` style monkey patch

**Documentation**

- add `RadioButton` "Hidden legend" example
- add `ProgressBar` "Small size" example

**Housekeeping**

- upgrade `carbon-components` to v10.54.0

## [0.59.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.59.0) - 2022-02-21

**Features**

- add `maxCount` prop to `TextArea`
- add `disabled` prop to `FileUploader`
- add `files` prop to `FileUploaderDropContainer`
- add `files` prop to `FileUploaderButton`

**Fixes**

- change `add`, `change` events in `FileUploaderDropContainer` to dispatch `File[]` instead of `FileList`
- update `files` prop description in `FileUploader`

**Documentation**

- add `TextArea` "Maximum character count" example
- add `FileUploader` disabled state example
- add `FileUploader` "Clear files" example
- document `validateFiles` prop for `FileUploaderDropContainer`
- add descriptions for `FileUploaderButton`, `FileUploader` examples

**Housekeeping**

- upgrade `carbon-components` to v10.53.0

## [0.58.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.58.4) - 2022-02-21

**Fixes**

- dispatched events without a `detail` type should be `null` instead of `any`
- `FileUploader` `clearFiles` description should reflect that it's an accessor, not a prop
- `FileUploader` should correctly fire `add` and `remove` events
- `FileUploader` files should not be keyed by file name
- `FileUploader` change event detail signature should be `File[]`
- fix `DataTable` regression where sort icon indicators don't update

**Refactor**

- remove unnecessary JSDoc default type notation

## [0.58.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.58.3) - 2022-02-20

**Fixes**

- correctly set deprecation comments for deprecated components
- `TextInput` and `PasswordInput` should render label if "labelText" slot is used
- `PasswordInput` should not render `label` if no `labelText` is provided
- `StructuredList` overflow-y should not be "hidden"
- `MultiSelect` should not prevent default key behavior when open
- `Switch` should have `type="button"`

## [0.58.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.58.2) - 2022-02-12

**Fixes**

- `Tooltip` `aria-label` should use `iconDescription` if `triggerText` is falsy
- `OverflowMenu` keyboard navigation should skip disabled items
- UI Shell `HeaderPanelDivider` should use `hr` element to represent divider
- `Button` should not set `aria-pressed` on icon-only, link buttons

## [0.58.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.58.1) - 2022-02-11

**Fixes**

- remove whitespace from `pre` tag in `CodeSnippet` (Svelte v3.46.4 preserves `pre` whitespace by default)

## [0.58.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.58.0) - 2022-02-11

**Breaking Changes**

- if `TextInput` is `type="number"`, value can be a `number` or `null` to signify "no value"
- `TextInput` dispatches instead of forwards `input`, `change` events (detail: `null | number | string`)

**Features**

- pass `rowIndex`, `cellIndex` to `DataTable` "cell" slot
- add `itemToInput` prop to `MultiSelect` to customize name, title, labelText values
- add `open` prop to `TooltipDefinition`; dispatch `open`, `close` events

**Fixes**

- `DataTable` headers should be reactive
- `DataTable` batch selection checkbox should be reactive
- `MultiSelect` should correctly lose focus
- non-filterable `MultiSelect` should dispatch a `blur` event
- resolve `MultiSelect` accessibility issues
- toggle `HeaderNavMenu` when pressing "Enter" or "Space"
- close `HeaderNavMenu` menu when pressing "Enter" on an item
- resolve `HeaderNavMenu` accessibility issues
- fix `TextInput` reactivity by using native `bind:value`

**Documentation**

- remove duplicate "Heading variant" example

**Housekeeping**

- upgrade `carbon-components` to v10.52.0

## [0.57.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.57.1) - 2022-02-01

**Fixes**

- `Tooltip` definition is missing open, close events
- `TooltipDefinition` button should have `type="button"`

## [0.57.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.57.0) - 2022-01-30

**Breaking Changes**

- make `NumberInput` "input" event type consistent with "change" (`null | number`)

**Features**

- dispatch `NumberInput` input, change events when clicking the steppers
- add `primaryButtonIcon` prop to `Modal`, `ModalFooter`

**Fixes**

- prevent `NumberInput` from coercing empty string to `0`

## [0.56.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.56.1) - 2022-01-27

**Fixes**

- `NumberInput` with value `0` should not be converted to `null`

## [0.56.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.56.0) - 2022-01-27

**Breaking Changes**

- type `NumberInput` value as `null | number` instead of `string | number` (`null` signifies "no value")

**Fixes**

- export `readonly` as a prop in `TextArea`
- fix `Checkbox` two-way binding for `checked`, `group` props

**Documentation**

- add `Checkbox` reactive example for `bind:checked`
- update `Checkbox` reactive example for `bind:group` to demo two-way binding
- simplify `Tabs` reactive example
- add `NumberInput` "No value" example

## [0.55.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.55.0) - 2022-01-22

**Features**

- forward `focus`, `blur` events to `NumberInput`
- update `ProgressStep` icons for current, incomplete steps
- type `id` as `any` instead of `string` in `ComboBox`, `Dropdown`, `MultiSelect`

**Fixes**

- do not coerce empty value to `0` in `NumberInput` if `allowEmpty` is true
- label `Slider` input if `aria-label` not explicitly defined
- add missing `required` prop to `RadioButton`
- add missing `required` prop to `Checkbox`
- include `@default undefined` annotations for props that are `undefined` by default

**Refactor**

- remove hotfix in `DatePicker` to prevent disabled icon from being clickable

**Housekeeping**

- upgrade `carbon-components` to v10.51.0

## [0.54.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.54.0) - 2022-01-19

**Features**

- support paginated `DataTable`

## [0.53.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.53.0) - 2022-01-18

**Breaking Changes**

- replace `selectedIndex` with `selectedId` in `Dropdown`
- replace `selectedIndex` with `selectedId` in `ComboBox`

**Fixes**

- prevent `Dropdown` icon from being clickable when disabled

## [0.52.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.52.0) - 2022-01-17

**Features**

- make `Toggle` labels slottable
- add option to `ComboBox.clear` to not re-focus input (`clear({ focus: false })`)

**Fixes**

- break out of trap focus in `Tooltip` when pressing "Escape"
- pass "name" prop in `ComboBox` to input element
- emit `change` event in `Checkbox` after modifying state
- restore explicit typing of `null | HTMLElement` for TypeScript strict mode
- dispatch `click:button--primary` in `Modal` if `shouldSubmitOnEnter` is true

**Documentation**

- simplify reactive `RadioButton` example
- add reactive `Select` example for `Select`
- fix grammar in `TreeView` "Expand all nodes" example
- note that `Search` clear event is also dispatched when pressing "Escape"
- demo reactivity in expandable `Search` example

## [0.51.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.51.3) - 2022-01-12

**Fixes**

- fix `selectedIndex` reactivity in `ComboBox`

**Refactor**

- remove redundant `null` in `null | HTMLElement` prop types

## [0.51.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.51.2) - 2022-01-10

**Fixes**

- correctly reset values in `ComboBox` when manually clearing selection
- fix filterable `ComboBox` keyboard selection
- remove redundant role attributes from `Dropdown`, `Header` to fix a11y warnings
- fix `TileGroup` two-way binding on the `selected` prop

**Documentation**

- document `DatePicker` usage with a Rollup set-up
- add multiple modals example for `Modal`
- add reactive examples for `RadioTile`

## [0.51.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.51.1) - 2022-01-03

**Fixes**

- add missing `required` prop to `Select`
- set global theme variable first in SCSS files

## [0.51.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.51.0) - 2021-12-30

**Features**

- enhance `Checkbox` to support `bind:group`

## [0.50.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.5) - 2021-12-30

**Fixes**

- filterable `MultiSelect` should blur when pressing "Tab"
- filterable `MultiSelect` menu should close when pressing "Escape"
- filterable `MultiSelect` menu should open when pressing "Space"
- `DatePicker` input should not lose focus when pressing "Enter"
- `ToolbarSearch` should expand if `value` is programmatically set

## [0.50.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.4) - 2021-12-30

**Fixes**

- pressing "Escape" in a `DatePicker` should not propagate past the open calendar
- prevent menu icon in filterable `MultiSelect` from triggering twice

## [0.50.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.3) - 2021-12-28

**Fixes**

- do not dispatch "click", "click:row" `DataTable` events when selecting a checkbox or radio button
- render "labelText" slot if `labelText` prop or `$$slots.labelText` is truthy
- prevent default behavior in `Tabs` mobile variant when clicking a menu option
- coalesce nullish values to `""` for `TextInput`, `PasswordInput`, `TextArea`

## [0.50.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.2) - 2021-11-27

**Fixes**

- select correct item in filterable `MultiSelect` using keyboard navigation
- do not mutate `sortedItems` in `MultiSelect`

## [0.50.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.1) - 2021-11-19

**Fixes**

- do not dispatch `DataTable` "click", "click:row" events if target is an `OverflowMenu`

## [0.50.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.0) - 2021-11-18

**Features**

- add `target` prop to `ContextMenu` to support custom trigger element(s)
- pass clicked element as `event.detail` in `ContextMenu` "open" event

## [0.49.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.49.2) - 2021-11-18

**Fixes**

- `Tabs` should not dispatch an initial "change" event when no change has occurred
- `Pagination` page value should not exceed total pages
- fix `Popover` relative prop by inlining style
- replace `onDestroy` with `onMount` return function to avoid running code server-side

## [0.49.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.49.1) - 2021-11-17

**Fixes**

- include missing `Popover` styles from `carbon-components@10.47`

## [0.49.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.49.0) - 2021-11-12

**Features**

- support `UIShell` HeaderNavMenu with current item
- make `InlineNotification` title, subtitle props slottable
- make `ToastNotification` title, subtitle, and caption props slottable

**Refactor**

- remove unnecessary "position: relative" style in `ExpandableTile`
- remove unused `refContent` in `ExpandableTile`

**Housekeeping**

- upgrade `carbon-components` to v10.48.0

## [0.48.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.48.1) - 2021-11-12

**Fixes**

- type `DatePicker` locale prop as flatpickr `CustomLocale` or `key`
- update remaining `carbon-icons-svelte` imports to use inlined icons

## [0.48.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.48.0) - 2021-11-11

**Breaking Changes**

- remove `carbon-icons-svelte` from direct dependencies

**Features**

- support auto-width `Tabs`
- add ref prop to `Form`

**Fixes**

- set calendar instance to `null` when destroying `DatePicker`

## [0.47.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.6) - 2021-11-10

**Fixes**

- fix `Tooltip` two way binding when icon is in focus
- coerce `TextInput` value to a number if `type="number"`

## [0.47.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.5) - 2021-11-07

**Fixes**

- fix `Tooltip` open/close logic to allow two way binding of the `open` prop
- inline `position: relative` style in `ExpandableTile`

## [0.47.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.4) - 2021-11-06

**Fixes**

- only dispatch `click:row--expand` when clicking an expandable `DataTable` row chevron

## [0.47.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.3) - 2021-10-22

**Fixes**

- correctly toggle batch expansion button in `DataTable`

## [0.47.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.2) - 2021-10-21

**Fixes**

- close the open `Tooltip` when using multiple tooltips
- collapse batch expansion button in `DataTable` if one or more rows is collapsed
- omit explicit reference to "carbon-icons-svelte" from `icon` prop descriptions

## [0.47.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.1) - 2021-10-20

**Fixes**

- include border style for non-expandable rows in a batch expandable `DataTable`

## [0.47.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.0) - 2021-10-19

**Features**

- add `nonExpandableRowsIds` prop to `DataTable` to specify rows that should not be expandable

## [0.46.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.46.0) - 2021-10-17

**Breaking Changes**

- use `.svelte.d.ts` extension instead of `.d.ts` for Svelte component TypeScript definitions

**Features**

- support `Tag` outline type
- add `hideLabel` prop to `MultiSelect`
- allow any Svelte component to be used for `icon` props, not just `CarbonIcon`
- add `closeIcon` prop to `HeaderAction` to override the default `Close20` icon

**Fixes**

- avoid opening the calendar if `DatePickerInput` is a disabled `fieldset` descendant
- remove `stopPropagation` modifier from `HeaderAction` to allow multiple UI Shell app switchers

**Housekeeping**

- upgrade `carbon-components` to v10.46.0

## [0.45.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.45.1) - 2021-10-15

**Fixes**

- prevent space/enter keys from selecting incomplete `ProgressIndicator` steps

## [0.45.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.45.0) - 2021-10-13

**Features**

- add `TreeView` component accessors to programmatically expand/collapse nodes

## [0.44.7](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.7) - 2021-10-13

**Fixes**

- add missing `value` prop to `Checkbox`

## [0.44.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.6) - 2021-10-11

**Fixes**

- fix `DataTable` sorting to tolerate `null`, `undefined` values

## [0.44.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.5) - 2021-10-04

**Fixes**

- correctly apply `menuOptionsClass` in `OverflowMenu`

## [0.44.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.4) - 2021-09-28

**Fixes**

- `ClickableTile` TypeScript definition restProps should extend attributes of either `a` or `p` tags

## [0.44.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.3) - 2021-09-23

**Fixes**

- correctly apply styles when using a static width `DataTable` with a title and description

## [0.44.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.2) - 2021-09-14

**Fixes**

- prevent redundant `clear` events in `ComboBox`

## [0.44.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.1) - 2021-09-11

**Fixes**

- if `ComboBox` is disabled, clicking the chevron icon should not toggle the dropdown
- `ToolbarBatchActions` cancel button text should be slottable

## [0.44.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.0) - 2021-09-07

**Features**

- add ability to override or customize `DatePicker` calendar options using the `flatpickrProps` prop

## [0.43.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.43.0) - 2021-09-06

**Features**

- add ability to programmatically clear a `ComboBox` using the `clear` component accessor

## [0.42.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.42.3) - 2021-09-05

**Fixes**

- `RadioButton` "labelText" slot should render even if `labelText` is falsy
- only render `FormGroup` `legend` element if `legendText` is truthy

## [0.42.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.42.2) - 2021-07-29

**Fixes**

- fix reactivity regression in `ComboBox`

**Documentation**

- update example set-ups
- document styling instructions, `carbon-preprocess-svelte` in README.md

## [0.42.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.42.1) - 2021-07-26

**Fixes**

- disable `a11y-mouse-events-have-key-events` warnings
- upgrade `carbon-icons-svelte` to v10.36.0 to quell `a11y-mouse...` warnings

**Refactor**

- remove `formatStyle` utility in `OverflowMenu`

**Documentation**

- add `svelte:head` example usage for loading CDN styles
- add instructions for dynamic theming
- update number of available Carbon icons

## [0.42.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.42.0) - 2021-07-22

**Features**

- add `helperText` prop to `DatePickerInput`

**Fixes**

- replace `svelte:body` with `svelte:window` when listening for an outside click

**Documentation**

- fix typos in styling instructions
- update expanded nodes guidance
- add `DatePicker` example "With helper text"

**Refactor**

- omit explicit `treeview.scss` import in `css/*.scss` files as it is included by default in `carbon-components@10.40`

**Housekeeping**

- upgrade `carbon-components` to v10.40.0

## [0.41.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.41.0) - 2021-07-18

**Features**

- add expandedIds to `TreeView`

**Fixes**

- do not fall back to an empty string for a `DataTable` value if falsy
- omit disabled attribute in `Button` if value is falsy

**Documentation**

- add styling instructions to the home page

## [0.40.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.40.1) - 2021-07-14

**Fixes**

- focus first, non-disabled `TreeView` node if active id does not match the selected id
- set `type="button"` on `OverflowMenu` to prevent submit behavior when pressing "Enter"
- update semantic attributes in `OverflowMenuItem`
- do not render `OverflowMenuItem` title attribute if using a slot
- do not dispatch `NumberInput` on:change event on initialization
- dynamically load ESM `flatpickr` rangePlugin
- forward input, focus events to `Select`
- type `DataTableRowId` as `any`, fixes

## [0.40.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.40.0) - 2021-07-11

**Breaking Changes**

- remove `appendTo` prop in `DatePicker` for server-side rendering (SSR) compatibility

**Features**

- add `Breakpoint` component to detect the current Carbon grid size based on browser width
- add `Theme` component to dynamically update the current theme client-side
- add `valueFrom`, `valueTo` props for range `DatePicker`
- export `multiSelectRef`, `fieldRef`, `selectionRef` in `MultiSelect`
- add clearItem, clearAll instance methods to `LocalStorage`
- support `NumberInput` readonly variant

**Fixes**

- append `DatePicker` instance to local reference to prevent arrow key locking
- fix `on:change` type signature in `DatePicker`
- export id prop in `ProgressBar`
- add skeleton text for every row and column in `DataTableSkeleton`
- deprecate `shouldShowBorder` prop in `Table`
- correctly type exported constant props and function declarations as accessors in `SvelteComponentTyped` interface

**Documentation**

- document Breakpoint component
- document Theme component
- add ProgressBar "UX example"
- add DatePicker example "Range"
- add NumberInput example "Read-only variant"

**Housekeeping**

- upgrade `carbon-components` to v10.39.0

## [0.39.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.39.0) - 2021-07-05

**Breaking Changes**

- remove `clipboard-copy` direct dependency; use native Clipboard API instead of `clipboard-copy` to copy text in `CopyButton`, `CodeSnippet`

**Features**

- add `TreeView` component
- add `RecursiveList` component
- support 3 buttons in `Modal`, `ComposedModal` via `secondaryButtons`
- make `DataTable` title/description slottable
- allow custom `expansionBreakpoint` in UI Shell `Header`, `SideNav`
- dispatch "click:button--primary" as an alias to "submit" in `Modal`, `ComposedModal`

**Fixes**

- export `useStaticWidth` prop in `DataTable`
- do not render `DataTable` table header if title/description not provided

**Documentation**

- add TreeView documentation
- add RecursiveList documentation
- add CopyButton examples "Overriding copy functionality", "Preventing copy functionality"
- add CodeSnippet examples "Overriding copy functionality", "Preventing copy functionality"
- add DataTable example "Static width"
- include typedefs in Component API section

## [0.38.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.38.2) - 2021-07-03

**Fixes**

- prevent `<TextArea readonly={false} />` from being read-only
- only focus `OveflowMenuItem` if not disabled
- trap tab focus within `Modal`, `ComposedModal`

## [0.38.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.38.1) - 2021-06-29

**Fixes**

- add Gray 80 (g80) theme to `all.scss` and the pre-compiled `all.css`

## [0.38.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.38.0) - 2021-06-27

**Features**

- support read-only `TextInput`
- render a checkmark icon for the selected `ComboBox` item

**Fixes**

- adjust `FileUploaderDropContainer` markup to avoid accessibility error for nested interactive controls
- use `ErrorFilled16` icon in `InlineLoading` for the error status
- render iconDescription as title in error/warning icons in `InlineLoading`
- update accessibility attributes for `StructuredList`
- use `span` instead of `div` in `TooltipDefinition` to avoid potential invalid HTML
- close `MultiSelect` menu when blurring the last filterable option
- open/focus field when tab focusing a filterable `MultiSelect`
- unblock tab navigation when blurring `MultiSelect`
- select correct item using keyboard navigation in a filterable `ComboBox`
- unblock input after clearing a `ComboBox` selection
- update `ComboBox` input text if item is selected
- toggle `SideNav` rail when clicking the hamburger menu
- update `ContextMenu` class names
- close `ContextMenu` when left clicking anywhere

**Documentation**

- add TextInput example "Read-only variant"
- add Popover example "Popover alignment"

**Housekeeping**

- upgrade `carbon-components` to v10.38.0

## [0.37.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.37.0) - 2021-06-26

**Features**

- add ProgressBar component

**Fixes**

- omit size prop in `ToolbarSearch`
- omit passing iconDescription to `NotificationIcon` in `InlineNotification`, `ToastNotification`

**Refactor**

- use class directive in `TextInput`

**Documentation**

- add ProgressBar component documentation

**Housekeeping**

- upgrade `carbon-components` to version 10.37.0

## [0.36.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.36.0) - 2021-06-26

**Features**

- add condensed, flush props to `StructuredList`
- support `SideNav` rail
- add isSelected prop to `HeaderNavItem`
- make components with `labelText` prop slottable (e.g., <span slot="labelText">...</span>)

**Fixes**

- set min/max height for multi-line `CodeSnippet`
- make `ImageLoader` SSR compatible by using a window type check guard
- default isSelected to false in `SideNavMenuItem`
- forward keydown event to `TextArea`
- deprecate border prop in `StructuredList`

**Documentation**

- add separate disabled example for filterable/interactive tags
- update number of supported chart types from 17 to 20

**Housekeeping**

- upgrade `carbon-components` to version 10.36.0

## [0.35.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.35.0) - 2021-06-26

**Features**

- support expressive styles for `Button`, `UnorderedList`, `OrderedList`
- support large size for `Button` (`size="lg"`)
- support large, extra-large `ButtonSkeleton` sizes
- support field, small sizes for `FileUploaderItem`
- allow custom `Search` icon
- allow `NumberInput` input steppers to be hidden (`hideSteppers={true}`)
- add `icon` prop to `TooltipIcon`
- support disabled `TooltipIcon`

**Fixes**

- make `Tooltip` screenreader description less verbose

**Documentation**

- add Button examples "Large size", "Expressive styles"
- add OrderedList example "Expressive styles"
- add UnorderedList example "Expressive styles"
- add Search example "Custom search icon"
- add NumberInput example "Hidden steppers"
- add TooltipIcon example "Disabled"

**Housekeeping**

- upgrade `carbon-components` to version 10.35.0

## [0.34.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.34.0) - 2021-06-25

**Features**

- add new Gray 80 (g80) theme
- support expandable `Search` variant
- dispatch open, close, click:overlay events in `SideNav`
- allow custom hamburger menu icons (`iconMenu`, `iconClose`)
- support "xl" `Button` size
- support "medium" `DataTable` size
- support warning state, inline variant for `PasswordInput`

**Fixes**

- replace `<strong>` with semantic paragraph element for file uploader label
- wrap `code` element with `pre`
- add missing restProps annotation to `ToolbarSearch`

**Refactor**

- remove usage of deprecated `Icon` component
- use button specific tooltip class for icon-only variant

**Documentation**

- update available site theming options to include Gray 80 (g80)
- add Search example "Expandable variant"
- add Button example "Extra-large size"
- add DataTable example "Medium rows"
- add PasswordInput examples "Inline" and "Warning state"

**Housekeeping**

- upgrade `carbon-components` to version 10.34.0

## [0.33.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.33.0) - 2021-04-30

**Features**

- support nested object values for DataTable sorting
- pass DataTable header display function to slotted cell
- add icon prop to `Link` to support rendering links with icons; refactor `OutboundLink` to use `Link.icon` prop

**Fixes**

- prevent DataTable sorting from crashing by defaulting `undefined` to an empty string
- add extra DataTable cell `colspan` to support expandable, selectable rows
- support disabled state for `ClickableTile`
- add missing "3x2" ratio to `AspectRatio`

**Documentation**

- add DataTable example ["Sortable with nested object values"](https://carbon-components-svelte.onrender.com/components/DataTable#sortable-with-nested-object-values)
- add ClickableTile example ["Disabled state"](https://carbon-components-svelte.onrender.com/components/ClickableTile#disabled-state)
- add Link example ["Link with icon"](https://carbon-components-svelte.onrender.com/components/Link#link-with-icon)

**Housekeeping**

- upgrade `carbon-components` to version 10.33.0

## [0.32.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.32.2) - 2021-04-23

**Fixes**

- prevent multiple Dropdown items from being selected by updating the `selectedId`
- prevent the default keydown behavior so that pressing "Enter" should open the Dropdown menu
- resolve Carbon icon imports to Svelte files in `DataTable`, `HamburgerMenu` components

**Housekeeping**

- patch `carbon-components` to version 10.32.1

## [0.32.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.32.1) - 2021-04-02

**Fixes**

- hotfix compiled CSS to correctly render default background color for inputs

## [0.32.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.32.0) - 2021-04-02

**Breaking Changes**

- copy text by default in `CodeSnippet` and `CopyButton` using `clipboard-copy`
- deprecate `light` prop in `ContentSwitcher`

**Features**

- support disabled state for `SelectableTile`, `RadioTile`
- add `TooltipFooter` component
- support `OverflowMenu` in Breadcrumbs
- support danger kind for `ContextMenuOption`
- allow sorting to be disabled for a specific header in `DataTable`
- render an empty header column in `DataTableSkeleton` if a value is `{ "empty": true }`
- export `inputRef` prop in `MultiSelect`
- add `searchClass` prop to `Search`, which is passed to the outermost element
- add `noMargin` prop to `FormGroup` to remove default bottom margin (default value is `false`)

**Fixes**

- render initial `ContextMenu` position based on viewport constraints
- correctly display invalid text in `TimePicker`
- remove outer div in `ToolbarSearch`
- set hasScrollingContent class on `ModalBody`

**Documentation**

- add disabled state examples for `SelectableTile`, `RadioTile`
- add expandable `DataTable` size examples, empty header column `DataTableSkeleton` example
- remove the light `ContentSwitcher` example

**Housekeeping**

- upgrade `carbon-components` to version 10.32.0
- add `clipboard-copy` to direct dependencies

## [0.31.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.31.1) - 2021-03-28

**Fixes**

- add missing "name" attribute to non-mobile `NumberInput`
- forward missing "keydown" event to `Form`
- forward click/keydown/mouse events in `FluidForm` to `Form`

## [0.31.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.31.0) - 2021-03-20

**Breaking Changes**

- remove default `title` value in `InlineNotification`
- remove default `title`, `caption` values in `ToastNotification`
- remove `iconDescription` prop from `HeaderNavMenu`

**Features**

- add `Popover` component
- add `ContextMenu` component
- add "container" type for `TabsSkeleton`
- add warning state to `Select`
- dispatch "on:click:button--next" and "on:click:button--previous" in `Pagination`

**Fixes**

- replace chevron icons with "Add" and "Subtract" icons in `NumberInput`
- fix `Slider` markup to use CSS to hide input if `hideTextInput` is `true`
- remove hotfix inline style to center dropdown chevron
- add "rowgroup" role to `StructuredListBody`
- fix type definition for `MultiSelect`: "clear" should be typed as a custom event
- remove line breaks in anchor element in `Link`
- only set `autofocus` attribute if the value is `true`

**Documentation**

- add `Slider` hidden text input, invalid, disabled examples
- add `Select` warning, invalid, helper text, skeleton (hidden label) examples
- add `RadioButton` disabled buttons example
- update sample copy in `ToastNotification`, `InlineNotification`
- update `Select` item groups example to use the hidden default option

**Housekeeping**

- upgrade `carbon-components` to version 10.31.0
- upgrade `carbon-icons-svelte` to version 10.27.0 (icons are correctly typed using `SvelteComponentTyped`)

## [0.30.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.30.0) - 2021-03-13

**Breaking Changes**

- forward `$$restProps` to the input element in `Search`, `MultiSelect`, `ComboBox`, `TimePicker`, `DatePickerInput`, `NumberInput`

**Features**

- add `ImageLoader` component
- add `LocalStorage` component
- forward "clear" event in `ToolbarSearch`
- add isSelected prop for icon-only, ghost buttons
- add legendText prop/slot to `RadioButtonGroup`
- add interactive prop to `Tag`
- make UI Shell `SideNavMenuItem` text slottable
- deprecate `Icon`, `IconSkeleton`

**Fixes**

- set aria-hidden attribute in UI Shell `SideNav`
- only show overlay for non-fixed UI Shell `SideNav`
- correctly render skeleton styles for `TextInputSkeleton`
- only render `RadioButton` label if `labelText` is truthy
- deprecate the `NumberInput` mobile variant
- add missing type annotation for dispatched `MultiSelect` select event
- remove redundant "button" role in `Button`
- update styles for `ListBoxSelection` to fix filterable `MultiSelect`
- temporarily apply override styles to `ListBoxMenuIcon` to correctly render `Dropdown` chevron icon
- apply `z-index: 1` on tooltip when open; style can be overridden through `$$restProps.style`

**Documentation**

- add "on:clear" example for `Search`
- add custom tooltip example for `PasswordInput`
- add legend text examples for `RadioButtonGroup`
- add filterable (disabled) variant for `Tag`
- remove the mobile variant example for `NumberInput`

**Housekeeping**

- upgrade `carbon-components` to v10.30.0

## [0.29.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.29.2) - 2021-03-01

**Fixes**

- remove blank line after `slot` to correctly render button with icon in Safari 13

## [0.29.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.29.1) - 2021-02-26

**Fixes**

- fix blur logic in `ComboBox`, `MultiSelect` based on relatedTarget tag name
- fix `truncate` action to preserve existing class names on node
- use new component tokens to correctly render CSS for tags, low contrast notifications

## [0.29.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.29.0) - 2021-02-19

**Breaking Changes**

- The default placeholder text for `TimePicker` is changed from "hh=mm" to "hh:mm"

**Features**

- Add UI Shell `SideNavDivider` component
- Add a direction prop to `ComboBox`, `Dropdown`, `MultiSelect` to render the dropdown menu above or below the input
- Support `ComboBox` warning state
- Add text truncation component (`Truncate`) and action (`use:truncate`)
- Use shorthand scss imports in `css/*.scss` files
- Use the official `SvelteComponentTyped` interface in the component TypeScript definitions

**Fixes**

- Use `description` as warning icon title in `ProgressStep`
- Include pre-compiled CSS to library side effects to prevent inadvertent tree-shaking
- Fix `DataTable` type definition to include `$$restProps`

**Documentation**

- Add filterable small `Tag` example
- Add `ComboBox` invalid state example
- Add "Top direction" examples for `ComboBox`, `Dropdown`, `MultiSelect`
- Demo `ProgressIndicator` invalid/disabled steps
- Fix `RadioTile` light variant example

**Housekeeping**

- Upgrade `carbon-components` to version 10.29.0

## [0.28.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.28.0) - 2021-02-05

**Breaking Changes**

- The `transitionend` event in ComposedModal is dispatched, not forwarded; it will only trigger when the modal has finished animating

**Features**

- Support small size variant for Tag (`size="sm"`)
- Dispatch `close` event in a filterable Tag (an alias for `click`)
- Dispatch `toggle` event in Toggle
- Make `tooltipText` slottable in TooltipIcon (slot name="tooltipText")
- Add `hideLabel` prop to Dropdown
- Dispatch `transitionend` event in Modal, ComposedModal to fire after the modal has finished animating
- Add warn state to DatePickerInput

**Fixes**

- Forward the `click` event to Tab
- Do not trigger initial Tab focus when mounting

**Documentation**

- Add a "Hidden label" example for the Select component
- Add a light variant example for OverflowMenu
- Add a reactive example for Tabs

**Housekeeping**

- Upgrade `carbon-components` to version 10.28.0
- Remove unused `@carbon/themes` development dependency; themes are pulled from `carbon-components`

## [0.27.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.27.0) - 2021-01-28

**Features**

- Ship scss files used to pre-compile CSS
- Add `optimizeCarbonImports` preprocessor to rewrite base imports from Carbon components/icons/pictograms to the source Svelte file
- Support warning state in Dropdown, MultiSelect, NumberInput
- Set default values for Button `tooltipAlignment` ("center") and `tooltipPosition` ("bottom") in Button
- Infer icon-only Button variant using $$slots API
- Support disabled state for CodeSnippet (single or multi type only)
- Add optional expand/collapse icon labels to ExpandableTile
- Support custom icon variant for Tag
- Add `timeout` to dispatched `on:close` event detail in InlineNotification and ToastNotification
- Upgrade `flatpickr` to version 4.6.9 for ES module (ESM) imports

**Fixes**

- Co-locate DataTableSkeleton with DataTable components
- Prevent MultiSelect dropdown from opening if disabled
- Forward `submit` event to FluidForm
- Correctly apply class props in ModalHeader
- Add missing warning class to TextInput
- Disable visibility toggle if PasswordInput is disabled
- "Show more" button in CodeSnippet should be "field" sized, not small
- Remove extraneous "bx--btn--copy" class from CodeSnippet
- Adjust Loading spinner styles to remove excess padding
- Prevent class from being overridden by $$restProps in InlineNotification, ToastNotification, NotificationActionButton
- Remove extraneous focus ring in Modal
- Remove aria-hidden prop from ToolbarSearch
- Add label id to Slider
- Remove menubar role from HeaderNav; deprecate ariaLabel prop in HeaderNav in favor of real HTML attributes "aria-label" and "aria-labelledby"
- Remove notificationType prop from InlineNotification and ToastNotification
- Focus the first item when opening an OverflowMenu for the first time
- Close the OverflowMenu on the `focusout` event
- Forward $$restProps to the input element for TextInput, PasswordInput

**Breaking Changes**

- DataTableSkeleton.svelte is moved to `src/DataTable`
- `notificationType` is removed from InlineNotification and ToastNotification
- Svelte version 3.25 or greater is required due to use of the $$slots API
- $$restProps are forwarded to the input element for TextInput, PasswordInput
- `renderIcon` prop renamed to `icon` in NotificationButton
- `icon` prop type changed to "typeof import("carbon-icons-svelte").CarbonIcon" in HeaderAction, HeaderActionLink, SideNavLink, SideNavMenu
- Pre-compiled CSS StyleSheets use the "compressed" `sass.outputStyle` instead of "compact"

**Documentation**

- Add documentation for dynamic, client-side theming
- Add icon-only example for the "danger-tertiary" Button
- Update number of supported Carbon icons and pictograms
- Use more realistic body copy in Notification usage examples
- Update development workflow in the contributing guidelines

**Housekeeping**

- Replace `node-sass` with `sass`
- Upgrade `carbon-components` to version 10.27.0
- Upgrade `@carbon/themes` to version 10.26.0
- Upgrade `autoprefixer`, `postcss`, `prettier-plugin-svelte`

## [0.26.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.26.0) - 2020-12-11

**Features**

- Render the UI Shell hamburger menu only if the `SideNav` component is present ([PR #457](https://github.com/carbon-design-system/carbon-components-svelte/pull/457), [issue #434](https://github.com/carbon-design-system/carbon-components-svelte/issues/434))
- Clear the `Search` input value if the "Escape" key is pressed ([PR #448](https://github.com/carbon-design-system/carbon-components-svelte/pull/448))
- Customize the `Tooltip` alignment using the `align` prop ([PR #446](https://github.com/carbon-design-system/carbon-components-svelte/pull/446), [issue #398](https://github.com/carbon-design-system/carbon-components-svelte/issues/398))

**Fixes**

- Fix `files` prop type `FileUploader` to be a list of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File) instead of file names ([PR #437](https://github.com/carbon-design-system/carbon-components-svelte/pull/437))
- Allow binding decimal values in `NumberInput` ([PR #444](https://github.com/carbon-design-system/carbon-components-svelte/pull/444))
- Spread `$$restProps` in `DataTableSkeleton` to the top-level element to be consistent with `DataTable` ([PR #441](https://github.com/carbon-design-system/carbon-components-svelte/pull/441), [issue #423](https://github.com/carbon-design-system/carbon-components-svelte/issues/423))
- Close the `Tooltip` on the mousedown event; re-focus the tooltip icon after closing and forward `click`, `mousedown` events
- Focus the `Dropdown` button correctly for multiple dropdowns ([PR #447](https://github.com/carbon-design-system/carbon-components-svelte/pull/447))
- Focus the `ComboBox` input correctly for multiple combo boxes ([PR #447](https://github.com/carbon-design-system/carbon-components-svelte/pull/447))
- Blur an opened `ComboBox` when clicking a search input ([PR #447](https://github.com/carbon-design-system/carbon-components-svelte/pull/447), [issue #436](https://github.com/carbon-design-system/carbon-components-svelte/issues/436))
- Prevent cursor shift in UI Shell `HeaderSearch` when using the up/down arrow keys to navigate results ([PR #432](https://github.com/carbon-design-system/carbon-components-svelte/pull/432), [issue #431](https://github.com/carbon-design-system/carbon-components-svelte/issues/431))
- Deprecate `small` prop in `ButtonSkeleton`
- Fix `CodeSnippetSkeleton` type to only be "single" or "multi"

**Breaking Changes**

- `files` in `FileUploader` components is a list of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File), not just file names
- `$$restProps` is spread to the top-level element in `DataTableSkeleton`

**Documentation**

- Add reactive, hidden, custom alignment examples for Tooltip
- Add reactive examples for `Search`, `ContentSwitcher`, `Toggle` components
- Add plain Header (no `SideNav`) UI Shell example

**Housekeeping**

- Upgrade `carbon-components` to version 10.25 for the pre-compiled CSS StyleSheets

## [0.25.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.25.1) - 2020-11-28

**Fixes**

- set `selectedResultIndex` in HeaderSearch when clicking a result ([PR #430](https://github.com/carbon-design-system/carbon-components-svelte/pull/430), [issue #429](https://github.com/carbon-design-system/carbon-components-svelte/issues/429))

## [0.25.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.25.0) - 2020-11-27

**Features**

- Add `padding` prop to Grid, Row, Column components ([PR #420](https://github.com/carbon-design-system/carbon-components-svelte/pull/420), [issue #410](https://github.com/carbon-design-system/carbon-components-svelte/issues/410))
- Add `transition` prop to UI Shell `HeaderAction` to customize panel slide transition; by default, the slide duration is `200`ms ([PR #419](https://github.com/carbon-design-system/carbon-components-svelte/pull/419), [issue #384](https://github.com/carbon-design-system/carbon-components-svelte/issues/384))

**Fixes**

- fix `Files` type for FileUploader ([PR #422](https://github.com/carbon-design-system/carbon-components-svelte/pull/422), [issue #421](https://github.com/carbon-design-system/carbon-components-svelte/issues/421))
- remove the fly transition from HamburgerMenu ([PR #419](https://github.com/carbon-design-system/carbon-components-svelte/pull/419), [issue #384](https://github.com/carbon-design-system/carbon-components-svelte/issues/384))

**Documentation**

- add ["Padded columns"](https://carbon-components-svelte.onrender.com/components/Grid#padded-columns) example to Grid docs
- demo different transitions in ["Header with app switcher"](https://carbon-components-svelte.onrender.com/components/UIShell#header-with-app-switcher) example in UI Shell
- describe use case for [using native styles in OrderedList](https://carbon-components-svelte.onrender.com/components/OrderedList#native-list-styles)

**Housekeeping**

- pin development dependency `sveld` to version 0.3.0

---

**Contributors**

- [@ispyinternet](https://github.com/ispyinternet)
- [@miedzikd](https://github.com/miedzikd)

## [0.24.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.24.0) - 2020-11-26

**Features**

- Add HeaderSearch component for the UI Shell that can render user-provided search results ([PR #417](https://github.com/carbon-design-system/carbon-components-svelte/pull/417), [issue #395](https://github.com/carbon-design-system/carbon-components-svelte/issues/395)); HeaderActionSearch is deprecated in favor of HeaderSearch
- Expand `headers` prop type in DataTableSkeleton to be consistent with that of the DataTable ([PR #415](https://github.com/carbon-design-system/carbon-components-svelte/pull/415), [issue #413](https://github.com/carbon-design-system/carbon-components-svelte/issues/413))

**Fixes**

- Update `DataTableRow` prop type in DataTable to require an "id" key and value ([PR #415](https://github.com/carbon-design-system/carbon-components-svelte/pull/415), [issue #414](https://github.com/carbon-design-system/carbon-components-svelte/issues/414))

**Documentation**

- Add example ["Skeleton with object headers"](https://carbon-components-svelte.onrender.com/components/DataTable#skeleton-with-object-headers) to the DataTable docs
- Add example ["Header with global search"](https://carbon-components-svelte.onrender.com/components/UIShell#header-with-global-search) to the UI Shell docs
- deprecate HeaderActionSearch in favor of HeaderSearch

## [0.23.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.23.2) - 2020-11-25

**Fixes**

- Fix dispatched "change" event in RadioButtonGroup ([PR #408](https://github.com/carbon-design-system/carbon-components-svelte/pull/408))
- Export component types and interfaces ([PR #411](https://github.com/carbon-design-system/carbon-components-svelte/pull/411), [issue #409](https://github.com/carbon-design-system/carbon-components-svelte/issues/409))

## [0.23.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.23.1) - 2020-11-22

**Fixes**

- Fix `selected` prop reactivity in RadioButtonGroup so that it can be programmatically updated ([PR #407](https://github.com/carbon-design-system/carbon-components-svelte/pull/407), [issue #406](https://github.com/carbon-design-system/carbon-components-svelte/issues/406))
- Allow click propagation in ListBox so that list box menus can close correctly; this fixes behavior in the ComboBox, Dropdown, and MultiSelect components ([PR #405](https://github.com/carbon-design-system/carbon-components-svelte/pull/405), [issue #388](https://github.com/carbon-design-system/carbon-components-svelte/issues/388))

**Documentation**

- Add [programmatic RadioButton example](https://carbon-components-svelte.onrender.com/components/RadioButton#programmatic-usage)
- Add [multiple ComboBox example](https://carbon-components-svelte.onrender.com/components/ComboBox#multiple-combo-boxes)
- Add [multiple Dropdown example](https://carbon-components-svelte.onrender.com/components/Dropdown#multiple-dropdowns)
- Add [multiple MultiSelect example](https://carbon-components-svelte.onrender.com/components/MultiSelect#multiple-multi-select-dropdowns)
- Add [ExpandableAccordion recipe](https://carbon-components-svelte.onrender.com/recipes/ExpandableAccordion#expandable-accordion)

## [0.23.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.23.0) - 2020-11-20

**Features**

- Persist UI Shell Header hamburger menu if `persistentHamburgerMenu` is `true` ([PR #396](https://github.com/carbon-design-system/carbon-components-svelte/pull/396), [issue #374](https://github.com/carbon-design-system/carbon-components-svelte/issues/374), [rendered example](https://carbon-components-svelte.onrender.com/framed/UIShell/PersistedHamburgerMenu))
- Disable auto focus in ComposedModal if `selectorPrimaryFocus` is `null` ([PR #393](https://github.com/carbon-design-system/carbon-components-svelte/pull/393))
- Use small size Toggle variant if `size` is `"sm"`; deprecate ToggleSmall which will be removed in the next major release ([PR #401](https://github.com/carbon-design-system/carbon-components-svelte/pull/401))

**Fixes**

- Fix `currentIndex` reactivity in ProgressIndicator so that it can be programmatically updated ([PR #404](https://github.com/carbon-design-system/carbon-components-svelte/pull/404), [issue #399](https://github.com/carbon-design-system/carbon-components-svelte/issues/399))

**Refactoring**

- Rewrite TypeScript definitions with better type signatures for slots, dispatched events; fix IntrinsicAttributes errors ([PR #385](https://github.com/carbon-design-system/carbon-components-svelte/pull/385), [issue #304](https://github.com/carbon-design-system/carbon-components-svelte/issues/304))
- Remove useless if statement that wraps `svelte:component` in Button; by design, `svelte:component` will not render falsy values ([PR #402](https://github.com/carbon-design-system/carbon-components-svelte/pull/402))

**Documentation**

- Update auto-generated Component API documentation with output from [sveld](https://github.com/carbon-design-system/sveld)
- Label reactive component props and list them first
- Replace back ticks in Component API prop descriptions with a `code` tag ([PR #392](https://github.com/carbon-design-system/carbon-components-svelte/pull/392), [issue #390](https://github.com/carbon-design-system/carbon-components-svelte/issues/390))
- Simplify date sort method in ["Sortable with custom display and sort methods"](https://carbon-components-svelte.onrender.com/components/DataTable#sortable-with-custom-display-and-sort-methods) DataTable example ([PR #382](https://github.com/carbon-design-system/carbon-components-svelte/pull/382))
- Add [programmatic ProgressIndicator](https://carbon-components-svelte.onrender.com/components/ProgressIndicator#programmatic-usage) example
- Add [vertical ProgressIndicatorSkeleton](https://carbon-components-svelte.onrender.com/components/ProgressIndicator#skeleton-vertical) example
- Add deprecation warning to the ToggleSmall component

**Housekeeping**

- Upgrade `carbon-icons-svelte` from version ^10.17 to ^10.21

**Breaking Changes**

- Internal component TypeScript interfaces are no longer exported to avoid polluting library exports

## [0.22.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.22.0) - 2020-10-30

**Features**

- Button: add "danger-tertiary", "danger-ghost" kinds
- OverflowMenu: support "sm", "xl" size variants
- TimePicker: support "sm", "xl" size variants
- Link: support "sm", "lg" size variants
- OrderedList: support native list styles
- MultiSelect: forward "clear" event
- MultiSelect: dispatch "select" event to be consistent with ComboBox, Dropdown

**Fixes**

- OverflowMenu: dynamic menu shadow width should be scoped to component instance; remove `tabindex` attribute from trigger button
- CodeSnippet: `showMoreLess` should be re-computed if `code` is dynamically updated

**Documentation**

- Document `itemToString` prop for Dropdown, MultiSelect
- MultiSelect: add example for "Initial selected items"
- CodeSnippet: add example for dynamically updating `code`
- CodeSnippet: add example for "Hidden code snippet" edge case (issue #373)
- OverflowMenu: add example for "Custom trigger icon"

**Housekeeping**

- upgrade `carbon-components` to v10.23.1, `@carbon/themes` to v10.22.1
- bump/patch development dependencies

## [0.21.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.21.0) - 2020-10-26

**Features**

- ListBoxMenu: forward "scroll" event ([PR #366](https://github.com/carbon-design-system/carbon-components-svelte/pull/366))
- ComboBox: export reference to list box menu ([PR #366](https://github.com/carbon-design-system/carbon-components-svelte/pull/366))
- DataTable: add `ToolbarMenu`, `ToolbarMenuItem` ([PR #369](https://github.com/carbon-design-system/carbon-components-svelte/pull/369))
- DataTable: support empty table body columns by adding optional `empty` key to `headers` prop ([PR #370](https://github.com/carbon-design-system/carbon-components-svelte/pull/370))
- Dropdown: support "sm", "xl" field sizes

**Fixes**

- DataTable: cancelling batch selection should deselect "select all rows" checkbox
- Toolbar: remove duplicate "bx--toolbar-content" element

**Documentation**

- DataTable: add example ["Empty column with overflow menu"](https://carbon-components-svelte.onrender.com/components/DataTable#empty-column-with-overflow-menu)
- hand off current theme for examples opened in a new tab
- add field size examples for `Dropdown`, `MultiSelect`, `Select`

## [0.20.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.20.0) - 2020-10-24

**Features**

- DataTable: add `Toolbar`, `ToolbarContent`, `ToolbarSearch`, `ToolbarBatchActions`
- DataTable: support row selection, batch selection, radio selection
- DataTable: dispatch "mouseenter", "mouseleave" events on table rows
- Search: forward "focus", "blur" events to search input; dispatch "clear" event

**Fixes**

- DataTable: include sort direction with custom sort method ([PR #356](https://github.com/carbon-design-system/carbon-components-svelte/pull/356))
- fix: allow item ids in ComboBox, Dropdown, MultiSelect to be numbers
- fix(ui-shell): initialize `platformName` as empty string to prevent rendering as "undefined"

**Refactoring**

- refactor(ui-shell): remove redundant conditional in HeaderGlobalAction

**Documentation**

- new DataTable examples:
  - [With custom display and sort methods](https://carbon-components-svelte.onrender.com/components/DataTable#with-custom-display-and-sort-methods)
  - [With toolbar](https://carbon-components-svelte.onrender.com/components/DataTable#with-toolbar)
  - [With toolbar (small size)](https://carbon-components-svelte.onrender.com/components/DataTable#with-toolbar-small-size)
  - [Selectable](https://carbon-components-svelte.onrender.com/components/DataTable#selectable)
  - [Initial selected rows](https://carbon-components-svelte.onrender.com/components/DataTable#initial-selected-rows)
  - [Selectable with batch actions](https://carbon-components-svelte.onrender.com/components/DataTable#selectable-with-batch-actions)
  - [Selectable (radio)](https://carbon-components-svelte.onrender.com/components/DataTable#selectable-radio)
- fix(docgen): list both default and named slots in `COMPONENT_INDEX.md`

## [0.19.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.19.0) - 2020-10-23

**Features**

- DataTable: add optional display and sort methods in header object ([PR #352](https://github.com/carbon-design-system/carbon-components-svelte/pull/352))
- ProgressIndicator: add preventChangeOnClick; default value is `false` ([PR #351](https://github.com/carbon-design-system/carbon-components-svelte/pull/351))
- TooltipDefinition: make tooltip text slottable through `slot="tooltip"`

**Fixes**

- ProgressIndicator: make `currentIndex` reactive ([PR #351](https://github.com/carbon-design-system/carbon-components-svelte/pull/351))
- ComposedModal: use `onDestroy` for destroy logic due to async usage of `onMount`([PR #348](https://github.com/carbon-design-system/carbon-components-svelte/pull/348))
- Search: forward `size` prop to Search skeleton

**Refactoring**

- TooltipDefinition: remove redundant `hidden` reactive variable

**Breaking Changes**

- ProgressIndicator: clicking a completed step will update `currentIndex`; to opt out of this default behavior, set `preventChangeOnClick` to `true`

**Documentation**

- ContentSwitcher: add "Selected index" example
- CodeSnippet: add multi-line skeleton example
- InlineLoading: add UX example showcasing various statuses

## [0.18.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.18.0) - 2020-10-17

**Features**

- DataTable: support individual, batch row expansion ([PR 341](https://github.com/carbon-design-system/carbon-components-svelte/pull/341))
- DataTable: make header, row cells slottable ([PR 342](https://github.com/carbon-design-system/carbon-components-svelte/pull/342))

**Fixes**

- fix(data-table): fix misaligned tall row table headers ([PR 340](https://github.com/carbon-design-system/carbon-components-svelte/pull/340))
- Documentation generator: parse `ArrayExpression` in exported props ([PR 341](https://github.com/carbon-design-system/carbon-components-svelte/pull/341))

**Breaking Changes**

- Remove top-level slot in `DataTable` in favor of named slots ([PR 341](https://github.com/carbon-design-system/carbon-components-svelte/pull/341))

**Documentation**

- add Component API metadata ([PR 340](https://github.com/carbon-design-system/carbon-components-svelte/pull/340))
- DataTable: add expandable, batch expandable examples ([PR 341](https://github.com/carbon-design-system/carbon-components-svelte/pull/341))
- DataTable: add slottable cells example ([PR 342](https://github.com/carbon-design-system/carbon-components-svelte/pull/342))

## [0.17.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.17.0) - 2020-10-16

**Features**

- feat: set `rel="nooopener noreferrer"` if `target="_blank"` on link components ([PR #321](https://github.com/carbon-design-system/carbon-components-svelte/pull/321))
- feat: support `Search` disabled state ([PR #330](https://github.com/carbon-design-system/carbon-components-svelte/pull/330))
- feat(button-skeleton): add size prop consistent with Button ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))
- feat(progress-indicator-skeleton): add count prop ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))
- feat(accordion): add disabled prop for `Accordion` and `AccordionItem` ([PR #333](https://github.com/carbon-design-system/carbon-components-svelte/pull/333))
- feat(accordion): add "sm", "xl" size variants to `Accordion` and `AccordionSkeleton` ([PR #333](https://github.com/carbon-design-system/carbon-components-svelte/pull/333))
- feat(content-switcher): add "sm", "xl" size variants ([PR #334](https://github.com/carbon-design-system/carbon-components-svelte/pull/334))
- feat(code-snippet): add wrapText prop for "multi" type CodeSnippet ([PR #335](https://github.com/carbon-design-system/carbon-components-svelte/pull/335))
- feat(aspect-ratio): add AspectRatio component ([PR #336](https://github.com/carbon-design-system/carbon-components-svelte/pull/336))
- feat(dropdown): dispatch select event, use window instead of body for click events ([PR #339](https://github.com/carbon-design-system/carbon-components-svelte/pull/339))

**Fixes**

- fix(combo-box): disabled combobox should not open ([PR #329](https://github.com/carbon-design-system/carbon-components-svelte/pull/329))
- fix(inline-loading): add wrapper class "bx--inline-loading" ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))
- fix(breadcrumb): forward noTrailingSlash to skeleton ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))
- fix(skeleton-text): unkey paragraph rows due to high collision rate ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))
- fix(accordion-skeleton): forward align prop ([PR #333](https://github.com/carbon-design-system/carbon-components-svelte/pull/333))

**Refactoring**

- refactor(icon): remove old logic that inferred icon size from function name ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))

**Documentation**

- AspectRatio (new component): demo all ratios
- Breadcrumb: use `noTrailingSlash` in skeleton example
- Button: demo skeleton size variants
- CodeSnippet: add example "Wrap text"
- ComboBox: add examples "Light variant," "Filterable"
- ContentSwitcher: add examples "Extra-large size" and "Small size"
- SkeletonText: add example "Paragraph with custom line count"
- Pagination: add example "Hidden page size"
- ProgressIndicator: demo custom step count for skeleton
- Link: add example `Target _blank`
- MultiSelect: add example "No alphabetical sorting"
- Accordion: add examples for "Extra-large" and "Small" size variants
- Accordion: add examples for "Disabled" and "Disabled (item)"
- AccordionSkeleton: add examples "Skeleton (chevron aligned left)" and size variants

**Housekeeping**

- chore(deps-dev): bump carbon-components to ^v10.22 ([PR #337](https://github.com/carbon-design-system/carbon-components-svelte/pull/337))
- retire Storybook by removing Storybook-related dependencies, set-up and stories ([PR #331](https://github.com/carbon-design-system/carbon-components-svelte/pull/331))
- use `npm-run-all` to run `build:css` and `build:lib` in parallel ([PR #331](https://github.com/carbon-design-system/carbon-components-svelte/pull/331))

## [0.16.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.16.0) - 2020-10-12

**Features**

- Pagination: add `pageSizeInputDisabled` prop to hide page size buttons (default is `false`) ([PR #292](https://github.com/carbon-design-system/carbon-components-svelte/pull/292))
- ListBoxMenu: add `ref` prop ([PR #303](https://github.com/carbon-design-system/carbon-components-svelte/pull/303))
- Pre-compiled CSS: upgrade `carbon-components` to version 10.21

**Fixes**

- Link: explicitly define `href` prop to fix TypeScript errors ([PR #301](https://github.com/carbon-design-system/carbon-components-svelte/pull/301))
- RadioButtonGroup: explicitly define `id` prop to fix TypeScript errors ([PR #303](https://github.com/carbon-design-system/carbon-components-svelte/pull/303))
- ComboBox: `light` prop should use the light variant ([PR #303](https://github.com/carbon-design-system/carbon-components-svelte/pull/303))
- ComposedModal: class "bx--body--with-modal-open" should be removed when closing the modal ([PR #306](https://github.com/carbon-design-system/carbon-components-svelte/pull/306))
- Dropdown: remove unused `setContext` import ([PR #308](https://github.com/carbon-design-system/carbon-components-svelte/pull/308))
- `css/all.css`: default theme should be "white," not "g10" ([PR #322](https://github.com/carbon-design-system/carbon-components-svelte/pull/322))
- UI Shell: `HeaderAction` menu should close when clicking in the window, not just the document body ([PR #323](https://github.com/carbon-design-system/carbon-components-svelte/pull/323))

**Performance**

- DatePicker: remove default i10n locales import to reduce bundle size by ~42 kB ([PR #316](https://github.com/carbon-design-system/carbon-components-svelte/pull/316))

**Breaking Changes**

- DatePicker: default i10n locales are no longer imported
- if using `css/all.css`, set the "theme" attribute on the HTML element to "g10" in order to use the Gray 10 theme

**Documentation**

- Redesign component [documentation website](https://carbon-components-svelte.onrender.com/)
- Update development workflow in `CONTRIBUTING.md`
- Typo fixes in `README.md` ([PR #324](https://github.com/carbon-design-system/carbon-components-svelte/pull/324), [PR #325](https://github.com/carbon-design-system/carbon-components-svelte/pull/325))

**Housekeeping**

- Git hooks: only lint staged files in the pre-commit Git hook ([PR #319](https://github.com/carbon-design-system/carbon-components-svelte/pull/319))

## [0.15.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.15.0) - 2020-10-01

**Features**

- DataTableSkeleton: add `size` prop to support "compact", "small", "tall" row heights ([PR #279](https://github.com/carbon-design-system/carbon-components-svelte/pull/279), thanks [@albertms10](https://github.com/albertms10))

- HeaderPanelLink: forward click event ([PR #286](https://github.com/carbon-design-system/carbon-components-svelte/pull/286), thanks [@weaseldotro](https://github.com/weaseldotro))

- FluidForm: add `FluidForm` component and support fluid variants for `TextInput`, `PasswordInput` ([PR #293](https://github.com/carbon-design-system/carbon-components-svelte/pull/293), thanks [@josefaidt](https://github.com/josefaidt))

- UI Shell: add `ref` prop to interactive (i.e., anchor links, buttons) UI Shell elements ([PR #297](https://github.com/carbon-design-system/carbon-components-svelte/pull/297), thanks [@josefaidt](https://github.com/josefaidt))

**Fixes**

- Slider: attach mousemove/touch events to document body, not slider input ([issue #288](https://github.com/carbon-design-system/carbon-components-svelte/issues/288))

- Slider: `value` prop type should be a `number`, not a `string` ([issue #289](https://github.com/carbon-design-system/carbon-components-svelte/issues/289))

- Slider: input value should not update if `disabled` is `true`

- Slider: `change` event should only be dispatched if the value changes

- UI Shell: correctly bind `ref` prop in `HeaderGlobalAction` ([PR #297](https://github.com/carbon-design-system/carbon-components-svelte/pull/297), thanks [@josefaidt](https://github.com/josefaidt))

- export `DatePickerSkeleton`, `FileUploaderSkeleton` components

**Breaking Changes**

- DataTableSkeleton: `compact` prop is removed in favor of `size="compact"`

**Dependencies**

- upgrade `carbon-icons-svelte` to version ^10.17.0

**Housekeeping**

- prettier: enable `svelteBracketNewLine` for improved readability ([PR #281](https://github.com/carbon-design-system/carbon-components-svelte/pull/281), thanks [@josefaidt](https://github.com/josefaidt))

- git: add husky, lint-staged to development workflow ([PR #295](https://github.com/carbon-design-system/carbon-components-svelte/pull/295), thanks [@josefaidt](https://github.com/josefaidt))

## [0.14.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.14.0) - 2020-09-23

**Features**

- `Modal`, `ComposedModal`: add `preventCloseOnClickOutside` prop
- `Modal`: add `alert` prop to support alertdialog ARIA role ([PR #273](https://github.com/carbon-design-system/carbon-components-svelte/pull/273), thanks [@josefaidt](https://github.com/josefaidt))
- `TextInput`: add `warn` prop ([PR #275](https://github.com/carbon-design-system/carbon-components-svelte/pull/275), thanks [@josefaidt](https://github.com/josefaidt))
- `TextInput`: add `inline` prop ([PR #277](https://github.com/carbon-design-system/carbon-components-svelte/pull/277), thanks [@josefaidt](https://github.com/josefaidt))

**Fixes**

- `DataTableSkeleton`: add `showHeader`, `showToolbar` props
- `OverflowMenu`: focus menu button on escape key only
- `DataTable`: fix `headers` JSDoc type annotation ([PR #271](https://github.com/carbon-design-system/carbon-components-svelte/pull/271), thanks [@albertms10](https://github.com/albertms10))

**Breaking Changes**

- `DataTableSkeleton`: `showHeader` and `showToolbar` are `true` by default

## [0.13.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.13.0) - 2020-09-18

**Features**

- Move helper text below form inputs in `ComboBox`, `Dropdown`, `MultiSelect`, `TextArea`, `NumberInput`, `TextInput`, `Select` ([PR #256](https://github.com/carbon-design-system/carbon-components-svelte/pull/256), [issue #255](https://github.com/carbon-design-system/carbon-components-svelte/issues/255))

- ProgressIndicator: add `spaceEqual` prop and functionality ([PR #263](https://github.com/carbon-design-system/carbon-components-svelte/pull/263), [issue #262](https://github.com/carbon-design-system/carbon-components-svelte/issues/262))

**Fixes**

- Link: remove visited styles by default ([PR #259](https://github.com/carbon-design-system/carbon-components-svelte/pull/259), [issue #258](https://github.com/carbon-design-system/carbon-components-svelte/issues/258))

- TimePickerSelect: deprecate `hideLabel` prop to match spec and set default value to `true` ([PR #261](https://github.com/carbon-design-system/carbon-components-svelte/pull/261), [issue #260](https://github.com/carbon-design-system/carbon-components-svelte/issues/260))

**Breaking Changes**

- TimePickerSelect: `hideLabel` prop is `true` by default

## [0.12.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.12.3) - 2020-09-16

**Fixes**

- ClickableTile: add missing `href` ([PR #254](https://github.com/carbon-design-system/carbon-components-svelte/pull/254), thanks [@josefaidt](https://github.com/josefaidt))

## [0.12.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.12.2) - 2020-09-14

**Fixes**

- Dropdown: allow event propagation when clicking the chevron icon (73861e2)

## [0.12.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.12.1) - 2020-09-14

**Fixes**

- Pagination: ensure `page`, `pageSize` values are numbers (0138910)
- Pagination: dispatch "update" event only when `pageSize` or `page` values update (458d1b5)
- Pagination: use correct size carbon icons for buttons (size `16` instead of `24`) (192f98d)
- ProgressStep: use button element; set negative `tabindex` if `disabled` is `true` (3202f39)
- ProgressStep: forward click event (6cb877e)
- SideNavMenu, SideNavMenuItem: remove "role", "aria-haspopup" attributes causing a11y warnings
- RadioTile: move `keydown`, `tabindex` to input element (17d97d1)

## [0.12.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.12.0) - 2020-09-13

**Features**

- css: ship pre-compiled CSS StyleSheets for each Carbon theme (70e0875)

**Documentation**

- examples: add example set-ups using popular bundlers/frameworks
- update README guidance on consuming the library

## [0.11.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.11.0) - 2020-09-05

**Features**

- UI Shell: add `HeaderGlobalAction` component (7b3c111)

## [0.10.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.10.0) - 2020-09-05

**Features**

- UI Shell: add Close/AppSwitcher as default icons for `HeaderAction` component (5f62cde)
- ButtonSet: add `stacked` prop (c8e0a59)
- Link: set `rel` attribute to "noopener noreferrer" if `target` is "\_blank" (4b7d254)

**Fixes**

- TextInput: add missing `required` prop to input (PR #237), thanks [@kamil-murtaza](https://github.com/kamil-murtaza))
- StructuredList: change element semantics from `section` to `div` to avoid accessibility error (117dbcf)
- MultiSelect: add `light` variant to text input (6a955b1)
- NumberInput: disable label, helper text if `disabled` is set to `true` (37c7f07)
- Pagination: use singular page range text if `total` is 1 (3d64fb2)

**Housekeeping**

- add `.prettierrc` and enable `svelteStrictMode` (42b8159)
- remove documentation of non-existent `small` Button prop (41a533d)
- upgrade TypeScript to version >=4 (e7e67f3)
- bump prettier, prettier-plugin-svelte (322b238)
- bump rollup, rollup plugins (00b9068)
- require node >=12 for development/CI (bf0f11a)

## [0.9.7](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.7) - 2020-08-23

- Fix `InlineNotification` and `ToastNotification` timeout
  ([PR#235](https://github.com/carbon-design-system/carbon-components-svelte/pull/235), thanks [@Overbryd](https://github.com/Overbryd))

## [0.9.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.6) - 2020-08-15

- use svelte compiler to generate TypeScript definitions, documentation (issue #227, PR #228)
- fix `DatePicker` to use default imports (reverts 6d5f1e5; issue #232)

## [0.9.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.5) - 2020-08-12

- fix `Modal` and `ComposedModal` to prevent modal from closing unexpectedly ([PR #231](https://github.com/carbon-design-system/carbon-components-svelte/pull/231))

## [0.9.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.4) - 2020-08-08

- ignore false positive `a11y-label-has-associated-control` warnings added in svelte^v3.24.1
- fix `DatePicker`: use wildcard import to resolve flatpickr "no default" error when using ESM
- allow `CodeSnippet` button to be optional by using the `hideCopyButton` prop
- refactor `CodeSnippet`: replace afterUpdate with reactive statement
- fix `CodeSnippet`: forward `feedback`, `feedbackTimeout` props to `Copy` component

## [0.9.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.3) - 2020-08-02

- rename UI Shell `Header` slot from "skip-to-main-content" to "skip-to-content"
- support fixed `SideNav`
- add `expandedByDefault` prop to `Header` to prevent `SideNav` from being expanded

## [0.9.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.2) - 2020-08-01

- add "skip-to-main-content" slot to `Header`
- make `platformName` prop in UI Shell `Header` slottable (i.e., <span slot="platform">...</span>)
- make `company` prop `Header` optional
- fix UI Shell `Header` to add space between company and platform name for ARIA label
- fix UI Shell `HeaderAction` bug where panel would not open
- add `ButtonSet` component
- fix `Accordion` to avoid `$$restProps.class` override

## [0.9.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.1) - 2020-07-30

- fix `TabContent` to remove hidden prop when panel is selected

## [0.9.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.0) - 2020-07-30

- add TypeScript definitions
- dispatch "select" and "clear" events in `ComboBox`
- forward `keydown` event to `TextInput`, `PasswordInput` components
- add `count` prop to `TabsSkeleton`
- apply toggle behavior to `HeaderAction` button; dispatch "open" and "close" events
- fix forwarded click event in `CodeSnippet`
- fix class name typo in `UnorderedList`

## [0.8.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.5) - 2020-07-23

- add `noGutter`, `noGutterLeft`, `noGutterRight` props to `Grid`, `Row`, `Column`
- add `aspectRatio` prop to `Column`

## [0.8.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.4) - 2020-07-22

- add Grid components (`Grid`, `Row`, `Column`)
- add `PaginationNav` component
- fix `TooltipIcon` to avoid `$$restProps.class` override

## [0.8.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.3) - 2020-07-20

- bump `carbon-icons-svelte` dependency to version >=10.14.0
- support `size` prop (`undefined` or `"sm"` or `"lg`) in `DatePickerInput`, `NumberInput`, `Select`, `PasswordInput`, `TextInput` components
- support light variant for `ContentSwitcher`
- focus `ComboBox` after clearing the selection
- fix `ListBox` regression where size class can be overriden by `$$restProps.class`
- fix `Pagination` regression where current page selection value is stuck at `1`

## [0.8.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.2) - 2020-07-19

- fix `ComboBox` to close dropdown menu when pressing the "Escape" key ([Issue #198](https://github.com/carbon-design-system/carbon-components-svelte/issues/198))

## [0.8.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.1) - 2020-07-19

- fix bug in `Tag` to prevent custom class from overriding tag class
- fix SSR rendering issue in `Modal` by replacing `onDestroy` with `onMount` ([Issue #200](https://github.com/carbon-design-system/carbon-components-svelte/issues/200))

## [0.8.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.0) - 2020-07-19

- use \$\$restProps API (requires Svelte version >=3.20)
- upgrade `carbon-icons-svelte` to version >=10.13.0
- use svelte class:{value} API instead of `cx`
- add ref prop to "interactive" components like text inputs, anchor links... ([Issue #196](https://github.com/carbon-design-system/carbon-components-svelte/issues/196))
- add slot to Content Switcher `Switch` component ([Issue #183](https://github.com/carbon-design-system/carbon-components-svelte/issues/183))
- fix `ContentSwitcher` bug where bound `selectedIndex` could not be updated
- remove unused lib utilities (cx, css, fillArray)
- refactor component exports and folder structure
- create Sapper app for e2e testing and alternative development environment in `docs/`
- update Travis CI config to build library, build storybook, and run e2e tests in `docs/`
- remove Jest in favor of integration/e2e testing with Cypress
- update contributing guidelines

## [0.7.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.6) - 2020-07-19

- Add named slot to UI Shell `HeaderAction` component for text
  ([PR#201](https://github.com/carbon-design-system/carbon-components-svelte/pull/201), thanks [@danielboven](https://github.com/danielboven))

## [0.7.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.5) - 2020-07-17

- Add `name` prop to form-related components
  ([PR#199](https://github.com/carbon-design-system/carbon-components-svelte/pull/199), thanks [@softartisan](https://github.com/softartisan))

- Add `Content`, `SkipToContent` components to the UI Shell

- Forward `on:click` event to UI Shell `Header` component

## [0.7.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.4) - 2020-06-17

- Fix `OverflowMenu` focus behavior to set `didOpen` only if `open` is true ([PR#193](https://github.com/carbon-design-system/carbon-components-svelte/pull/193))

## [0.7.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.3) - 2020-06-16

- Fix `OverflowMenu` to focus button only after closing the menu ([PR#192](https://github.com/carbon-design-system/carbon-components-svelte/pull/192))

## [0.7.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.2) - 2020-06-04

- Add sort direction to dispatched "click:header" event for a sortable `DataTable`
  ([PR#188](https://github.com/carbon-design-system/carbon-components-svelte/pull/188), thanks [@mabentley85](https://github.com/mabentley85)!)

## [0.7.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.1) - 2020-06-03

- Add missing RadioTile export

## [0.7.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.0) - 2020-05-29

- Dispatch "update" event in `Pagination` for `pageSize`, `page` variables
  ([PR#185](https://github.com/carbon-design-system/carbon-components-svelte/pull/185), thanks [@mabentley85](https://github.com/mabentley85)!)

- Drop carbon-components as a peer dependency

## [0.6.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.6.3) - 2020-05-26

- Replace `"javascript:void(0)"` with `"/"` in `HeaderNavMenu` href attribute to fix a11y "not a valid attribute" warning; `href` is an exported property that can be overriden by the consumer
  ([Issue #184](https://github.com/carbon-design-system/carbon-components-svelte/issues/184))

- Ignore `a11y-no-onchange` warning in `TimePickerSelect`

- Bump development dependency `svelte` to v3.23.0

## [0.6.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.6.2) - 2020-05-09

- Fix `tileMaxHeight` bug in `ExpandableTile` by setting the value only if the default value is 0
  ([Issue #180](https://github.com/carbon-design-system/carbon-components-svelte/issues/180))

## [0.6.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.6.1) - 2020-05-08

- Fix `Pagination` bug by binding the correct variable (`selected`) to the `Select` component
  ([PR#179](https://github.com/carbon-design-system/carbon-components-svelte/pull/179), thanks [@ericol](https://github.com/ericol)!)

## [0.6.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.6.0) - 2020-05-07

- Fix button with icon bug by manually setting `hasIconOnly` in `Button`. This results in a breaking change for icon-only buttons, which now must include `hasIconOnly`
  ([Issue #174](https://github.com/carbon-design-system/carbon-components-svelte/issues/174))

## [0.5.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.5.1) - 2020-05-03

- Fix focus/dispatch bug in `Modal`, `ComposedModal`
  ([PR#173](https://github.com/carbon-design-system/carbon-components-svelte/pull/173), thanks [@mfeitoza](https://github.com/mfeitoza)!)

## [0.5.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.5.0) - 2020-04-29

- Ship `DataTable` that supports sorting

- Pin dependencies, remove commitlint, husky, eslint, prettier

## [0.4.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.4.2) - 2020-04-20

- Forward `on:blur` event to Select component
  ([PR#169](https://github.com/carbon-design-system/carbon-components-svelte/pull/169), thanks [@httpsOmkar](https://github.com/httpsOmkar)!)

## [0.4.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.4.1) - 2020-04-18

- Refactor UI Shell components to be modular (header, left panel, right panel)
  ([PR#168](https://github.com/carbon-design-system/carbon-components-svelte/pull/168), thanks [@mfeitoza](https://github.com/mfeitoza)!)

## [0.4.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.4.0) - 2020-04-18

- Refactor UI Shell to be component-based
  ([PR#166](https://github.com/carbon-design-system/carbon-components-svelte/pull/166), thanks [@mfeitoza](https://github.com/mfeitoza)!)

## [0.3.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.3.3) - 2020-03-09

- Fix "window is undefined" error when using UIShell with server-side rendering (SSR)
  ([PR#149](https://github.com/carbon-design-system/carbon-components-svelte/pull/149), thanks [@pbxothi](https://github.com/pbxothi)!)

## [0.3.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.3.2) - 2020-02-12

- Fix `SkeletonText` duplicate style attribute to work with `svelte^3.18.2`
  ([#134](https://github.com/carbon-design-system/carbon-components-svelte/issues/134))

## [0.3.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.3.1) - 2020-02-03

- Fix `DatePicker` locale initialization bug

- Fix `CheckboxSkeleton` styles; bump `carbon-components` version to ^10.9.3

## [0.3.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.3.0) - 2020-02-03

- Add `UIShell` component (thanks [@Heydan83](https://github.com/Heydan83)!)
  ([#10](https://github.com/carbon-design-system/carbon-components-svelte/issues/10))

- Add single component skeleton states for `Accordion`, `CodeSnippet`

- Fix `Select`, `SelectItem` to support two-way binding, programmatic prop setting

- Fix `Tab` to set `selected` prop to `currentIndex` after updating

## [0.2.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.2.1) - 2020-01-08

- Check if `l10n.en` is defined in `DatePicker` component to resolve Svelte REPL compilation

## [0.2.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.2.0) - 2020-01-08

- Include `src` in files published to npm to resolve Svelte module entry
  ([#102](https://github.com/carbon-design-system/carbon-components-svelte/issues/102))

- Support most Carbon components (See the [GitHub project](https://github.com/carbon-design-system/carbon-components-svelte/projects/1))

## [0.1.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.1.0) - 2019-12-15

- Initial release
