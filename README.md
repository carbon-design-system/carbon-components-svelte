# carbon-components-svelte

[![NPM][npm]][npm-url]
[![Build][build]][build-badge]

> Svelte implementation of the [Carbon Design System](https://github.com/carbon-design-system)

## Getting Started

`carbon-components-svelte` can be installed as a development dependency.

```bash
yarn add -D carbon-components-svelte
```

## Usage

```html
<script>
  import { Button } from "carbon-components-svelte";
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://unpkg.com/carbon-components/css/carbon-components.min.css"
  />
</svelte:head>

<Button>Primary</Button>
```

## Available Components

> 147 components in "carbon-components-svelte"

- Accordion
  - [AccordionSkeleton](#accordionskeleton)
  - [Accordion](#accordion)
  - [AccordionItem](#accordionitem)
- Breadcrumb
  - [BreadcrumbSkeleton](#breadcrumbskeleton)
  - [Breadcrumb](#breadcrumb)
  - [BreadcrumbItem](#breadcrumbitem)
- Button
  - [ButtonSkeleton](#buttonskeleton)
  - [Button](#button)
- Checkbox
  - [CheckboxSkeleton](#checkboxskeleton)
  - [Checkbox](#checkbox)
- CodeSnippet
  - [CodeSnippetSkeleton](#codesnippetskeleton)
  - [CodeSnippet](#codesnippet)
- [ComboBox](#combobox)
- ComposedModal
  - [ComposedModal](#composedmodal)
  - [ModalBody](#modalbody)
  - [ModalFooter](#modalfooter)
  - [ModalHeader](#modalheader)
- ContentSwitcher
  - [ContentSwitcher](#contentswitcher)
  - [Switch](#switch)
- [Copy](#copy)
- [CopyButton](#copybutton)
- DataTable
  - [DataTable](#datatable)
  - [Table](#table)
  - [TableBody](#tablebody)
  - [TableCell](#tablecell)
  - [TableContainer](#tablecontainer)
  - [TableHead](#tablehead)
  - [TableHeader](#tableheader)
  - [TableRow](#tablerow)
- [DataTableSkeleton](#datatableskeleton)
- DatePicker
  - [DatePickerSkeleton](#datepickerskeleton)
  - [DatePicker](#datepicker)
  - [DatePickerInput](#datepickerinput)
- Dropdown
  - [DropdownSkeleton](#dropdownskeleton)
  - [Dropdown](#dropdown)
- FileUploader
  - [FileUploaderSkeleton](#fileuploaderskeleton)
  - [FileUploader](#fileuploader)
  - [FileUploaderButton](#fileuploaderbutton)
  - [FileUploaderDropContainer](#fileuploaderdropcontainer)
  - [FileUploaderItem](#fileuploaderitem)
  - [Filename](#filename)
- [Form](#form)
- [FormGroup](#formgroup)
- [FormItem](#formitem)
- [FormLabel](#formlabel)
- Grid
  - [Column](#column)
  - [Grid](#grid)
  - [Row](#row)
- Icon
  - [IconSkeleton](#iconskeleton)
  - [Icon](#icon)
- [InlineLoading](#inlineloading)
- [Link](#link)
- ListBox
  - [ListBox](#listbox)
  - [ListBoxField](#listboxfield)
  - [ListBoxMenu](#listboxmenu)
  - [ListBoxMenuIcon](#listboxmenuicon)
  - [ListBoxMenuItem](#listboxmenuitem)
  - [ListBoxSelection](#listboxselection)
- [ListItem](#listitem)
- [Loading](#loading)
- [Modal](#modal)
- [MultiSelect](#multiselect)
- Notification
  - [InlineNotification](#inlinenotification)
  - [NotificationActionButton](#notificationactionbutton)
  - [NotificationButton](#notificationbutton)
  - [NotificationIcon](#notificationicon)
  - [NotificationTextDetails](#notificationtextdetails)
  - [ToastNotification](#toastnotification)
- NumberInput
  - [NumberInputSkeleton](#numberinputskeleton)
  - [NumberInput](#numberinput)
- [OrderedList](#orderedlist)
- OverflowMenu
  - [OverflowMenu](#overflowmenu)
  - [OverflowMenuItem](#overflowmenuitem)
- Pagination
  - [PaginationSkeleton](#paginationskeleton)
  - [Pagination](#pagination)
- PaginationNav
  - [PaginationItem](#paginationitem)
  - [PaginationNav](#paginationnav)
  - [PaginationOverflow](#paginationoverflow)
- ProgressIndicator
  - [ProgressIndicatorSkeleton](#progressindicatorskeleton)
  - [ProgressIndicator](#progressindicator)
  - [ProgressStep](#progressstep)
- RadioButton
  - [RadioButtonSkeleton](#radiobuttonskeleton)
  - [RadioButton](#radiobutton)
- [RadioButtonGroup](#radiobuttongroup)
- Search
  - [SearchSkeleton](#searchskeleton)
  - [Search](#search)
- Select
  - [SelectSkeleton](#selectskeleton)
  - [Select](#select)
  - [SelectItem](#selectitem)
  - [SelectItemGroup](#selectitemgroup)
- [SkeletonPlaceholder](#skeletonplaceholder)
- [SkeletonText](#skeletontext)
- Slider
  - [SliderSkeleton](#sliderskeleton)
  - [Slider](#slider)
- StructuredList
  - [StructuredListSkeleton](#structuredlistskeleton)
  - [StructuredList](#structuredlist)
  - [StructuredListBody](#structuredlistbody)
  - [StructuredListCell](#structuredlistcell)
  - [StructuredListHead](#structuredlisthead)
  - [StructuredListInput](#structuredlistinput)
  - [StructuredListRow](#structuredlistrow)
- Tabs
  - [Tab](#tab)
  - [TabContent](#tabcontent)
  - [Tabs](#tabs)
  - [TabsSkeleton](#tabsskeleton)
- Tag
  - [TagSkeleton](#tagskeleton)
  - [Tag](#tag)
- TextArea
  - [TextAreaSkeleton](#textareaskeleton)
  - [TextArea](#textarea)
- TextInput
  - [PasswordInput](#passwordinput)
  - [TextInputSkeleton](#textinputskeleton)
  - [TextInput](#textinput)
- Tile
  - [ClickableTile](#clickabletile)
  - [ExpandableTile](#expandabletile)
  - [RadioTile](#radiotile)
  - [SelectableTile](#selectabletile)
  - [Tile](#tile)
  - [TileGroup](#tilegroup)
- TimePicker
  - [TimePicker](#timepicker)
  - [TimePickerSelect](#timepickerselect)
- Toggle
  - [ToggleSkeleton](#toggleskeleton)
  - [Toggle](#toggle)
- ToggleSmall
  - [ToggleSmallSkeleton](#togglesmallskeleton)
  - [ToggleSmall](#togglesmall)
- [Tooltip](#tooltip)
- [TooltipDefinition](#tooltipdefinition)
- [TooltipIcon](#tooltipicon)
- UIShell
  - [Content](#content)
  - [SkipToContent](#skiptocontent)
  - [Header](#header)
  - [HeaderAction](#headeraction)
  - [HeaderActionLink](#headeractionlink)
  - [HeaderActionSearch](#headeractionsearch)
  - [HeaderNav](#headernav)
  - [HeaderNavItem](#headernavitem)
  - [HeaderNavMenu](#headernavmenu)
  - [HeaderPanelDivider](#headerpaneldivider)
  - [HeaderPanelLink](#headerpanellink)
  - [HeaderPanelLinks](#headerpanellinks)
  - [HeaderUtilities](#headerutilities)
  - [HamburgerMenu](#hamburgermenu)
  - [SideNav](#sidenav)
  - [SideNavItems](#sidenavitems)
  - [SideNavLink](#sidenavlink)
  - [SideNavMenu](#sidenavmenu)
  - [SideNavMenuItem](#sidenavmenuitem)
- [UnorderedList](#unorderedlist)

## Component Index

### AccordionSkeleton

<details><summary>Usage</summary>

**Component Group:** Accordion

**Import Path**

```js
import { AccordionSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| count     | <code>number</code>  | 4       |
| open      | <code>boolean</code> | true    |

</details>

---

### Accordion

<details><summary>Usage</summary>

**Component Group:** Accordion

**Import Path**

```js
import { Accordion } from "carbon-components-svelte";
```

**API**

| Prop name | Type                              | Default |
| :-------- | :-------------------------------- | :------ |
| align     | <code>"start" &#124; "end"</code> | "end"   |
| skeleton  | <code>boolean</code>              | false   |

</details>

---

### AccordionItem

<details><summary>Usage</summary>

**Component Group:** Accordion

**Import Path**

```js
import { AccordionItem } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                 | Default           |
| :-------------- | :------------------- | :---------------- |
| title           | <code>string</code>  | "title"           |
| open            | <code>boolean</code> | false             |
| iconDescription | <code>string</code>  | "Expand/Collapse" |

</details>

---

### BreadcrumbSkeleton

<details><summary>Usage</summary>

**Component Group:** Breadcrumb

**Import Path**

```js
import { BreadcrumbSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                 | Default |
| :-------------- | :------------------- | :------ |
| noTrailingSlash | <code>boolean</code> | false   |
| count           | <code>number</code>  | 3       |

</details>

---

### Breadcrumb

<details><summary>Usage</summary>

**Component Group:** Breadcrumb

**Import Path**

```js
import { Breadcrumb } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                 | Default |
| :-------------- | :------------------- | :------ |
| noTrailingSlash | <code>boolean</code> | false   |
| skeleton        | <code>boolean</code> | false   |

</details>

---

### BreadcrumbItem

<details><summary>Usage</summary>

**Component Group:** Breadcrumb

**Import Path**

```js
import { BreadcrumbItem } from "carbon-components-svelte";
```

**API**

| Prop name     | Type                 | Default |
| :------------ | :------------------- | :------ |
| href          | <code>string</code>  | -       |
| isCurrentPage | <code>boolean</code> | false   |

</details>

---

### ButtonSkeleton

<details><summary>Usage</summary>

**Component Group:** Button

**Import Path**

```js
import { ButtonSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| href      | <code>string</code>  | -       |
| small     | <code>boolean</code> | false   |

</details>

---

### Button

<details><summary>Usage</summary>

**Component Group:** Button

**Import Path**

```js
import { Button } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                                                                                       | Default   |
| :--------------- | :----------------------------------------------------------------------------------------- | :-------- |
| kind             | <code>"primary" &#124; "secondary" &#124; "tertiary" &#124; "ghost" &#124; "danger"</code> | "primary" |
| size             | <code>"default" &#124; "field" &#124; "small"</code>                                       | "default" |
| hasIconOnly      | <code>boolean</code>                                                                       | false     |
| icon             | <code>typeof import("carbon-icons-svelte/lib/Add16").default</code>                        | -         |
| iconDescription  | <code>string</code>                                                                        | -         |
| tooltipAlignment | <code>"start" &#124; "center" &#124; "end"</code>                                          | -         |
| tooltipPosition  | <code>"top" &#124; "right" &#124; "bottom" &#124; "left"</code>                            | -         |
| as               | <code>boolean</code>                                                                       | false     |
| skeleton         | <code>boolean</code>                                                                       | false     |
| disabled         | <code>boolean</code>                                                                       | false     |
| href             | <code>string</code>                                                                        | -         |
| tabindex         | <code>string</code>                                                                        | "0"       |
| type             | <code>string</code>                                                                        | "button"  |
| ref              | <code>null &#124; HTMLAnchorElement &#124; HTMLButtonElement</code>                        | null      |

</details>

---

### CheckboxSkeleton

<details><summary>Usage</summary>

**Component Group:** Checkbox

**Import Path**

```js
import { CheckboxSkeleton } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### Checkbox

<details><summary>Usage</summary>

**Component Group:** Checkbox

**Import Path**

```js
import { Checkbox } from "carbon-components-svelte";
```

**API**

| Prop name     | Type                                      | Default |
| :------------ | :---------------------------------------- | :------ |
| checked       | <code>boolean</code>                      | false   |
| indeterminate | <code>boolean</code>                      | false   |
| skeleton      | <code>boolean</code>                      | false   |
| readonly      | <code>boolean</code>                      | false   |
| disabled      | <code>boolean</code>                      | false   |
| labelText     | <code>string</code>                       | ""      |
| hideLabel     | <code>boolean</code>                      | false   |
| name          | <code>string</code>                       | ""      |
| title         | <code>string</code>                       | -       |
| id            | <code>string</code>                       | -       |
| ref           | <code>null &#124; HTMLInputElement</code> | null    |

</details>

---

### CodeSnippetSkeleton

<details><summary>Usage</summary>

**Component Group:** CodeSnippet

**Import Path**

```js
import { CodeSnippetSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                                                 | Default  |
| :-------- | :--------------------------------------------------- | :------- |
| type      | <code>"single" &#124; "inline" &#124; "multi"</code> | "single" |

</details>

---

### CodeSnippet

<details><summary>Usage</summary>

**Component Group:** CodeSnippet

**Import Path**

```js
import { CodeSnippet } from "carbon-components-svelte";
```

**API**

| Prop name             | Type                                                 | Default     |
| :-------------------- | :--------------------------------------------------- | :---------- |
| type                  | <code>"single" &#124; "inline" &#124; "multi"</code> | "single"    |
| code                  | <code>string</code>                                  | -           |
| expanded              | <code>boolean</code>                                 | false       |
| light                 | <code>boolean</code>                                 | false       |
| skeleton              | <code>boolean</code>                                 | false       |
| copyButtonDescription | <code>string</code>                                  | -           |
| copyLabel             | <code>string</code>                                  | -           |
| feedback              | <code>string</code>                                  | "Copied!"   |
| feedbackTimeout       | <code>number</code>                                  | 2000        |
| showLessText          | <code>string</code>                                  | "Show more" |
| showMoreLess          | <code>boolean</code>                                 | false       |
| id                    | <code>string</code>                                  | -           |
| ref                   | <code>null &#124; HTMLPreElement</code>              | null        |

</details>

---

### ComboBox

<details><summary>Usage</summary>

**Component Group:** ComboBox

**Import Path**

```js
import { ComboBox } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                                                        | Default                         |
| :--------------- | :---------------------------------------------------------- | :------------------------------ |
| items            | <code>ComboBoxItem[]</code>                                 | []                              |
| itemToString     | <code>(item: ComboBoxItem) => string;</code>                | (item: ComboBoxItem) => string; |
| selectedIndex    | <code>number</code>                                         | -1                              |
| value            | <code>string</code>                                         | ""                              |
| size             | <code>"sm" &#124; "xl"</code>                               | -                               |
| disabled         | <code>boolean</code>                                        | false                           |
| titleText        | <code>string</code>                                         | ""                              |
| placeholder      | <code>string</code>                                         | ""                              |
| helperText       | <code>string</code>                                         | ""                              |
| invalidText      | <code>string</code>                                         | ""                              |
| invalid          | <code>boolean</code>                                        | false                           |
| light            | <code>boolean</code>                                        | false                           |
| open             | <code>boolean</code>                                        | false                           |
| shouldFilterItem | <code>(item: ComboBoxItem, value: string) => boolean</code> | () => true                      |
| translateWithId  | <code>(id: any) => string;</code>                           | -                               |
| id               | <code>string</code>                                         | -                               |
| name             | <code>string</code>                                         | -                               |
| ref              | <code>null &#124; HTMLInputElement</code>                   | null                            |

</details>

---

### ComposedModal

<details><summary>Usage</summary>

**Component Group:** ComposedModal

**Import Path**

```js
import { ComposedModal } from "carbon-components-svelte";
```

**API**

| Prop name            | Type                                      | Default                      |
| :------------------- | :---------------------------------------- | :--------------------------- |
| size                 | <code>"xs" &#124; "sm" &#124; "lg"</code> | -                            |
| open                 | <code>boolean</code>                      | false                        |
| danger               | <code>boolean</code>                      | false                        |
| containerClass       | <code>string</code>                       | ""                           |
| selectorPrimaryFocus | <code>string</code>                       | "[data-modal-primary-focus]" |
| ref                  | <code>null &#124; HTMLElement</code>      | null                         |

</details>

---

### ModalBody

<details><summary>Usage</summary>

**Component Group:** ComposedModal

**Import Path**

```js
import { ModalBody } from "carbon-components-svelte";
```

**API**

| Prop name           | Type                 | Default |
| :------------------ | :------------------- | :------ |
| hasForm             | <code>boolean</code> | false   |
| hasScrollingContent | <code>boolean</code> | false   |

</details>

---

### ModalFooter

<details><summary>Usage</summary>

**Component Group:** ComposedModal

**Import Path**

```js
import { ModalFooter } from "carbon-components-svelte";
```

**API**

| Prop name             | Type                 | Default |
| :-------------------- | :------------------- | :------ |
| primaryButtonText     | <code>string</code>  | ""      |
| primaryButtonDisabled | <code>boolean</code> | false   |
| primaryClass          | <code>string</code>  | -       |
| secondaryButtonText   | <code>string</code>  | ""      |
| secondaryClass        | <code>string</code>  | -       |
| danger                | <code>boolean</code> | false   |

</details>

---

### ModalHeader

<details><summary>Usage</summary>

**Component Group:** ComposedModal

**Import Path**

```js
import { ModalHeader } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                | Default |
| :-------------- | :------------------ | :------ |
| title           | <code>string</code> | ""      |
| label           | <code>string</code> | ""      |
| labelClass      | <code>string</code> | ""      |
| titleClass      | <code>string</code> | ""      |
| closeClass      | <code>string</code> | ""      |
| closeIconClass  | <code>string</code> | ""      |
| iconDescription | <code>string</code> | "Close" |

</details>

---

### ContentSwitcher

<details><summary>Usage</summary>

**Component Group:** ContentSwitcher

**Import Path**

```js
import { ContentSwitcher } from "carbon-components-svelte";
```

**API**

| Prop name     | Type                 | Default |
| :------------ | :------------------- | :------ |
| selectedIndex | <code>number</code>  | 0       |
| light         | <code>boolean</code> | false   |

</details>

---

### Switch

<details><summary>Usage</summary>

**Component Group:** ContentSwitcher

**Import Path**

```js
import { Switch } from "carbon-components-svelte";
```

**API**

| Prop name | Type                                       | Default        |
| :-------- | :----------------------------------------- | :------------- |
| text      | <code>string</code>                        | "Provide text" |
| selected  | <code>boolean</code>                       | false          |
| disabled  | <code>boolean</code>                       | false          |
| id        | <code>string</code>                        | -              |
| ref       | <code>null &#124; HTMLButtonElement</code> | null           |

</details>

---

### Copy

<details><summary>Usage</summary>

**Component Group:** Copy

**Import Path**

```js
import { Copy } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                       | Default   |
| :-------------- | :----------------------------------------- | :-------- |
| feedback        | <code>string</code>                        | "Copied!" |
| feedbackTimeout | <code>number</code>                        | 2000      |
| ref             | <code>null &#124; HTMLButtonElement</code> | null      |

</details>

---

### CopyButton

<details><summary>Usage</summary>

**Component Group:** CopyButton

**Import Path**

```js
import { CopyButton } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                | Default             |
| :-------------- | :------------------ | :------------------ |
| iconDescription | <code>string</code> | "Copy to clipboard" |

</details>

---

### DataTable

<details><summary>Usage</summary>

**Component Group:** DataTable

**Import Path**

```js
import { DataTable } from "carbon-components-svelte";
```

**API**

| Prop name    | Type                                                | Default |
| :----------- | :-------------------------------------------------- | :------ |
| headers      | <code>{key: string; value: string;}</code>          | []      |
| rows         | <code>Object[]</code>                               | []      |
| size         | <code>"compact" &#124; "short" &#124; "tall"</code> | -       |
| title        | <code>string</code>                                 | ""      |
| description  | <code>string</code>                                 | ""      |
| zebra        | <code>boolean</code>                                | false   |
| sortable     | <code>boolean</code>                                | false   |
| stickyHeader | <code>boolean</code>                                | false   |

</details>

---

### Table

<details><summary>Usage</summary>

**Component Group:** DataTable

**Import Path**

```js
import { Table } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                                                | Default |
| :--------------- | :-------------------------------------------------- | :------ |
| size             | <code>"compact" &#124; "short" &#124; "tall"</code> | -       |
| zebra            | <code>boolean</code>                                | false   |
| useStaticWidth   | <code>boolean</code>                                | false   |
| shouldShowBorder | <code>boolean</code>                                | false   |
| sortable         | <code>boolean</code>                                | false   |
| stickyHeader     | <code>boolean</code>                                | false   |

</details>

---

### TableBody

<details><summary>Usage</summary>

**Component Group:** DataTable

**Import Path**

```js
import { TableBody } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### TableCell

<details><summary>Usage</summary>

**Component Group:** DataTable

**Import Path**

```js
import { TableCell } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### TableContainer

<details><summary>Usage</summary>

**Component Group:** DataTable

**Import Path**

```js
import { TableContainer } from "carbon-components-svelte";
```

**API**

| Prop name    | Type                 | Default |
| :----------- | :------------------- | :------ |
| title        | <code>string</code>  | ""      |
| description  | <code>string</code>  | ""      |
| stickyHeader | <code>boolean</code> | false   |

</details>

---

### TableHead

<details><summary>Usage</summary>

**Component Group:** DataTable

**Import Path**

```js
import { TableHead } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### TableHeader

<details><summary>Usage</summary>

**Component Group:** DataTable

**Import Path**

```js
import { TableHeader } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                       | Default   |
| :-------------- | :------------------------- | :-------- |
| scope           | <code>string</code>        | "col"     |
| translateWithId | <code>() => string;</code> | () => ""; |
| id              | <code>string</code>        | -         |

</details>

---

### TableRow

<details><summary>Usage</summary>

**Component Group:** DataTable

**Import Path**

```js
import { TableRow } from "carbon-components-svelte";
```

**API**

| Prop name  | Type                 | Default |
| :--------- | :------------------- | :------ |
| isSelected | <code>boolean</code> | false   |

</details>

---

### DataTableSkeleton

<details><summary>Usage</summary>

**Component Group:** DataTableSkeleton

**Import Path**

```js
import { DataTableSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                  | Default |
| :-------- | :-------------------- | :------ |
| columns   | <code>number</code>   | 5       |
| rows      | <code>number</code>   | 5       |
| compact   | <code>boolean</code>  | false   |
| zebra     | <code>boolean</code>  | false   |
| headers   | <code>string[]</code> | []      |

</details>

---

### DatePickerSkeleton

<details><summary>Usage</summary>

**Component Group:** DatePicker

**Import Path**

```js
import { DatePickerSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| range     | <code>boolean</code> | false   |
| id        | <code>string</code>  | -       |

</details>

---

### DatePicker

<details><summary>Usage</summary>

**Component Group:** DatePicker

**Import Path**

```js
import { DatePicker } from "carbon-components-svelte";
```

**API**

| Prop name      | Type                                                 | Default       |
| :------------- | :--------------------------------------------------- | :------------ |
| datePickerType | <code>"simple" &#124; "single" &#124; "range"</code> | "simple"      |
| value          | <code>string</code>                                  | ""            |
| appendTo       | <code>HTMLElement</code>                             | document.body |
| dateFormat     | <code>string</code>                                  | "m/d/Y"       |
| maxDate        | <code>null &#124; string &#124; Date</code>          | null          |
| minDate        | <code>null &#124; string &#124; Date</code>          | null          |
| locale         | <code>string</code>                                  | "en"          |
| short          | <code>boolean</code>                                 | false         |
| light          | <code>boolean</code>                                 | false         |
| id             | <code>string</code>                                  | -             |

</details>

---

### DatePickerInput

<details><summary>Usage</summary>

**Component Group:** DatePicker

**Import Path**

```js
import { DatePickerInput } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                      | Default |
| :-------------- | :---------------------------------------- | :------ |
| size            | <code>"sm" &#124; "xl"</code>             | -       |
| type            | <code>string</code>                       | "text"  |
| placeholder     | <code>string</code>                       | ""      |
| iconDescription | <code>string</code>                       | ""      |
| id              | <code>string</code>                       | -       |
| invalid         | <code>boolean</code>                      | false   |
| invalidText     | <code>string</code>                       | ""      |
| ref             | <code>null &#124; HTMLInputElement</code> | null    |

</details>

---

### DropdownSkeleton

<details><summary>Usage</summary>

**Component Group:** Dropdown

**Import Path**

```js
import { DropdownSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| inline    | <code>boolean</code> | false   |

</details>

---

### Dropdown

<details><summary>Usage</summary>

**Component Group:** Dropdown

**Import Path**

```js
import { Dropdown } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                         | Default                                  |
| :-------------- | :------------------------------------------- | :--------------------------------------- |
| items           | <code>DropdownItem[]</code>                  | []                                       |
| itemToString    | <code>(item: DropdownItem) => string;</code> | (item: DropdownItem) => DropdownItemText | DropdownItemId; |
| selectedIndex   | <code>number</code>                          | -1                                       |
| type            | <code>"default" &#124; "inline"</code>       | "default"                                |
| size            | <code>"sm" &#124; "lg" &#124; "xl"</code>    | -                                        |
| open            | <code>boolean</code>                         | false                                    |
| inline          | <code>boolean</code>                         | false                                    |
| light           | <code>boolean</code>                         | false                                    |
| disabled        | <code>boolean</code>                         | false                                    |
| titleText       | <code>string</code>                          | ""                                       |
| invalid         | <code>boolean</code>                         | false                                    |
| invalidText     | <code>string</code>                          | ""                                       |
| helperText      | <code>string</code>                          | ""                                       |
| label           | <code>string</code>                          | -                                        |
| translateWithId | <code>(id: any) => string;</code>            | -                                        |
| id              | <code>string</code>                          | -                                        |
| name            | <code>string</code>                          | -                                        |
| ref             | <code>null &#124; HTMLButtonElement</code>   | null                                     |

</details>

---

### FileUploaderSkeleton

<details><summary>Usage</summary>

**Component Group:** FileUploader

**Import Path**

```js
import { FileUploaderSkeleton } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### FileUploader

<details><summary>Usage</summary>

**Component Group:** FileUploader

**Import Path**

```js
import { FileUploader } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                                                                                       | Default     |
| :--------------- | :----------------------------------------------------------------------------------------- | :---------- |
| status           | <code>"uploading" &#124; "edit" &#124; "complete"</code>                                   | "uploading" |
| accept           | <code>string[]</code>                                                                      | []          |
| files            | <code>string[]</code>                                                                      | []          |
| multiple         | <code>boolean</code>                                                                       | false       |
| clearFiles       | <code>() => any;</code>                                                                    | () => void; |
| labelDescription | <code>string</code>                                                                        | ""          |
| labelTitle       | <code>string</code>                                                                        | ""          |
| kind             | <code>"primary" &#124; "secondary" &#124; "tertiary" &#124; "ghost" &#124; "danger"</code> | "primary"   |
| buttonLabel      | <code>string</code>                                                                        | ""          |
| iconDescription  | <code>string</code>                                                                        | ""          |
| name             | <code>string</code>                                                                        | -           |

</details>

---

### FileUploaderButton

<details><summary>Usage</summary>

**Component Group:** FileUploader

**Import Path**

```js
import { FileUploaderButton } from "carbon-components-svelte";
```

**API**

| Prop name           | Type                                                                                       | Default    |
| :------------------ | :----------------------------------------------------------------------------------------- | :--------- |
| accept              | <code>string[]</code>                                                                      | []         |
| multiple            | <code>boolean</code>                                                                       | false      |
| disabled            | <code>boolean</code>                                                                       | false      |
| disableLabelChanges | <code>boolean</code>                                                                       | false      |
| kind                | <code>"primary" &#124; "secondary" &#124; "tertiary" &#124; "ghost" &#124; "danger"</code> | "primary"  |
| labelText           | <code>string</code>                                                                        | "Add file" |
| role                | <code>string</code>                                                                        | "button"   |
| tabindex            | <code>string</code>                                                                        | "0"        |
| id                  | <code>string</code>                                                                        | -          |
| name                | <code>string</code>                                                                        | -          |
| ref                 | <code>null &#124; HTMLInputElement</code>                                                  | null       |

</details>

---

### FileUploaderDropContainer

<details><summary>Usage</summary>

**Component Group:** FileUploader

**Import Path**

```js
import { FileUploaderDropContainer } from "carbon-components-svelte";
```

**API**

| Prop name     | Type                                      | Default                  |
| :------------ | :---------------------------------------- | :----------------------- |
| accept        | <code>string[]</code>                     | []                       |
| multiple      | <code>boolean</code>                      | false                    |
| validateFiles | <code>(files: Files) => Files</code>      | (files: Files) => Files; |
| labelText     | <code>string</code>                       | "Add file"               |
| role          | <code>string</code>                       | "button"                 |
| disabled      | <code>boolean</code>                      | false                    |
| tabindex      | <code>string</code>                       | "0"                      |
| id            | <code>string</code>                       | -                        |
| name          | <code>string</code>                       | ""                       |
| ref           | <code>null &#124; HTMLInputElement</code> | null                     |

</details>

---

### FileUploaderItem

<details><summary>Usage</summary>

**Component Group:** FileUploader

**Import Path**

```js
import { FileUploaderItem } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                                     | Default     |
| :-------------- | :------------------------------------------------------- | :---------- |
| status          | <code>"uploading" &#124; "edit" &#124; "complete"</code> | "uploading" |
| iconDescription | <code>string</code>                                      | ""          |
| invalid         | <code>boolean</code>                                     | false       |
| errorSubject    | <code>string</code>                                      | ""          |
| errorBody       | <code>string</code>                                      | ""          |
| id              | <code>string</code>                                      | -           |
| name            | <code>string</code>                                      | ""          |

</details>

---

### Filename

<details><summary>Usage</summary>

**Component Group:** FileUploader

**Import Path**

```js
import { Filename } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                                     | Default     |
| :-------------- | :------------------------------------------------------- | :---------- |
| status          | <code>"uploading" &#124; "edit" &#124; "complete"</code> | "uploading" |
| iconDescription | <code>string</code>                                      | ""          |
| invalid         | <code>boolean</code>                                     | false       |

</details>

---

### Form

<details><summary>Usage</summary>

**Component Group:** Form

**Import Path**

```js
import { Form } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### FormGroup

<details><summary>Usage</summary>

**Component Group:** FormGroup

**Import Path**

```js
import { FormGroup } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| invalid   | <code>boolean</code> | false   |

</details>

---

### FormItem

<details><summary>Usage</summary>

**Component Group:** FormItem

**Import Path**

```js
import { FormItem } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### FormLabel

<details><summary>Usage</summary>

**Component Group:** FormLabel

**Import Path**

```js
import { FormLabel } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| id        | <code>string</code> | -       |

</details>

---

### Column

<details><summary>Usage</summary>

**Component Group:** Grid

**Import Path**

```js
import { Column } from "carbon-components-svelte";
```

**API**

| Prop name     | Type                                                                                               | Default |
| :------------ | :------------------------------------------------------------------------------------------------- | :------ |
| as            | <code>boolean</code>                                                                               | false   |
| noGutter      | <code>boolean</code>                                                                               | false   |
| noGutterLeft  | <code>boolean</code>                                                                               | false   |
| noGutterRight | <code>boolean</code>                                                                               | false   |
| aspectRatio   | <code>"2x1" &#124; "16x9" &#124; "9x16" &#124; "1x2" &#124; "4x3" &#124; "3x4" &#124; "1x1"</code> | -       |
| sm            | <code>ColumnBreakpoint</code>                                                                      | -       |
| md            | <code>ColumnBreakpoint</code>                                                                      | -       |
| lg            | <code>ColumnBreakpoint</code>                                                                      | -       |
| xlg           | <code>ColumnBreakpoint</code>                                                                      | -       |
| max           | <code>ColumnBreakpoint</code>                                                                      | -       |
|               | <code>string[]</code>                                                                              | -       |

</details>

---

### Grid

<details><summary>Usage</summary>

**Component Group:** Grid

**Import Path**

```js
import { Grid } from "carbon-components-svelte";
```

**API**

| Prop name     | Type                 | Default |
| :------------ | :------------------- | :------ |
| as            | <code>boolean</code> | false   |
| condensed     | <code>boolean</code> | false   |
| narrow        | <code>boolean</code> | false   |
| fullWidth     | <code>boolean</code> | false   |
| noGutter      | <code>boolean</code> | false   |
| noGutterLeft  | <code>boolean</code> | false   |
| noGutterRight | <code>boolean</code> | false   |

</details>

---

### Row

<details><summary>Usage</summary>

**Component Group:** Grid

**Import Path**

```js
import { Row } from "carbon-components-svelte";
```

**API**

| Prop name     | Type                 | Default |
| :------------ | :------------------- | :------ |
| as            | <code>boolean</code> | false   |
| condensed     | <code>boolean</code> | false   |
| narrow        | <code>boolean</code> | false   |
| noGutter      | <code>boolean</code> | false   |
| noGutterLeft  | <code>boolean</code> | false   |
| noGutterRight | <code>boolean</code> | false   |

</details>

---

### IconSkeleton

<details><summary>Usage</summary>

**Component Group:** Icon

**Import Path**

```js
import { IconSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| size      | <code>number</code> | 16      |

</details>

---

### Icon

<details><summary>Usage</summary>

**Component Group:** Icon

**Import Path**

```js
import { Icon } from "carbon-components-svelte";
```

**API**

| Prop name | Type                                                                | Default |
| :-------- | :------------------------------------------------------------------ | :------ |
| render    | <code>typeof import("carbon-icons-svelte/lib/Add16").default</code> | -       |
| skeleton  | <code>boolean</code>                                                | false   |

</details>

---

### InlineLoading

<details><summary>Usage</summary>

**Component Group:** InlineLoading

**Import Path**

```js
import { InlineLoading } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                                                     | Default           |
| :-------------- | :----------------------------------------------------------------------- | :---------------- |
| status          | <code>"active" &#124; "inactive" &#124; "finished" &#124; "error"</code> | "active"          |
| description     | <code>string</code>                                                      | -                 |
| iconDescription | <code>string</code>                                                      | "Expand/Collapse" |
| successDelay    | <code>number</code>                                                      | 1500              |

</details>

---

### Link

<details><summary>Usage</summary>

**Component Group:** Link

**Import Path**

```js
import { Link } from "carbon-components-svelte";
```

**API**

| Prop name | Type                                                                   | Default |
| :-------- | :--------------------------------------------------------------------- | :------ |
| inline    | <code>boolean</code>                                                   | false   |
| disabled  | <code>boolean</code>                                                   | false   |
| ref       | <code>null &#124; HTMLAnchorElement &#124; HTMLParagraphElement</code> | null    |

</details>

---

### ListBox

<details><summary>Usage</summary>

**Component Group:** ListBox

**Import Path**

```js
import { ListBox } from "carbon-components-svelte";
```

**API**

| Prop name   | Type                                   | Default   |
| :---------- | :------------------------------------- | :-------- |
| size        | <code>"sm" &#124; "xl"</code>          | -         |
| type        | <code>"default" &#124; "inline"</code> | "default" |
| open        | <code>boolean</code>                   | false     |
| light       | <code>boolean</code>                   | false     |
| disable     | <code>boolean</code>                   | false     |
| invalid     | <code>boolean</code>                   | false     |
| invalidText | <code>string</code>                    | ""        |

</details>

---

### ListBoxField

<details><summary>Usage</summary>

**Component Group:** ListBox

**Import Path**

```js
import { ListBoxField } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                                    | Default         |
| :-------------- | :------------------------------------------------------ | :-------------- |
| disabled        | <code>boolean</code>                                    | false           |
| role            | <code>string</code>                                     | "combobox"      |
| tabindex        | <code>string</code>                                     | "-1"            |
|                 | <code>{ close: "close"; open: "open"; }</code>          | -               |
| translateWithId | <code>(id: ListBoxFieldTranslationId) => string;</code> | (id) => string; |
| id              | <code>string</code>                                     | -               |
| ref             | <code>null &#124; HTMLElement</code>                    | null            |

</details>

---

### ListBoxMenu

<details><summary>Usage</summary>

**Component Group:** ListBox

**Import Path**

```js
import { ListBoxMenu } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| id        | <code>string</code> | -       |

</details>

---

### ListBoxMenuIcon

<details><summary>Usage</summary>

**Component Group:** ListBox

**Import Path**

```js
import { ListBoxMenuIcon } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                                       | Default         |
| :-------------- | :--------------------------------------------------------- | :-------------- |
| open            | <code>boolean</code>                                       | false           |
|                 | <code>{ close: "close"; open: "open" }</code>              | -               |
| translateWithId | <code>(id: ListBoxMenuIconTranslationId) => string;</code> | (id) => string; |

</details>

---

### ListBoxMenuItem

<details><summary>Usage</summary>

**Component Group:** ListBox

**Import Path**

```js
import { ListBoxMenuItem } from "carbon-components-svelte";
```

**API**

| Prop name   | Type                 | Default |
| :---------- | :------------------- | :------ |
| active      | <code>boolean</code> | false   |
| highlighted | <code>boolean</code> | false   |

</details>

---

### ListBoxSelection

<details><summary>Usage</summary>

**Component Group:** ListBox

**Import Path**

```js
import { ListBoxSelection } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                                                    | Default         |
| :-------------- | :---------------------------------------------------------------------- | :-------------- |
| selectionCount  | <code>\*</code>                                                         | -               |
| disabled        | <code>boolean</code>                                                    | false           |
|                 | <code>{ clearAll: "clearAll"; clearSelection: "clearSelection" }</code> | -               |
| translateWithId | <code>(id: ListBoxSelectionTranslationId) => string;</code>             | (id) => string; |
| ref             | <code>null &#124; HTMLElement</code>                                    | null            |

</details>

---

### ListItem

<details><summary>Usage</summary>

**Component Group:** ListItem

**Import Path**

```js
import { ListItem } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### Loading

<details><summary>Usage</summary>

**Component Group:** Loading

**Import Path**

```js
import { Loading } from "carbon-components-svelte";
```

**API**

| Prop name   | Type                 | Default                    |
| :---------- | :------------------- | :------------------------- |
| small       | <code>boolean</code> | false                      |
| active      | <code>boolean</code> | true                       |
| withOverlay | <code>boolean</code> | false                      |
| description | <code>string</code>  | "Active loading indicator" |
| id          | <code>string</code>  | -                          |

</details>

---

### Modal

<details><summary>Usage</summary>

**Component Group:** Modal

**Import Path**

```js
import { Modal } from "carbon-components-svelte";
```

**API**

| Prop name             | Type                                      | Default                      |
| :-------------------- | :---------------------------------------- | :--------------------------- |
| size                  | <code>"xs" &#124; "sm" &#124; "lg"</code> | -                            |
| open                  | <code>boolean</code>                      | false                        |
| danger                | <code>boolean</code>                      | false                        |
| passiveModal          | <code>boolean</code>                      | false                        |
| modalHeading          | <code>string</code>                       | -                            |
| modalLabel            | <code>string</code>                       | -                            |
| modalAriaLabel        | <code>string</code>                       | -                            |
| iconDescription       | <code>string</code>                       | "Close the modal"            |
| hasForm               | <code>boolean</code>                      | false                        |
| hasScrollingContent   | <code>boolean</code>                      | false                        |
| primaryButtonText     | <code>string</code>                       | ""                           |
| primaryButtonDisabled | <code>boolean</code>                      | false                        |
| shouldSubmitOnEnter   | <code>boolean</code>                      | true                         |
| secondaryButtonText   | <code>string</code>                       | ""                           |
| selectorPrimaryFocus  | <code>string</code>                       | "[data-modal-primary-focus]" |
| id                    | <code>string</code>                       | -                            |
| ref                   | <code>null &#124; HTMLElement</code>      | null                         |

</details>

---

### MultiSelect

<details><summary>Usage</summary>

**Component Group:** MultiSelect

**Import Path**

```js
import { MultiSelect } from "carbon-components-svelte";
```

**API**

| Prop name         | Type                                                                      | Default                                                     |
| :---------------- | :------------------------------------------------------------------------ | :---------------------------------------------------------- |
| items             | <code>MultiSelectItem[]</code>                                            | []                                                          |
| itemToString      | <code>(item: MultiSelectItem) => string;</code>                           | (item: MultiSelectItem) => MultiSelectItemText              | MultiSelectItemId; |
| selectedIds       | <code>MultiSelectItemId[]</code>                                          | []                                                          |
| value             | <code>string</code>                                                       | ""                                                          |
| size              | <code>"sm" &#124; "lg" &#124; "xl"</code>                                 | -                                                           |
| type              | <code>"default" &#124; "inline"</code>                                    | "default"                                                   |
| selectionFeedback | <code>"top" &#124; "fixed" &#124; "top-after-reopen"</code>               | "top-after-reopen"                                          |
| disabled          | <code>boolean</code>                                                      | false                                                       |
| filterable        | <code>boolean</code>                                                      | false                                                       |
| filterItem        | <code>(item: MultiSelectItem, value: string) => string;</code>            | ((item: MultiSelectItem, value: string) => string;)         |
| open              | <code>boolean</code>                                                      | false                                                       |
| light             | <code>boolean</code>                                                      | false                                                       |
| locale            | <code>string</code>                                                       | "en"                                                        |
| placeholder       | <code>string</code>                                                       | ""                                                          |
| sortItem          | <code>(a: MultiSelectItem, b: MultiSelectItem) => MultiSelectItem;</code> | (a: MultiSelectItem, b: MultiSelectItem) => MultiSelectItem |
| translateWithId   | <code>(id: any) => string;</code>                                         | -                                                           |
| titleText         | <code>string</code>                                                       | ""                                                          |
| useTitleInItem    | <code>boolean</code>                                                      | false                                                       |
| invalid           | <code>boolean</code>                                                      | false                                                       |
| invalidText       | <code>string</code>                                                       | ""                                                          |
| helperText        | <code>string</code>                                                       | ""                                                          |
| label             | <code>string</code>                                                       | -                                                           |
| id                | <code>string</code>                                                       | -                                                           |
| name              | <code>string</code>                                                       | -                                                           |

</details>

---

### InlineNotification

<details><summary>Usage</summary>

**Component Group:** Notification

**Import Path**

```js
import { InlineNotification } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                                                                                                           | Default               |
| :--------------- | :------------------------------------------------------------------------------------------------------------- | :-------------------- |
| notificationType | <code>"toast" &#124; "inline"</code>                                                                           | "toast"               |
| kind             | <code>"error" &#124; "info" &#124; "info-square" &#124; "success" &#124; "warning" &#124; "warning-alt"</code> | "error"               |
| lowContrast      | <code>boolean</code>                                                                                           | false                 |
| role             | <code>string</code>                                                                                            | "alert"               |
| title            | <code>string</code>                                                                                            | "Title"               |
| subtitle         | <code>string</code>                                                                                            | ""                    |
| hideCloseButton  | <code>boolean</code>                                                                                           | false                 |
| iconDescription  | <code>string</code>                                                                                            | "Closes notification" |

</details>

---

### NotificationActionButton

<details><summary>Usage</summary>

**Component Group:** Notification

**Import Path**

```js
import { NotificationActionButton } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### NotificationButton

<details><summary>Usage</summary>

**Component Group:** Notification

**Import Path**

```js
import { NotificationButton } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                                                                | Default      |
| :--------------- | :------------------------------------------------------------------ | :----------- |
| notificationType | <code>"toast" &#124; "inline"</code>                                | "toast"      |
| renderIcon       | <code>typeof import("carbon-icons-svelte/lib/Add16").default</code> | -            |
| iconDescription  | <code>string</code>                                                 | "Close icon" |

</details>

---

### NotificationIcon

<details><summary>Usage</summary>

**Component Group:** Notification

**Import Path**

```js
import { NotificationIcon } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                                                                                                           | Default               |
| :--------------- | :------------------------------------------------------------------------------------------------------------- | :-------------------- |
| kind             | <code>"error" &#124; "info" &#124; "info-square" &#124; "success" &#124; "warning" &#124; "warning-alt"</code> | "error"               |
| notificationType | <code>"toast" &#124; "inline"</code>                                                                           | "toast"               |
| iconDescription  | <code>string</code>                                                                                            | "Closes notification" |

</details>

---

### NotificationTextDetails

<details><summary>Usage</summary>

**Component Group:** Notification

**Import Path**

```js
import { NotificationTextDetails } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                                 | Default   |
| :--------------- | :----------------------------------- | :-------- |
| notificationType | <code>"toast" &#124; "inline"</code> | "toast"   |
| title            | <code>string</code>                  | "Title"   |
| subtitle         | <code>string</code>                  | ""        |
| caption          | <code>string</code>                  | "Caption" |

</details>

---

### ToastNotification

<details><summary>Usage</summary>

**Component Group:** Notification

**Import Path**

```js
import { ToastNotification } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                                                                                                           | Default               |
| :--------------- | :------------------------------------------------------------------------------------------------------------- | :-------------------- |
| notificationType | <code>"toast" &#124; "inline"</code>                                                                           | "toast"               |
| kind             | <code>"error" &#124; "info" &#124; "info-square" &#124; "success" &#124; "warning" &#124; "warning-alt"</code> | "error"               |
| lowContrast      | <code>boolean</code>                                                                                           | false                 |
| timeout          | <code>number</code>                                                                                            | 0                     |
| role             | <code>string</code>                                                                                            | "alert"               |
| title            | <code>string</code>                                                                                            | "Title"               |
| subtitle         | <code>string</code>                                                                                            | ""                    |
| caption          | <code>string</code>                                                                                            | "Caption"             |
| iconDescription  | <code>string</code>                                                                                            | "Closes notification" |
| hideCloseButton  | <code>boolean</code>                                                                                           | false                 |

</details>

---

### NumberInputSkeleton

<details><summary>Usage</summary>

**Component Group:** NumberInput

**Import Path**

```js
import { NumberInputSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| hideLabel | <code>boolean</code> | false   |

</details>

---

### NumberInput

<details><summary>Usage</summary>

**Component Group:** NumberInput

**Import Path**

```js
import { NumberInput } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                                            | Default                                   |
| :-------------- | :-------------------------------------------------------------- | :---------------------------------------- |
| size            | <code>"sm" &#124; "xl"</code>                                   | -                                         |
| value           | <code>string</code>                                             | ""                                        |
| step            | <code>number</code>                                             | 1                                         |
| max             | <code>number</code>                                             | -                                         |
| min             | <code>number</code>                                             | -                                         |
| light           | <code>boolean</code>                                            | false                                     |
| readonly        | <code>boolean</code>                                            | false                                     |
| mobile          | <code>boolean</code>                                            | false                                     |
| allowEmpty      | <code>boolean</code>                                            | false                                     |
| disabled        | <code>boolean</code>                                            | false                                     |
| iconDescription | <code>string</code>                                             | ""                                        |
| invalid         | <code>boolean</code>                                            | false                                     |
| invalidText     | <code>string</code>                                             | "Provide invalidText"                     |
| helperText      | <code>string</code>                                             | ""                                        |
| label           | <code>string</code>                                             | ""                                        |
| hideLabel       | <code>boolean</code>                                            | false                                     |
| translateWithId | <code>(id: NumberInputTranslationId) => string;</code>          | (id: NumberInputTranslationId) => string; |
|                 | <code>{ increment: "increment"; decrement: "decrement" }</code> | -                                         |
| id              | <code>string</code>                                             | -                                         |
| name            | <code>string</code>                                             | -                                         |
| ref             | <code>null &#124; HTMLInputElement</code>                       | null                                      |

</details>

---

### OrderedList

<details><summary>Usage</summary>

**Component Group:** OrderedList

**Import Path**

```js
import { OrderedList } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| nested    | <code>boolean</code> | false   |

</details>

---

### OverflowMenu

<details><summary>Usage</summary>

**Component Group:** OverflowMenu

**Import Path**

```js
import { OverflowMenu } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                                                                | Default                          |
| :--------------- | :------------------------------------------------------------------ | :------------------------------- |
| direction        | <code>"top" &#124; "bottom"</code>                                  | "bottom"                         |
| open             | <code>boolean</code>                                                | false                            |
| light            | <code>boolean</code>                                                | false                            |
| flipped          | <code>boolean</code>                                                | false                            |
| menuOptionsClass | <code>string</code>                                                 | -                                |
| icon             | <code>typeof import("carbon-icons-svelte/lib/Add16").default</code> | -                                |
| iconClass        | <code>string</code>                                                 | -                                |
| iconDescription  | <code>string</code>                                                 | "Open and close list of options" |
| id               | <code>string</code>                                                 | -                                |

</details>

---

### OverflowMenuItem

<details><summary>Usage</summary>

**Component Group:** OverflowMenu

**Import Path**

```js
import { OverflowMenuItem } from "carbon-components-svelte";
```

**API**

| Prop name    | Type                                                                | Default        |
| :----------- | :------------------------------------------------------------------ | :------------- |
| text         | <code>string</code>                                                 | "Provide text" |
| href         | <code>string</code>                                                 | ""             |
| primaryFocus | <code>boolean</code>                                                | false          |
| disabled     | <code>boolean</code>                                                | false          |
| hasDivider   | <code>boolean</code>                                                | false          |
| danger       | <code>boolean</code>                                                | false          |
| requireTitle | <code>boolean</code>                                                | false          |
| id           | <code>string</code>                                                 | -              |
| ref          | <code>null &#124; HTMLAnchorElement &#124; HTMLButtonElement</code> | null           |

</details>

---

### PaginationSkeleton

<details><summary>Usage</summary>

**Component Group:** Pagination

**Import Path**

```js
import { PaginationSkeleton } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### Pagination

<details><summary>Usage</summary>

**Component Group:** Pagination

**Import Path**

```js
import { Pagination } from "carbon-components-svelte";
```

**API**

| Prop name         | Type                                                              | Default                                              |
| :---------------- | :---------------------------------------------------------------- | :--------------------------------------------------- |
| page              | <code>number</code>                                               | 1                                                    |
| total             | <code>number</code>                                               | 0                                                    |
| disabled          | <code>boolean</code>                                              | false                                                |
| forwardText       | <code>string</code>                                               | "Next page"                                          |
| backwardText      | <code>string</code>                                               | "Previous page"                                      |
| itemsPerPageText  | <code>string</code>                                               | "Items per page:"                                    |
| itemText          | <code>(min: number, max: number) => string;</code>                | (min: number, max: number) => string;                |
| itemRangeText     | <code>(min: number, max: number, total: number) => string;</code> | (min: number, max: number, total: number) => string; |
| pageInputDisabled | <code>boolean</code>                                              | false                                                |
| pageSize          | <code>number</code>                                               | 10                                                   |
| pageSizes         | <code>number[]</code>                                             | [10]                                                 |
| pagesUnknown      | <code>boolean</code>                                              | false                                                |
| pageText          | <code>(page: number) => string;</code>                            | (current: number) => string;                         |
| pageRangeText     | <code>(current: number, total: number) => string;</code>          | (current: number, total: number) => string;          |
| id                | <code>string</code>                                               | -                                                    |

</details>

---

### PaginationItem

<details><summary>Usage</summary>

**Component Group:** PaginationNav

**Import Path**

```js
import { PaginationItem } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| page      | <code>number</code>  | 0       |
| active    | <code>boolean</code> | false   |

</details>

---

### PaginationNav

<details><summary>Usage</summary>

**Component Group:** PaginationNav

**Import Path**

```js
import { PaginationNav } from "carbon-components-svelte";
```

**API**

| Prop name    | Type                 | Default     |
| :----------- | :------------------- | :---------- |
| page         | <code>number</code>  | 0           |
| total        | <code>number</code>  | 10          |
| shown        | <code>number</code>  | 10          |
| loop         | <code>boolean</code> | false       |
| forwardText  | <code>string</code>  | "Next page" |
| backwardText | <code>string</code>  | "Next page" |
|              | <code>4</code>       | -           |

</details>

---

### PaginationOverflow

<details><summary>Usage</summary>

**Component Group:** PaginationNav

**Import Path**

```js
import { PaginationOverflow } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| fromIndex | <code>number</code> | 0       |
| count     | <code>number</code> | 0       |

</details>

---

### ProgressIndicatorSkeleton

<details><summary>Usage</summary>

**Component Group:** ProgressIndicator

**Import Path**

```js
import { ProgressIndicatorSkeleton } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### ProgressIndicator

<details><summary>Usage</summary>

**Component Group:** ProgressIndicator

**Import Path**

```js
import { ProgressIndicator } from "carbon-components-svelte";
```

**API**

| Prop name    | Type                | Default |
| :----------- | :------------------ | :------ |
| currentIndex | <code>number</code> | 0       |

</details>

---

### ProgressStep

<details><summary>Usage</summary>

**Component Group:** ProgressIndicator

**Import Path**

```js
import { ProgressStep } from "carbon-components-svelte";
```

**API**

| Prop name      | Type                 | Default |
| :------------- | :------------------- | :------ |
| complete       | <code>boolean</code> | false   |
| current        | <code>boolean</code> | false   |
| disabled       | <code>boolean</code> | false   |
| invalid        | <code>boolean</code> | false   |
| descripton     | <code>string</code>  | ""      |
| label          | <code>string</code>  | ""      |
| secondaryLabel | <code>string</code>  | ""      |
| id             | <code>string</code>  | -       |

</details>

---

### RadioButtonSkeleton

<details><summary>Usage</summary>

**Component Group:** RadioButton

**Import Path**

```js
import { RadioButtonSkeleton } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### RadioButton

<details><summary>Usage</summary>

**Component Group:** RadioButton

**Import Path**

```js
import { RadioButton } from "carbon-components-svelte";
```

**API**

| Prop name     | Type                                      | Default |
| :------------ | :---------------------------------------- | :------ |
| value         | <code>string</code>                       | ""      |
| checked       | <code>boolean</code>                      | false   |
| disabled      | <code>boolean</code>                      | false   |
| labelPosition | <code>"right" &#124; "left"</code>        | "right" |
| labelText     | <code>string</code>                       | ""      |
| hideLabel     | <code>boolean</code>                      | false   |
| id            | <code>string</code>                       | -       |
| name          | <code>string</code>                       | ""      |
| ref           | <code>null &#124; HTMLInputElement</code> | null    |

</details>

---

### RadioButtonGroup

<details><summary>Usage</summary>

**Component Group:** RadioButtonGroup

**Import Path**

```js
import { RadioButtonGroup } from "carbon-components-svelte";
```

**API**

| Prop name     | Type                                        | Default      |
| :------------ | :------------------------------------------ | :----------- |
| selected      | <code>string</code>                         | -            |
| disabled      | <code>boolean</code>                        | false        |
| labelPosition | <code>"right" &#124; "left"</code>          | "right"      |
| orientation   | <code>"horizontal" &#124; "vertical"</code> | "horizontal" |

</details>

---

### SearchSkeleton

<details><summary>Usage</summary>

**Component Group:** Search

**Import Path**

```js
import { SearchSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| small     | <code>boolean</code> | false   |

</details>

---

### Search

<details><summary>Usage</summary>

**Component Group:** Search

**Import Path**

```js
import { Search } from "carbon-components-svelte";
```

**API**

| Prop name            | Type                                      | Default              |
| :------------------- | :---------------------------------------- | :------------------- |
| small                | <code>boolean</code>                      | false                |
| size                 | <code>"sm" &#124; "lg"</code>             | -                    |
| skeleton             | <code>boolean</code>                      | false                |
| light                | <code>boolean</code>                      | false                |
| value                | <code>string</code>                       | "text"               |
| type                 | <code>string</code>                       | "text"               |
| placeholder          | <code>string</code>                       | "Search..."          |
| autocomplete         | <code>"on" &#124; "off"</code>            | "off"                |
| autofocus            | <code>boolean</code>                      | false                |
| closeButtonLabelText | <code>string</code>                       | "Clear search input" |
| labelText            | <code>string</code>                       | ""                   |
| id                   | <code>string</code>                       | -                    |
| ref                  | <code>null &#124; HTMLInputElement</code> | null                 |

</details>

---

### SelectSkeleton

<details><summary>Usage</summary>

**Component Group:** Select

**Import Path**

```js
import { SelectSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| hideLabel | <code>boolean</code> | false   |

</details>

---

### Select

<details><summary>Usage</summary>

**Component Group:** Select

**Import Path**

```js
import { Select } from "carbon-components-svelte";
```

**API**

| Prop name   | Type                                       | Default |
| :---------- | :----------------------------------------- | :------ |
| selected    | <code>string</code>                        | -       |
| size        | <code>"sm" &#124; "xl"</code>              | -       |
| inline      | <code>boolean</code>                       | false   |
| light       | <code>boolean</code>                       | false   |
| disabled    | <code>boolean</code>                       | false   |
| id          | <code>string</code>                        | -       |
| name        | <code>string</code>                        | -       |
| invalid     | <code>boolean</code>                       | false   |
| invalidText | <code>string</code>                        | ""      |
| helperText  | <code>string</code>                        | ""      |
| noLabel     | <code>boolean</code>                       | false   |
| labelText   | <code>string</code>                        | ""      |
| hideLabel   | <code>boolean</code>                       | false   |
| ref         | <code>null &#124; HTMLSelectElement</code> | null    |

</details>

---

### SelectItem

<details><summary>Usage</summary>

**Component Group:** Select

**Import Path**

```js
import { SelectItem } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### SelectItemGroup

<details><summary>Usage</summary>

**Component Group:** Select

**Import Path**

```js
import { SelectItemGroup } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default         |
| :-------- | :------------------- | :-------------- |
| disabled  | <code>boolean</code> | false           |
| label     | <code>string</code>  | "Provide label" |

</details>

---

### SkeletonPlaceholder

<details><summary>Usage</summary>

**Component Group:** SkeletonPlaceholder

**Import Path**

```js
import { SkeletonPlaceholder } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### SkeletonText

<details><summary>Usage</summary>

**Component Group:** SkeletonText

**Import Path**

```js
import { SkeletonText } from "carbon-components-svelte";
```

**API**

| Prop name | Type                  | Default |
| :-------- | :-------------------- | :------ |
| lines     | <code>number</code>   | 3       |
| heading   | <code>boolean</code>  | false   |
| paragraph | <code>boolean</code>  | false   |
| width     | <code>string</code>   | "100%"  |
|           | <code>number[]</code> | -       |

</details>

---

### SliderSkeleton

<details><summary>Usage</summary>

**Component Group:** Slider

**Import Path**

```js
import { SliderSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| hideLabel | <code>boolean</code> | false   |

</details>

---

### Slider

<details><summary>Usage</summary>

**Component Group:** Slider

**Import Path**

```js
import { Slider } from "carbon-components-svelte";
```

**API**

| Prop name | Type                                 | Default |
| :-------- | :----------------------------------- | :------ |
| id        | <code>string</code>                  | -       |
| invalid   | <code>boolean</code>                 | false   |
| labelText | <code>string</code>                  | ""      |
| light     | <code>boolean</code>                 | false   |
| name      | <code>string</code>                  | ""      |
| ref       | <code>null &#124; HTMLElement</code> | null    |

</details>

---

### StructuredListSkeleton

<details><summary>Usage</summary>

**Component Group:** StructuredList

**Import Path**

```js
import { StructuredListSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| rows      | <code>number</code>  | 5       |
| border    | <code>boolean</code> | false   |

</details>

---

### StructuredList

<details><summary>Usage</summary>

**Component Group:** StructuredList

**Import Path**

```js
import { StructuredList } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| selected  | <code>string</code>  | -       |
| border    | <code>boolean</code> | false   |
| selection | <code>boolean</code> | false   |

</details>

---

### StructuredListBody

<details><summary>Usage</summary>

**Component Group:** StructuredList

**Import Path**

```js
import { StructuredListBody } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### StructuredListCell

<details><summary>Usage</summary>

**Component Group:** StructuredList

**Import Path**

```js
import { StructuredListCell } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| head      | <code>boolean</code> | false   |
| noWrap    | <code>boolean</code> | false   |

</details>

---

### StructuredListHead

<details><summary>Usage</summary>

**Component Group:** StructuredList

**Import Path**

```js
import { StructuredListHead } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### StructuredListInput

<details><summary>Usage</summary>

**Component Group:** StructuredList

**Import Path**

```js
import { StructuredListInput } from "carbon-components-svelte";
```

**API**

| Prop name | Type                                      | Default |
| :-------- | :---------------------------------------- | :------ |
| checked   | <code>boolean</code>                      | false   |
| title     | <code>string</code>                       | "title" |
| value     | <code>string</code>                       | "value" |
| id        | <code>string</code>                       | -       |
| name      | <code>string</code>                       | ""      |
| ref       | <code>null &#124; HTMLInputElement</code> | null    |

</details>

---

### StructuredListRow

<details><summary>Usage</summary>

**Component Group:** StructuredList

**Import Path**

```js
import { StructuredListRow } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| head      | <code>boolean</code> | false   |
| label     | <code>boolean</code> | false   |
| tabindex  | <code>string</code>  | "0"     |

</details>

---

### Tab

<details><summary>Usage</summary>

**Component Group:** Tabs

**Import Path**

```js
import { Tab } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| id        | <code>string</code> | -       |

</details>

---

### TabContent

<details><summary>Usage</summary>

**Component Group:** Tabs

**Import Path**

```js
import { TabContent } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| id        | <code>string</code> | -       |

</details>

---

### Tabs

<details><summary>Usage</summary>

**Component Group:** Tabs

**Import Path**

```js
import { Tabs } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### TabsSkeleton

<details><summary>Usage</summary>

**Component Group:** Tabs

**Import Path**

```js
import { TabsSkeleton } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### TagSkeleton

<details><summary>Usage</summary>

**Component Group:** Tag

**Import Path**

```js
import { TagSkeleton } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### Tag

<details><summary>Usage</summary>

**Component Group:** Tag

**Import Path**

```js
import { Tag } from "carbon-components-svelte";
```

**API**

| Prop name | Type                                                                                                                                                                                    | Default        |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| type      | <code>"red" &#124; "magenta" &#124; "purple" &#124; "blue" &#124; "cyan" &#124; "teal" &#124; "green" &#124; "gray" &#124; "cool-gray" &#124; "warm-gray" &#124; "high-contrast"</code> | -              |
| filter    | <code>boolean</code>                                                                                                                                                                    | false          |
| disabled  | <code>boolean</code>                                                                                                                                                                    | false          |
| skeleton  | <code>boolean</code>                                                                                                                                                                    | false          |
| title     | <code>string</code>                                                                                                                                                                     | "Clear filter" |
| id        | <code>string</code>                                                                                                                                                                     | -              |

</details>

---

### TextAreaSkeleton

<details><summary>Usage</summary>

**Component Group:** TextArea

**Import Path**

```js
import { TextAreaSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| hideLabel | <code>boolean</code> | false   |

</details>

---

### TextArea

<details><summary>Usage</summary>

**Component Group:** TextArea

**Import Path**

```js
import { TextArea } from "carbon-components-svelte";
```

**API**

| Prop name   | Type                                         | Default |
| :---------- | :------------------------------------------- | :------ |
| value       | <code>string</code>                          | ""      |
| placeholder | <code>string</code>                          | ""      |
| cols        | <code>number</code>                          | 50      |
| rows        | <code>number</code>                          | 4       |
| light       | <code>boolean</code>                         | false   |
| disabled    | <code>boolean</code>                         | false   |
| helperText  | <code>string</code>                          | ""      |
| labelText   | <code>string</code>                          | ""      |
| hideLabel   | <code>boolean</code>                         | false   |
| invalid     | <code>boolean</code>                         | false   |
| invalidText | <code>string</code>                          | ""      |
| id          | <code>string</code>                          | -       |
| name        | <code>string</code>                          | -       |
| ref         | <code>null &#124; HTMLTextAreaElement</code> | null    |

</details>

---

### PasswordInput

<details><summary>Usage</summary>

**Component Group:** TextInput

**Import Path**

```js
import { PasswordInput } from "carbon-components-svelte";
```

**API**

| Prop name         | Type                                                            | Default         |
| :---------------- | :-------------------------------------------------------------- | :-------------- |
| size              | <code>"sm" &#124; "xl"</code>                                   | -               |
| value             | <code>string</code>                                             | ""              |
| type              | <code>string</code>                                             | "password"      |
| placeholder       | <code>string</code>                                             | ""              |
| hidePasswordLabel | <code>string</code>                                             | "Hide password" |
| showPasswordLabel | <code>string</code>                                             | "Show password" |
| tooltipAlignment  | <code>"start" &#124; "center" &#124; "end"</code>               | "center"        |
| tooltipPosition   | <code>"top" &#124; "right" &#124; "bottom" &#124; "left"</code> | "bottom"        |
| light             | <code>boolean</code>                                            | false           |
| disabled          | <code>boolean</code>                                            | false           |
| helperText        | <code>string</code>                                             | ""              |
| labelText         | <code>string</code>                                             | ""              |
| hideLabel         | <code>boolean</code>                                            | false           |
| invalid           | <code>boolean</code>                                            | false           |
| invalidText       | <code>string</code>                                             | ""              |
| id                | <code>string</code>                                             | -               |
| name              | <code>string</code>                                             | -               |
| ref               | <code>null &#124; HTMLInputElement</code>                       | null            |

</details>

---

### TextInputSkeleton

<details><summary>Usage</summary>

**Component Group:** TextInput

**Import Path**

```js
import { TextInputSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| hideLabel | <code>boolean</code> | false   |

</details>

---

### TextInput

<details><summary>Usage</summary>

**Component Group:** TextInput

**Import Path**

```js
import { TextInput } from "carbon-components-svelte";
```

**API**

| Prop name   | Type                                      | Default |
| :---------- | :---------------------------------------- | :------ |
| size        | <code>"sm" &#124; "xl"</code>             | -       |
| value       | <code>string</code>                       | ""      |
| type        | <code>string</code>                       | ""      |
| placeholder | <code>string</code>                       | ""      |
| light       | <code>boolean</code>                      | false   |
| disabled    | <code>boolean</code>                      | false   |
| helperText  | <code>string</code>                       | ""      |
| id          | <code>string</code>                       | -       |
| name        | <code>string</code>                       | -       |
| labelText   | <code>string</code>                       | ""      |
| hideLabel   | <code>boolean</code>                      | false   |
| invalid     | <code>boolean</code>                      | false   |
| invalidText | <code>string</code>                       | ""      |
| ref         | <code>null &#124; HTMLInputElement</code> | null    |

</details>

---

### ClickableTile

<details><summary>Usage</summary>

**Component Group:** Tile

**Import Path**

```js
import { ClickableTile } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| clicked   | <code>boolean</code> | false   |
| light     | <code>boolean</code> | false   |

</details>

---

### ExpandableTile

<details><summary>Usage</summary>

**Component Group:** Tile

**Import Path**

```js
import { ExpandableTile } from "carbon-components-svelte";
```

**API**

| Prop name             | Type                                 | Default                     |
| :-------------------- | :----------------------------------- | :-------------------------- |
| expanded              | <code>boolean</code>                 | false                       |
| light                 | <code>boolean</code>                 | false                       |
| tileMaxHeight         | <code>number</code>                  | 0                           |
| tilePadding           | <code>number</code>                  | 0                           |
| tileCollapsedIconText | <code>string</code>                  | "Interact to expand Tile"   |
| tileExpandedIconText  | <code>string</code>                  | "Interact to collapse Tile" |
| tabindex              | <code>string</code>                  | "0"                         |
| id                    | <code>string</code>                  | -                           |
| ref                   | <code>null &#124; HTMLElement</code> | null                        |

</details>

---

### RadioTile

<details><summary>Usage</summary>

**Component Group:** Tile

**Import Path**

```js
import { RadioTile } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                 | Default          |
| :-------------- | :------------------- | :--------------- |
| checked         | <code>boolean</code> | false            |
| light           | <code>boolean</code> | false            |
| value           | <code>string</code>  | ""               |
| tabindex        | <code>string</code>  | "0"              |
| iconDescription | <code>string</code>  | "Tile checkmark" |
| id              | <code>string</code>  | -                |
| name            | <code>string</code>  | ""               |

</details>

---

### SelectableTile

<details><summary>Usage</summary>

**Component Group:** Tile

**Import Path**

```js
import { SelectableTile } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                      | Default          |
| :-------------- | :---------------------------------------- | :--------------- |
| selected        | <code>boolean</code>                      | false            |
| light           | <code>boolean</code>                      | false            |
| title           | <code>string</code>                       | "title"          |
| value           | <code>string</code>                       | "value"          |
| tabindex        | <code>string</code>                       | "0"              |
| iconDescription | <code>string</code>                       | "Tile checkmark" |
| id              | <code>string</code>                       | -                |
| name            | <code>string</code>                       | ""               |
| ref             | <code>null &#124; HTMLInputElement</code> | null             |

</details>

---

### Tile

<details><summary>Usage</summary>

**Component Group:** Tile

**Import Path**

```js
import { Tile } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| light     | <code>boolean</code> | false   |

</details>

---

### TileGroup

<details><summary>Usage</summary>

**Component Group:** Tile

**Import Path**

```js
import { TileGroup } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| selected  | <code>string</code>  | -       |
| disabled  | <code>boolean</code> | false   |
| legend    | <code>string</code>  | -       |

</details>

---

### TimePicker

<details><summary>Usage</summary>

**Component Group:** TimePicker

**Import Path**

```js
import { TimePicker } from "carbon-components-svelte";
```

**API**

| Prop name   | Type                                      | Default                |
| :---------- | :---------------------------------------- | :--------------------- |
| value       | <code>string</code>                       | ""                     |
| type        | <code>string</code>                       | "text"                 |
| placeholder | <code>string</code>                       | "hh=mm"                |
| pattern     | <code>string</code>                       | "(1[012]               | [1-9]):[0-5][0-9](\\s)?" |
| maxLength   | <code>number</code>                       | 5                      |
| light       | <code>boolean</code>                      | false                  |
| disabled    | <code>boolean</code>                      | false                  |
| labelText   | <code>string</code>                       | ""                     |
| hideLabel   | <code>boolean</code>                      | false                  |
| invalid     | <code>boolean</code>                      | false                  |
| invalidText | <code>string</code>                       | "Invalid time format." |
| id          | <code>string</code>                       | -                      |
| name        | <code>string</code>                       | -                      |
| ref         | <code>null &#124; HTMLInputElement</code> | null                   |

</details>

---

### TimePickerSelect

<details><summary>Usage</summary>

**Component Group:** TimePicker

**Import Path**

```js
import { TimePickerSelect } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                       | Default           |
| :-------------- | :----------------------------------------- | :---------------- |
| value           | <code>string</code>                        | ""                |
| disabled        | <code>boolean</code>                       | false             |
| iconDescription | <code>string</code>                        | "Expand/Collapse" |
| labelText       | <code>string</code>                        | ""                |
| hideLabel       | <code>boolean</code>                       | false             |
| id              | <code>string</code>                        | -                 |
| name            | <code>string</code>                        | -                 |
| ref             | <code>null &#124; HTMLSelectElement</code> | null              |

</details>

---

### ToggleSkeleton

<details><summary>Usage</summary>

**Component Group:** Toggle

**Import Path**

```js
import { ToggleSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| labelText | <code>string</code> | ""      |
| id        | <code>string</code> | -       |

</details>

---

### Toggle

<details><summary>Usage</summary>

**Component Group:** Toggle

**Import Path**

```js
import { Toggle } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| toggled   | <code>boolean</code> | false   |
| disabled  | <code>boolean</code> | false   |
| labelA    | <code>string</code>  | "Off"   |
| labelB    | <code>string</code>  | "On"    |
| labelText | <code>string</code>  | ""      |
| id        | <code>string</code>  | -       |
| name      | <code>string</code>  | -       |

</details>

---

### ToggleSmallSkeleton

<details><summary>Usage</summary>

**Component Group:** ToggleSmall

**Import Path**

```js
import { ToggleSmallSkeleton } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| labelText | <code>string</code> | ""      |
| id        | <code>string</code> | -       |

</details>

---

### ToggleSmall

<details><summary>Usage</summary>

**Component Group:** ToggleSmall

**Import Path**

```js
import { ToggleSmall } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| toggled   | <code>boolean</code> | false   |
| disabled  | <code>boolean</code> | false   |
| labelA    | <code>string</code>  | "Off"   |
| labelB    | <code>string</code>  | "On"    |
| labelText | <code>string</code>  | ""      |
| id        | <code>string</code>  | -       |
| name      | <code>string</code>  | -       |

</details>

---

### Tooltip

<details><summary>Usage</summary>

**Component Group:** Tooltip

**Import Path**

```js
import { Tooltip } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                                                                | Default       |
| :-------------- | :------------------------------------------------------------------ | :------------ |
| direction       | <code>"top" &#124; "right" &#124; "bottom" &#124; "left"</code>     | "bottom"      |
| open            | <code>boolean</code>                                                | false         |
| hideIcon        | <code>boolean</code>                                                | false         |
| icon            | <code>typeof import("carbon-icons-svelte/lib/Add16").default</code> | Information16 |
| iconDescription | <code>string</code>                                                 | ""            |
| iconName        | <code>string</code>                                                 | ""            |
| tabindex        | <code>string</code>                                                 | "0"           |
| tooltipId       | <code>string</code>                                                 | -             |
| triggerId       | <code>string</code>                                                 | -             |
| triggerText     | <code>string</code>                                                 | ""            |
| ref             | <code>null &#124; HTMLElement</code>                                | null          |

</details>

---

### TooltipDefinition

<details><summary>Usage</summary>

**Component Group:** TooltipDefinition

**Import Path**

```js
import { TooltipDefinition } from "carbon-components-svelte";
```

**API**

| Prop name   | Type                                              | Default  |
| :---------- | :------------------------------------------------ | :------- |
| tooltipText | <code>string</code>                               | ""       |
| align       | <code>"start" &#124; "center" &#124; "end"</code> | "center" |
| direction   | <code>"top" &#124; "bottom"</code>                | "bottom" |
| id          | <code>string</code>                               | -        |
| ref         | <code>null &#124; HTMLButtonElement</code>        | null     |

</details>

---

### TooltipIcon

<details><summary>Usage</summary>

**Component Group:** TooltipIcon

**Import Path**

```js
import { TooltipIcon } from "carbon-components-svelte";
```

**API**

| Prop name   | Type                                                            | Default  |
| :---------- | :-------------------------------------------------------------- | :------- |
| tooltipText | <code>string</code>                                             | ""       |
| align       | <code>"start" &#124; "center" &#124; "end"</code>               | "center" |
| direction   | <code>"top" &#124; "right" &#124; "bottom" &#124; "left"</code> | "bottom" |
| id          | <code>string</code>                                             | -        |
| ref         | <code>null &#124; HTMLButtonElement</code>                      | null     |

</details>

---

### Content

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { Content } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default        |
| :-------- | :------------------ | :------------- |
| id        | <code>string</code> | "main-content" |

</details>

---

### SkipToContent

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { SkipToContent } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default         |
| :-------- | :------------------ | :-------------- |
| href      | <code>string</code> | "#main-content" |
| tabindex  | <code>string</code> | "0"             |

</details>

---

### UnorderedList

<details><summary>Usage</summary>

**Component Group:** UnorderedList

**Import Path**

```js
import { UnorderedList } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| nested    | <code>boolean</code> | false   |

</details>

---

### Header

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { Header } from "carbon-components-svelte";
```

**API**

| Prop name        | Type                 | Default |
| :--------------- | :------------------- | :------ |
| isSideNavOpen    | <code>boolean</code> | false   |
| uiShellAriaLabel | <code>string</code>  | -       |
| href             | <code>string</code>  | -       |
| company          | <code>string</code>  | -       |
| platformName     | <code>string</code>  | -       |

</details>

---

### HeaderAction

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HeaderAction } from "carbon-components-svelte";
```

**API**

| Prop name | Type                                                                                                | Default |
| :-------- | :-------------------------------------------------------------------------------------------------- | :------ |
| isOpen    | <code>boolean</code>                                                                                | false   |
| icon      | <code>{ render: typeof import("carbon-icons-svelte/lib/Add16").default; skeleton: boolean; }</code> | -       |
| text      | <code>string</code>                                                                                 | -       |

</details>

---

### HeaderActionLink

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HeaderActionLink } from "carbon-components-svelte";
```

**API**

| Prop name    | Type                                                                                                | Default |
| :----------- | :-------------------------------------------------------------------------------------------------- | :------ |
| linkIsActive | <code>boolean</code>                                                                                | false   |
| href         | <code>string</code>                                                                                 | -       |
| icon         | <code>{ render: typeof import("carbon-icons-svelte/lib/Add16").default; skeleton: boolean; }</code> | -       |

</details>

---

### HeaderActionSearch

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HeaderActionSearch } from "carbon-components-svelte";
```

**API**

| Prop name      | Type                 | Default |
| :------------- | :------------------- | :------ |
| searchIsActive | <code>boolean</code> | false   |

</details>

---

### HeaderNav

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HeaderNav } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| ariaLabel | <code>string</code> | -       |

</details>

---

### HeaderNavItem

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HeaderNavItem } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| href      | <code>string</code> | -       |
| text      | <code>string</code> | -       |

</details>

---

### HeaderNavMenu

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HeaderNavMenu } from "carbon-components-svelte";
```

**API**

| Prop name       | Type                 | Default           |
| :-------------- | :------------------- | :---------------- |
| expanded        | <code>boolean</code> | false             |
| href            | <code>string</code>  | "/"               |
| text            | <code>string</code>  | -                 |
| iconDescription | <code>string</code>  | "Expand/Collapse" |

</details>

---

### HeaderPanelDivider

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HeaderPanelDivider } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### HeaderPanelLink

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HeaderPanelLink } from "carbon-components-svelte";
```

**API**

| Prop name | Type                | Default |
| :-------- | :------------------ | :------ |
| href      | <code>string</code> | -       |

</details>

---

### HeaderPanelLinks

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HeaderPanelLinks } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### HeaderUtilities

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HeaderUtilities } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### HamburgerMenu

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { HamburgerMenu } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| ariaLabel | <code>string</code>  | -       |
| isOpen    | <code>boolean</code> | false   |

</details>

---

### SideNav

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { SideNav } from "carbon-components-svelte";
```

**API**

| Prop name | Type                 | Default |
| :-------- | :------------------- | :------ |
| ariaLabel | <code>string</code>  | -       |
| isOpen    | <code>boolean</code> | false   |

</details>

---

### SideNavItems

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { SideNavItems } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

### SideNavLink

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { SideNavLink } from "carbon-components-svelte";
```

**API**

| Prop name  | Type                                                                                                | Default |
| :--------- | :-------------------------------------------------------------------------------------------------- | :------ |
| isSelected | <code>boolean</code>                                                                                | false   |
| href       | <code>string</code>                                                                                 | -       |
| text       | <code>string</code>                                                                                 | -       |
| icon       | <code>{ render: typeof import("carbon-icons-svelte/lib/Add16").default; skeleton: boolean; }</code> | -       |

</details>

---

### SideNavMenu

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { SideNavMenu } from "carbon-components-svelte";
```

**API**

| Prop name | Type                                                                                                | Default |
| :-------- | :-------------------------------------------------------------------------------------------------- | :------ |
| expanded  | <code>boolean</code>                                                                                | -       |
| text      | <code>string</code>                                                                                 | -       |
| icon      | <code>{ render: typeof import("carbon-icons-svelte/lib/Add16").default; skeleton: boolean; }</code> | -       |

</details>

---

### SideNavMenuItem

<details><summary>Usage</summary>

**Component Group:** UIShell

**Import Path**

```js
import { SideNavMenuItem } from "carbon-components-svelte";
```

**API**

No exported props.

</details>

---

## Contributing

Refer to the [Contributing guidelines](CONTRIBUTING.md).

## [Changelog](CHANGELOG.md)

## License

[Apache 2.0](LICENSE)

[npm]: https://img.shields.io/npm/v/carbon-components-svelte.svg?color=blue
[npm-url]: https://npmjs.com/package/carbon-components-svelte
[build]: https://travis-ci.com/ibm/carbon-components-svelte.svg?branch=master
[build-badge]: https://travis-ci.com/ibm/carbon-components-svelte
