---
title: Internationalization
layout: guide
description: Translate Carbon Components Svelte with text props, function props for text with numbers, one translation function for the whole app, and Intl formatting through the locale prop.
---

<script>
  import { Pagination } from "carbon-components-svelte";
</script>

Every visible or announced string in the library is a prop with an English default. There is no message catalog to load and no locale to register. You pass the text you want, per component, or set one translation function for the whole app.

## Strings are props

A prop that ends in `Text` holds text people see. A prop that ends in `Description` holds text only assistive technology reads, such as the label of an icon-only button.

```svelte
<script>
  import { Button, Modal, Search } from "carbon-components-svelte";
</script>

<Search labelText="Suchen" placeholder="Dienste filtern" />
<Button iconDescription="Schließen" />
<Modal
  open
  modalHeading="Dienst löschen"
  primaryButtonText="Löschen"
  secondaryButtonText="Abbrechen"
/>
```

Other props change where a string is used, not its language. A prop that takes text is never concatenated with other text inside the library, so you control the word order.

## Text with numbers

Text that contains numbers is a function prop. It receives the values, and you return the whole sentence. Word order and plural forms are yours.

<Pagination
  totalItems={103}
  pageSize={10}
  pageSizes={[10, 20, 50]}
  itemsPerPageText="Elemente pro Seite:"
  itemRangeText={(min, max, total) =>
    `${min}–${max} von ${total} ${total === 1 ? "Element" : "Elementen"}`}
  pageRangeText={(_current, total) =>
    `von ${total} ${total === 1 ? "Seite" : "Seiten"}`}
  pageText={(page) => `Seite ${page}`}
  forwardText="Nächste Seite"
  backwardText="Vorherige Seite"
/>

For languages with more than two plural forms, use `Intl.PluralRules` in the function.

```js
const plural = new Intl.PluralRules("pl");
const items = { one: "element", few: "elementy", many: "elementów", other: "elementu" };

const itemRangeText = (min, max, total) =>
  `${min}–${max} z ${total} ${items[plural.select(total)]}`;
```

| Prop | Receives |
| :--- | :--- |
| `itemRangeText` on Pagination | `(min, max, total)` |
| `pageRangeText` on Pagination | `(current, total)` |
| `pageText` on Pagination, PaginationNav | `(page)` |
| `counterText` on TextInput, TextArea | `(count, max)` |
| `formatTotalSelected` on ToolbarBatchActions | `(totalSelected)` |

## Built-in labels with `translateWithId`

Some components announce labels that are not a single prop, such as the stepper buttons of NumberInput. They take `translateWithId`, a function that receives an id and returns the text for it.

```svelte
<script>
  const labels = { increment: "Erhöhen", decrement: "Verringern" };
</script>

<NumberInput translateWithId={(id) => labels[id]} />
```

A `translateWithId` you pass replaces the default for that component, so return text for every id it receives. Leave the prop unset to use the app-wide function (see [Set it once](#set-it-once)).

| Component | Props |
| :--- | :--- |
| NumberInput | `translateWithId` |
| DataTable | `translateWithId` for the expand and select controls, `tableHeaderTranslateWithId` for the sort buttons |
| StructuredListCell | `translateWithId` |
| Dropdown, ComboBox, MultiSelect | `translateWithId` for the menu icon, `translateWithIdSelection` for the clear button |
| ListBoxMenuIcon, ListBoxSelection | `translateWithId` |
| Kbd | `translateWithId` for key names. See [Keys](#keys). |

## Set it once

Passing `translateWithId` to every component does not scale. Call `setTranslateContext` once, in your root layout, and every component below it reads the function when it has no `translateWithId` of its own.

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { setTranslateContext } from "carbon-components-svelte";
  import { messages } from "$lib/messages";

  setTranslateContext((id) => messages[id]);
</script>

<slot />
```

A component picks its text in this order:

| Source | Used when |
| :--- | :--- |
| The component's `translateWithId` prop | You pass one. |
| The nearest `setTranslateContext` | The prop is unset and the function returns text for the id. |
| The English default | Neither gives text for the id. |

Call it while the layout initializes, as you do for `setContext`. A nested component can call it again to translate its own subtree. Ids are shared by all components, so one function covers the app. The string table lists them all.

`setTranslateContext` covers the ids of `translateWithId`. It does not set the `*Text` and `*Description` props. Pass those on each component, or wrap the components you use in your own.

## Keys

`Kbd`, and the shortcut keys that Button, Search, HeaderSearch and menu items show, name keys such as "Ctrl" and "Shift". Translate them once with `setKbdTranslations`, which takes the ids or a function.

```svelte
<script>
  import { setKbdTranslations } from "carbon-components-svelte";

  setKbdTranslations({ ctrl: "Strg", shift: "Umschalt" });
</script>
```

A `Kbd` reads its own `translateWithId`, then `setKbdTranslations`, then `setTranslateContext`, then English.

## Numbers, dates and lists

Components that format values take a `locale` prop and format through `Intl`, so digits, separators, month names and week starts follow the language.

| Component | What `locale` formats |
| :--- | :--- |
| NumberInput | The displayed number |
| BigNumber, Meter | Values and percentages |
| DatePicker, DateCalendar | Month and weekday names, and the first day of the week |
| MultiSelect | The sort order of the options |
| RelativeTime | "3 hours ago" |

```svelte
<DatePicker locale="de" dateFormat="d.m.Y">
  <DatePickerInput labelText="Datum" />
</DatePicker>
```

When you format a value in your own code, such as in `itemRangeText`, use `Intl.NumberFormat`, `Intl.DateTimeFormat` and `Intl.ListFormat` rather than building the string by hand.

## Text direction

Languages such as Arabic and Hebrew also need a mirrored layout. See [Right-to-left](/right-to-left).

## String table

[`i18n/strings.json`](https://github.com/carbon-design-system/carbon-components-svelte/blob/master/i18n/strings.json) lists every string a translator needs:

- Every `*Text` and `*Description` prop, with its component, type and English default. A default of `null` means the prop is unset and shows nothing. Where the default is a function, the table holds its source, so you can see the shape of the sentence.
- Every `translateWithId` prop with its ids and their English text.
- Every id in one list, which is what `setTranslateContext` receives.

The file is generated from the components. Run `bun run build:strings` after you add or change a string.

## Known limits

A few strings are not yet props and stay English. Pass `aria-label` where the component allows it, or open an issue.

| Component | String |
| :--- | :--- |
| Carousel | The "Slide 1 of 3" label of each item. Set `label` on `CarouselItem`. |
| FileUploader | The "Remove file" and "Upload complete" labels. Set `iconDescription`. |
| Toggle, Search | The fallback labels when you set no label. Set `labelText` or `aria-label`. |
| Slider | The label of the number input. Set `aria-label`. |
| InlineEdit | The read-only message. Set `readonlyToggletipText`. |
| DatePicker, DateCalendar | The "Wk" heading of the week numbers. Set `weekAbbreviation` in a `locale` object. |

To report a string that cannot be translated, [open an issue](https://github.com/carbon-design-system/carbon-components-svelte/issues).
