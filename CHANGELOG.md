# Changelog

All notable changes to this project will be documented in this file. This project follows [Conventional Commits](https://www.conventionalcommits.org/); run `bun scripts/release-changelog` to bump the version and prepend release notes.

### [0.114.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.113.0...v0.114.0) (2026-11-08)

### ⚠ BREAKING CHANGES

This release moves the library to Carbon v11. The
[migration guide](https://github.com/carbon-design-system/carbon-components-svelte/blob/8ffc1b09599d4d98aecf739911e0a9c37dda0b05/docs/migrations/v0.114.x.md)
lists every break with the steps to take.

- **box, scroll-gradient:** Box fill="layer-03" and ScrollGradient
color="layer-03" change color in four themes: white #e0e0e0 to
#f4f4f4, g10 #e0e0e0 to #ffffff, g90 #525252 to #6f6f6f, and g100
#393939 to #525252. g80 stays #6f6f6f. Use layer-accent for the old
color. ([d53f156](https://github.com/carbon-design-system/carbon-components-svelte/commit/d53f1561b99364d355cd635496a1d51e3987f6a0))
- **content-switcher:** the low contrast ContentSwitcher uses v11 colors.
The selected card is #ffffff in Gray 10, and translucent
rgba(141, 141, 141, 0.12) in Gray 80, Gray 90 and Gray 100 (was #616161,
#636363 and #474747). White does not change. The private
`--ccs-status-*` and `--ccs-content-switcher-low-contrast-background`
variables are now `--cds-status-*` and `--cds-content-switcher-*`. ([82e69b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/82e69b6415d65db454ee9e9e6e36511098f60462))
- **copy-input:** CopyInput's `selectOnFocus` prop is now
`selectTextOnFocus`. Rename it at call sites; behavior is unchanged. ([f7e0784](https://github.com/carbon-design-system/carbon-components-svelte/commit/f7e07846b64f6eedb5c26507066f481de58fce78))
- **css:** components read v11 token names. Overriding a v10
token, in CSS or through the Theme `tokens` prop (for example
"interactive-01"), no longer changes component styles. Use the v11
name ("button-primary"). ([25c1ba6](https://github.com/carbon-design-system/carbon-components-svelte/commit/25c1ba6afb7835616f50ef9ce67980e825225d6e))
- **css:** Safari 14.0 is no longer supported; Safari 14.1 is the
minimum. ([aa6df37](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa6df3763d66645bfd5da2e51104f58267c76c50))
- **data-table:** DataTableHeader includes DataTableComputedHeader, so
code that narrows a header by `empty` to DataTableNonEmptyHeader now
also gets computed headers, as the `cellHeader` and `headerDecorator`
slots do. ([218cc29](https://github.com/carbon-design-system/carbon-components-svelte/commit/218cc2939fddb43ce37061056804178ef0867c4a))
- **data-table:** zebra DataTable stripes change color. At the page
level: White #ffffff to #e0e0e0, Gray 10 #f4f4f4 to #e0e0e0, Gray 80
#525252 to #6f6f6f; Gray 90 and Gray 100 stay the same. Inside a
Layer every theme changes: the stripe is now layer-accent-02 or -03
instead of layer-02. Set $data-table-zebra-color to keep the old color. ([73a6fdb](https://github.com/carbon-design-system/carbon-components-svelte/commit/73a6fdb28d6bf8e92c70e24d233a2033c792191f))
- **date-picker:** `bind:calendar` is a `DatePickerCalendar`, not the
engine instance; reach the old object through `calendar.engine`. ([799b8b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/799b8b4ea05fcac04822d751836abeb21a520ebc))
- **date-picker:** app CSS or tests that select flatpickr's classes must
use the bx--date-picker__* names. ([88a9f0f](https://github.com/carbon-design-system/carbon-components-svelte/commit/88a9f0f9568a87273cc74e4d50bf4c7a5752ce1b))
- **date-picker:** flatpickr is no longer installed with the package, so an
app that imports a flatpickr locale module or plugin must depend on
flatpickr itself; the module objects and plugins still work. The time
picker options, `disableMobile: false`, and `monthSelectorType:
"dropdown"` warn once and are ignored. `bind:calendar` is typed as
`CalendarInstance`, which lacks a few of flatpickr's internal members. ([ea2518b](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea2518b281a8c048614ef6fe5529e7335b9f2960))
- **date-picker:** flatpickrProps is removed; use the matching props. The
calendar.engine getter is removed. ([0553ab4](https://github.com/carbon-design-system/carbon-components-svelte/commit/0553ab4a4be38f091162b0f883cd716864d7e67a))
- **date-picker:** the calendar's role and accessible name changed, and
days sit in a bx--date-picker__week row instead of directly in the
month's container. ([27e0f91](https://github.com/carbon-design-system/carbon-components-svelte/commit/27e0f91f3a04bbf73eb29f4eae97606ff6269a97))
- **inline-loading:** with `delay > 0` and status "active", the server HTML
and the first client render hold a hidden spinner where they rendered
nothing. A status set while a shown spinner holds appears up to 500 ms
later, and `success` fires `successDelay` after the checkmark shows. ([4081576](https://github.com/carbon-design-system/carbon-components-svelte/commit/40815766d4da0f986189d53fc77ada0034980831))
- **loading:** with `delay > 0` and `active`, the server HTML and the
first client render hold a hidden spinner where they rendered nothing.
A shown spinner stays up to 500 ms after `active` turns `false`. ([355b13a](https://github.com/carbon-design-system/carbon-components-svelte/commit/355b13a9fcf8d10cfb05e37afb5522fe31143b45))
- **modal:** a Modal without passiveModal, and a ComposedModal with
a ModalFooter, no longer close when the user clicks outside them. Set
preventCloseOnClickOutside={false} to restore the old behavior. An
explicit true or false still overrides the rule for any modal. ([5ccb5db](https://github.com/carbon-design-system/carbon-components-svelte/commit/5ccb5dbcab2fb07e7cb321a742031301351a6701))
- **modal:** content inside a modal body now sits one Layer level
up. Tiles, tables, accordions and nested Layers step up a surface.
Field backgrounds stay the same. Field hover, bottom borders and the
NumberInput divider now use the level 2 tokens, as in v11. A modal
inside a Layer no longer inherits its level. ([993f8de](https://github.com/carbon-design-system/carbon-components-svelte/commit/993f8de087c53787fadb2c627263a064d7218257))
- **modal:** use an h2 heading, as in v11 ([8e099bb](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e099bb57ecfc8067a58e24657271b7a49dca653))
- **notification:** InlineNotification and ToastNotification default to
role="status", so screen readers announce them politely. Pass
role="alert" for the old behavior, as for urgent errors. Tests that
query getByRole("alert") for these notifications need updating. ([7470ea8](https://github.com/carbon-design-system/carbon-components-svelte/commit/7470ea81bfdf9b1fb0e9bf0b0c92e3c51f0edc9f))
- **recursive-list:** an explicit node type without `nodes`, such as
`RecursiveList<{ text: string }>`, no longer takes children; add
`nodes?` to the type. ([322df16](https://github.com/carbon-design-system/carbon-components-svelte/commit/322df1606383b60279b2a40f8060bfe37ffd88b7))
- **search:** a Search without `size` is now 40px tall. Set
`size="xl"` to keep the 48px height. ([8ede5de](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ede5dec7d36eb831a1a7eff1c63539427c2ba67))
- **tag:** tags no longer have an outer margin. Spacing between
tags now comes from the container, such as a horizontal Stack or a
TagSet. The `inline` prop has no effect and is deprecated. ([a7de3c2](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7de3c20e4b93a20446133f8521e2650ecbea9fb))
- **theme:** about 20 to 30 token values change per theme, mostly
hover, active, selected and disabled colors, border-subtle, overlay
and skeleton colors. Components look the way the v11 kit draws them. ([be16284](https://github.com/carbon-design-system/carbon-components-svelte/commit/be1628479d67129d93d275993eeddbb8c496706d))
- **theme:** component token values change. button-primary-hover
is #0050e6 in every theme (was #0353e9; g80 #0151e4).
button-tertiary-hover is #0050e6 in white and g10 (was #0353e9).
button-secondary-hover is #474747 in white and g10 (was #4c4c4c) and
#5e5e5e in g90 and g100 (was #606060). button-disabled is
rgba(141, 141, 141, 0.3) in g90 and g100 (was #6f6f6f and #525252),
and disabled buttons now draw their border in it. In white, g10 and
g80, tag-color-* moves from the 80 to the 70 step (red #750e13 to
#a2191f), or to the 100 step for gray, cool-gray and warm-gray (gray
#393939 to #161616), and tag-hover-* from the 30 step to the 20 hover
step (red #ffb3b8 to #ffc2c5). In g90 and g100 the gray, cool-gray and
warm-gray tag-color-* moves from the 20 to the 10 step (gray #e0e0e0
to #f4f4f4). notification-background-warning is #fcf4d6 in white and
g10 (was #fdf6dd). ([f5cb278](https://github.com/carbon-design-system/carbon-components-svelte/commit/f5cb2782a265bd7869dbb6e3c6e8d3c71dcace76))
- **theme:** darken Gray 80 zebra rows and fields for text contrast ([9e2dbd7](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e2dbd7ab8260149664e391539d594b42db2c436))
- **theme:** give Gray 80 dark tags ([131efc0](https://github.com/carbon-design-system/carbon-components-svelte/commit/131efc0c103e6f41e84f8b080c4034647db50248))
- **theme:** make Gray 80's state overlays translucent ([95f05a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/95f05a0acbfb25549064acd131a4231014225894))
- **theme:** step Gray 80 layer states like Gray 90's ([c8d1f26](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8d1f2686a8a433fd6e6b1cc45d2fb02a68b45d7))
- **theme:** Theme no longer takes a Tokens type parameter.
`tokens` only accepts CarbonToken keys; cast the object to set a
custom property outside the list. ([5bbe4d6](https://github.com/carbon-design-system/carbon-components-svelte/commit/5bbe4d67e3d74ae245d4107bb7abc295d9830db8))
- **types:** Select's `selectedValue` context store is typed
`Writable<string | number | null | undefined>`, and LinkDownload's
`download` takes `data: string | Blob | undefined` and
`type: string | undefined`. ([e506bb4](https://github.com/carbon-design-system/carbon-components-svelte/commit/e506bb4d6c9fec06d25d04dbf4f2ab26df0f71c3))
- **types:** the CheckboxGroup, RadioButtonGroup, TileGroup and
SelectableTileGroup context stores above are typed
`Readable<T | undefined>`. ([47ba526](https://github.com/carbon-design-system/carbon-components-svelte/commit/47ba52637ffc225b209c668b76b68227401f52cc))
- the `light` prop is gone from TextInput,
PasswordInput, TextArea, NumberInput, Select, Search, SearchMenu,
ComboBox, Dropdown, MultiSelect, ListBox, DatePicker, TimePicker,
Slider, RangeSlider, CopyInput, PinCodeInput, CodeSnippet,
OverflowMenu, Popover, and the Tile variants. Wrap the component in
<Layer> instead. The --light modifier classes are gone too. ([d5d441f](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5d441f66520403b0f7d5b986610f51c53147b3b))
- v10 token names are no longer declared, so
var(--cds-ui-01) and the other v10 names resolve to nothing. Text and
Heading `type` values and .bx--type-* classes use v11 names, and
caption-01/caption-02 are removed (use label-01/label-02). Text's
default type is body-01 (same style as body-long-01). ([a8f8401](https://github.com/carbon-design-system/carbon-components-svelte/commit/a8f8401e22c9595685a6661c604aa70f32788b18))

#### v10 to v11 token names

| v10 | v11 |
| :--- | :--- |
| ui-background | background |
| ui-01, ui-02 | layer-01, layer-02 |
| ui-03 | border-subtle-01 (borders), layer-accent-01 (fills) |
| ui-04 | border-strong-01 |
| text-01 to text-05 | text-primary, -secondary, -placeholder, -on-color, -helper |
| icon-01 to icon-03 | icon-primary, -secondary, -on-color |
| interactive-01 | button-primary, background-brand |
| interactive-04 | interactive, border-interactive |
| support-01 to support-04 | support-error, -success, -warning, -info |
| hover-ui | layer-hover-01 |
| disabled-02 | text-disabled, icon-disabled, button-disabled |
| body-short-01, body-long-01 | body-compact-01, body-01 |
| productive-heading-01 to -07 | heading-compact-01, -02, heading-03 to -07 |
| expressive-heading-03 to -06 | fluid-heading-03 to -06 |
| display-01, quotation-01 | fluid-display-01, fluid-quotation-01 |

The guide has the full table:
[1. Color tokens](https://github.com/carbon-design-system/carbon-components-svelte/blob/8ffc1b09599d4d98aecf739911e0a9c37dda0b05/docs/migrations/v0.114.x.md#1-color-tokens).

#### Changes without a breaking marker

These commits read as plain fixes, so the list above doesn't flag them.
Each can change what your code or tests see.

- **SearchMenu** fills the field with the picked item's `text`, not its `value`. This changes `bind:value` and the submitted form value ([#4807](https://github.com/carbon-design-system/carbon-components-svelte/pull/4807)).
- **HeaderSearch:** the `select` detail is a union. Code that reads `e.detail.selectedResult` directly fails `svelte-check` ([#5129](https://github.com/carbon-design-system/carbon-components-svelte/pull/5129)).
- **Types:** icon props take a component or `null`. Modal `secondaryButtons` `kind` and TableHeader `scope` are stricter ([#5121](https://github.com/carbon-design-system/carbon-components-svelte/pull/5121), [#5127](https://github.com/carbon-design-system/carbon-components-svelte/pull/5127)).
- **PaginationNav:** the page buttons are named "Page 3", and the select is "Select page number" ([#4800](https://github.com/carbon-design-system/carbon-components-svelte/pull/4800)).
- **DataTable cells** use one `bx--table-cell` class in place of `.bx--data-table td`. App CSS that lost before can now win ([#4149](https://github.com/carbon-design-system/carbon-components-svelte/pull/4149)).
- **`color-scheme`** on `:root` overrides an app's `html { color-scheme }` ([#4999](https://github.com/carbon-design-system/carbon-components-svelte/pull/4999), [#5099](https://github.com/carbon-design-system/carbon-components-svelte/pull/5099)).
- **TableBody** no longer sets `aria-live="polite"`. Rows that update in place are no longer read out. Pass `aria-live="polite"` to keep it. DataTable now announces a sort once, through `sortStatusText` ([#5303](https://github.com/carbon-design-system/carbon-components-svelte/pull/5303)).
- **ComboBox:** an `input` event on an unfocused input no longer opens the menu. It selects an exact label match or clears the selection. Tests that call `fireEvent.input` without focus first see a change ([#4411](https://github.com/carbon-design-system/carbon-components-svelte/pull/4411)).
- **`aria-describedby`** from your code now joins the built-in helper, warning and error ids in place of replacing them. `aria-label`, `aria-labelledby` and `aria-describedby` moved from wrappers to the focusable element in about 30 components. Markup snapshots change ([#4399](https://github.com/carbon-design-system/carbon-components-svelte/pull/4399), [#4400](https://github.com/carbon-design-system/carbon-components-svelte/pull/4400), [#4401](https://github.com/carbon-design-system/carbon-components-svelte/pull/4401), [#4402](https://github.com/carbon-design-system/carbon-components-svelte/pull/4402)).
- **Read-only fields:** read-only Slider and RangeSlider render their values as text, so the inputs fire no `focus` or `blur` and the label focuses nothing. Read-only NumberInput and `TextInput type="number"` render `type="text"`, so `getByRole("spinbutton")` finds nothing ([#4422](https://github.com/carbon-design-system/carbon-components-svelte/pull/4422), [#4424](https://github.com/carbon-design-system/carbon-components-svelte/pull/4424), [#4426](https://github.com/carbon-design-system/carbon-components-svelte/pull/4426)).
- **Clipped menus and tooltips** move to a portal for that open when an `overflow` box would cut them off. This covers Dropdown, ComboBox, MultiSelect, OverflowMenu, Tooltip, the DatePicker calendar and icon tooltips. App CSS that styles them inside their container stops matching. Pass `portalMenu={false}` or `portalTooltip={false}` to opt out ([#4712](https://github.com/carbon-design-system/carbon-components-svelte/pull/4712), [#4713](https://github.com/carbon-design-system/carbon-components-svelte/pull/4713), [#5096](https://github.com/carbon-design-system/carbon-components-svelte/pull/5096)).
- **OverflowMenu:** the trigger is named "Options" and shows a tooltip. Tests that find it by "menu" need updating ([#4926](https://github.com/carbon-design-system/carbon-components-svelte/pull/4926)).
- **ToastNotification:** a `NotificationActionButton` anywhere in a toast is a small tertiary button ([#4986](https://github.com/carbon-design-system/carbon-components-svelte/pull/4986)).
- **Icon tooltips** close 100ms after the pointer leaves, and the pointer can move onto them. TooltipIcon `leaveDelayMs` was 300 ([#5012](https://github.com/carbon-design-system/carbon-components-svelte/pull/5012)).
- **InterstitialScreen:** the title is an `h1` full screen and an `h2` in a modal. It was an `h3` ([#5027](https://github.com/carbon-design-system/carbon-components-svelte/pull/5027)).
- **Tests:** the Tabs navigation landmark moved to the tab list. Icon-only buttons set `aria-pressed` only when they are selected. The Loading spinner has no live region of its own. See [8. Tests](https://github.com/carbon-design-system/carbon-components-svelte/blob/8ffc1b09599d4d98aecf739911e0a9c37dda0b05/docs/migrations/v0.114.x.md#8-tests).

### Features

- **accordion:** derive item ids from an `id` prop ([f6bd844](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6bd8444da25e73021e49f4bc0d8b2bcfec05de4))
- **action-set:** fill with the layer color and warn about misused actions ([cebd80e](https://github.com/carbon-design-system/carbon-components-svelte/commit/cebd80ed2b32cf41894191c720116285970b9811))
- **ai-label:** add `AILabel` and a `decorator` slot on fields ([4cca5ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/4cca5edbcf8de2d280d99c1b0ac4fb263f48fd52))
- **ai-label:** add `decorator` slots to DataTable and modals ([9f39266](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f39266d179c4cf5a6e43564c23d3034696c50e4))
- **ai-label:** add a `decorator` slot to selection controls, tags, and tiles ([54b3881](https://github.com/carbon-design-system/carbon-components-svelte/commit/54b388142c63285d0ee30363eeff64d970d34644))
- **big-number:** add totalSeparatorText ([c8b9bc8](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8b9bc85618517481ff197b087e47b31ea47e9b6))
- **big-number:** follow Carbon v11's type scale and add an action slot ([a47de92](https://github.com/carbon-design-system/carbon-components-svelte/commit/a47de92ae7413cf214aacab1d2c0aa7985305399))
- **box:** add logical start and end padding and margin ([e633162](https://github.com/carbon-design-system/carbon-components-svelte/commit/e633162638f7b5372309be01f0c8a37ce5c4a2c2)), closes [#5008](https://github.com/carbon-design-system/carbon-components-svelte/issues/5008)
- **box:** add position "absolute" and display "inline-block" and "none" ([0c55495](https://github.com/carbon-design-system/carbon-components-svelte/commit/0c55495468ca72ccfe28d162d45ea7dff2950d9d))
- **button:** add iconOnly to choose icon-only explicitly ([f8e08a7](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8e08a72eae964201f72530a89ae7d2c88a220a3))
- **button:** add loadingDelay ([e9a12dc](https://github.com/carbon-design-system/carbon-components-svelte/commit/e9a12dc922cbe8bbf1b9cb32431a8e906b0b5878))
- **button:** add tooltipAlign to Button ([cc86100](https://github.com/carbon-design-system/carbon-components-svelte/commit/cc861000728b5c5340f53c84b66961ef9287e907))
- **button:** show and bind a keyboard shortcut ([711a80b](https://github.com/carbon-design-system/carbon-components-svelte/commit/711a80b3d0c52ba2112fc37057ebc74028014596))
- **button:** take the height of a sized Form ([7b5d949](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b5d949af7129e518e73899a5b28dbb6b757a245))
- **callout:** add Callout for static, non-dismissible notices ([23324ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/23324cad6942500674d677f7e9cdebcbcda98b00))
- **card:** add Card component ([4000c76](https://github.com/carbon-design-system/carbon-components-svelte/commit/4000c76376f95603e1948d62c8d96d5780833812))
- **card:** add labelChildren slot to CardTitle ([987eb8a](https://github.com/carbon-design-system/carbon-components-svelte/commit/987eb8a69adc913c8ce1cb8aae63556d08a84ba4))
- **carousel:** derive the viewport id from an `id` prop ([7b70371](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b70371d6ba1ac03e98881821f801dbf4276cf0e))
- **chat-button:** add ChatButton and ChatButtonSkeleton ([d64ca99](https://github.com/carbon-design-system/carbon-components-svelte/commit/d64ca996b50b5ed531be1d11cd9950c3768b411d))
- **chat:** add ChatLog, ChatMessage and ChatDivider ([cbf9677](https://github.com/carbon-design-system/carbon-components-svelte/commit/cbf9677c50a6a9aa85635821aa05caf12d8edeb6))
- **checkbox-group:** add `orientation` to lay checkboxes out in a row ([094537a](https://github.com/carbon-design-system/carbon-components-svelte/commit/094537ad5bd938e37c76e0359d97279a7ef6b8a0))
- **checkbox:** add `noMargin` to omit the stack margins ([4109106](https://github.com/carbon-design-system/carbon-components-svelte/commit/41091064d9d038cdd51484e3e82fe668f81143ab))
- **clickable-tile:** add icon prop ([75dfdc9](https://github.com/carbon-design-system/carbon-components-svelte/commit/75dfdc99bfcb56fabcd6524fac0cde5fad3e6147))
- **code-snippet, file-uploader:** add fullWidth to fill the container ([3dd722d](https://github.com/carbon-design-system/carbon-components-svelte/commit/3dd722db0f9314e69e536359b22e0ac7afb5ea7e))
- **code-snippet:** add tooltipAlign to CodeSnippet ([5230d77](https://github.com/carbon-design-system/carbon-components-svelte/commit/5230d77aea92bdbf12d89846f237468c074e510f))
- **code-snippet:** size CodeSnippetSkeleton by its code's rows ([77e5305](https://github.com/carbon-design-system/carbon-components-svelte/commit/77e5305912eaef42e262de64a18e5a01274baa96))
- **combo-box:** add iconEnd slot ([b71bd29](https://github.com/carbon-design-system/carbon-components-svelte/commit/b71bd29fec48bcfb9f327302c4ea9575fb97fd39))
- **combo-box:** group items under headers ([a575ee4](https://github.com/carbon-design-system/carbon-components-svelte/commit/a575ee4c38742e6535a02ac262c12c04e1eb3704))
- **combo-box:** show a visible empty state when the filter matches nothing ([6b0fdcb](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b0fdcb89614dec3f8e233d900a00120efa1657f))
- **combo-button:** add tooltipAlign to ComboButton ([d830ed3](https://github.com/carbon-design-system/carbon-components-svelte/commit/d830ed370553c31e9e1e641b7a9bad24a6d5e690))
- **composed-modal:** add `lazy` to build the content on first open ([a08359e](https://github.com/carbon-design-system/carbon-components-svelte/commit/a08359e6ef34a7a6f3b2c4d8b67b2313e9b98502))
- **composed-modal:** derive header and body ids from an `id` prop ([4564843](https://github.com/carbon-design-system/carbon-components-svelte/commit/4564843e54b87d80c78b4799f4132758b33082da))
- **confirm-modal:** add ConfirmModal ([d1cb9d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/d1cb9d21d7ccae13ddd3eac3764057ea93e35710))
- **contained-list:** add selected for the current item of a master list ([749c954](https://github.com/carbon-design-system/carbon-components-svelte/commit/749c95492c42436a773fb943ca508a14c2781a1c))
- **content-switcher:** add `autoWidth` to size switches to their labels ([b4ebc90](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4ebc90fd67e18eeb7e6d53c36a9889cb04794da))
- **content-switcher:** add ContentSwitcherSkeleton ([f3c08c1](https://github.com/carbon-design-system/carbon-components-svelte/commit/f3c08c12942e8a6d14db927a13a07ba498a21047))
- **context-menu:** add shortcutChildren slot to ContextMenuOption ([02805fb](https://github.com/carbon-design-system/carbon-components-svelte/commit/02805fbf5332a6ec9f5eb24db505b56f8c9105de))
- **copy-button:** add tooltipAlign to CopyButton ([150e3a4](https://github.com/carbon-design-system/carbon-components-svelte/commit/150e3a49131de5b85a9b951a6407399b1969be4e))
- **copy-input:** add maskedValue to show a mask and copy the value ([7c48972](https://github.com/carbon-design-system/carbon-components-svelte/commit/7c4897295334c6a670416f897a1713dd44ac39ce))
- **copy-input:** add tooltipAlign to CopyInput ([a2d7f4a](https://github.com/carbon-design-system/carbon-components-svelte/commit/a2d7f4a6a231326a60610ea7f1287bd643c5e329))
- **copy-text:** add CopyText ([bd001e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/bd001e567befc2fea22f68b39ba0d2edcc350fe7))
- **copy-text:** add tooltipAlign to CopyText ([5f1eeea](https://github.com/carbon-design-system/carbon-components-svelte/commit/5f1eeeacb2c5610de9a5241978d627d681ebcd81))
- **countdown:** add Countdown for the time left on a hold or session ([59f1a6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/59f1a6adf92be444938f4687f8c02cd204038bcb))
- **css:** add the Carbon v11 numbered layer and border tokens ([67d7947](https://github.com/carbon-design-system/carbon-components-svelte/commit/67d794763ed8ec4a3f79e7ddd1d5afd354074b63))
- **css:** declare the theme's tokens on :root in single-theme sheets ([9e4a7d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e4a7d21973e66b39560b4e083be6c6c57383195))
- **css:** mirror forward and back icons in RTL ([535f9ee](https://github.com/carbon-design-system/carbon-components-svelte/commit/535f9eed379fb8afba99447df0a80d79989d6470))
- **data-table:** add cellClass for per-cell classes ([aba7949](https://github.com/carbon-design-system/carbon-components-svelte/commit/aba7949582e5aa33c02715f6c9c8fd03c8b44c86))
- **data-table:** add translateWithId for the expand and select controls ([8425199](https://github.com/carbon-design-system/carbon-components-svelte/commit/842519923b1f3618255a28d8f55f75d6fcc3057f))
- **data-table:** announce the sort result from a status region ([3d94b0c](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d94b0c85fbb8f8b1e3c7460721fa5963466b151))
- **data-table:** derive its internal ids from an `id` prop ([1756ca1](https://github.com/carbon-design-system/carbon-components-svelte/commit/1756ca16ae1b20ce7adb853f50062a8c98efedc0))
- **data-table:** give an AI column's cells the AI gradient ([e4e395d](https://github.com/carbon-design-system/carbon-components-svelte/commit/e4e395d1cce8672640ac10e0e0ed01e522df3ce2))
- **data-table:** name an empty header with its value ([52cefe7](https://github.com/carbon-design-system/carbon-components-svelte/commit/52cefe726d55188457c40df363854d9456707910))
- **date-picker:** add `firstDayOfWeek` and `weekNumbers` props ([cb9467c](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb9467cf603340c331f4b5d148b4a7d90a484021))
- **date-picker:** add `fullWidth` to fill the parent's width ([8b657b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/8b657b1a6aebc597f18741dc87755d17c6754732))
- **date-picker:** add a `view` event with the dates on show ([b1c101a](https://github.com/carbon-design-system/carbon-components-svelte/commit/b1c101adc2a4a8aa55209903be1c12ee706e653c))
- **date-picker:** add a quarter picker ([6e42940](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e42940118bcd95d6669646822adb314396eca91))
- **date-picker:** add calendar keys and announce the shown month ([879ab24](https://github.com/carbon-design-system/carbon-components-svelte/commit/879ab24efd36702c27d3f3e83430a647162a4280))
- **date-picker:** add DateCalendar, a calendar rendered by Svelte ([fe220cd](https://github.com/carbon-design-system/carbon-components-svelte/commit/fe220cdff15d77c3a0c06d6413a3dc92865083df))
- **date-picker:** add props for every calendar option ([f27395d](https://github.com/carbon-design-system/carbon-components-svelte/commit/f27395dd0b7adc2256b322ebcd83ff7a511f65dc))
- **date-picker:** take datePickerType on DatePickerSkeleton ([01bac9d](https://github.com/carbon-design-system/carbon-components-svelte/commit/01bac9de8f96b8a75f025d287395ca50f20d4b4b))
- **description-list:** add a summary layout and a total item ([7f30251](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f302517134a93cb8fd2838217e1b5c8a3a0c404))
- **description-list:** add a term slot ([8b07c80](https://github.com/carbon-design-system/carbon-components-svelte/commit/8b07c80152aabb3dd9ca4952c90e9ae80b356421))
- **description-list:** add divider to rule off an item ([716dcb0](https://github.com/carbon-design-system/carbon-components-svelte/commit/716dcb03affce1b0ebf7ae4f9724f35f237ec3e7))
- **disclosure:** derive the content id from an `id` prop ([883240d](https://github.com/carbon-design-system/carbon-components-svelte/commit/883240d55967361ef6c0d5e40eb7c0c3e671a52f))
- **dropdown:** add iconEnd slot ([5b08df6](https://github.com/carbon-design-system/carbon-components-svelte/commit/5b08df6dea79218296f67b5ae68c64b9476c4da5))
- **dropdown:** group items under headers ([8433732](https://github.com/carbon-design-system/carbon-components-svelte/commit/8433732e7a7c9f31d390c7f774a69a8f49780997))
- **dropdown:** show an empty state when there are no items ([cb2a90e](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb2a90e369055284a5c6d0958ed25bfd4d4c9783))
- **empty-state:** add EmptyState for panels with nothing to show ([c9e9e9e](https://github.com/carbon-design-system/carbon-components-svelte/commit/c9e9e9ec04d25ed8dee9c1895803dd58433215dc))
- **expandable-tile:** dispatch a cancelable `toggle` event ([bb7a8b8](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb7a8b85a1b54d87b0cfb5bc1306313f42eaf563))
- **expandable-tile:** forward `keydown` ([f2a6532](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2a65321a4d193a4ed966d1d1f0ad5058eefc171))
- **file-uploader:** add a capture prop to open the camera ([9f608a6](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f608a61a2597e95d79988a07746245fec44d150))
- **file-uploader:** add a directory prop to select a folder ([1703860](https://github.com/carbon-design-system/carbon-components-svelte/commit/1703860f72b0430d787e95dbe76338f883e412ca))
- **file-uploader:** add fileCountText to FileUploaderButton ([754ed7f](https://github.com/carbon-design-system/carbon-components-svelte/commit/754ed7fb463f17714f108a78a0ca2640630b542a))
- **file-uploader:** add FileDownloadItem for files to download ([68a9c4d](https://github.com/carbon-design-system/carbon-components-svelte/commit/68a9c4d2b99aa2cfa224a1ccb675c5a03b9ba44d))
- **file-uploader:** add minFileSize to reject empty files ([def2d8a](https://github.com/carbon-design-system/carbon-components-svelte/commit/def2d8a0dee748cc766b9053ae3f918a2a90c144))
- **file-uploader:** add tooltipAlign to FileUploaderButton ([1996a8a](https://github.com/carbon-design-system/carbon-components-svelte/commit/1996a8aecea4c9320687e198a4312cd261aa3fae))
- **file-uploader:** derive the file input id from an `id` prop ([466ebe1](https://github.com/carbon-design-system/carbon-components-svelte/commit/466ebe14fe58ff952f32da543f8253520a9b5a65))
- **file-uploader:** inherit the button size from Form ([e466e01](https://github.com/carbon-design-system/carbon-components-svelte/commit/e466e01910f97d59ef2c321610fa4ac5684b9c07))
- **file-uploader:** link the description to the add button ([cc19b66](https://github.com/carbon-design-system/carbon-components-svelte/commit/cc19b667db3a6f07ccf61c83b883d99a73d59a0a))
- **file-uploader:** show the full name of a truncated file ([7be4df8](https://github.com/carbon-design-system/carbon-components-svelte/commit/7be4df8389fb679988714285cbe0a94a61a9150a))
- **form-group:** derive the message id from an `id` prop ([7879fe7](https://github.com/carbon-design-system/carbon-components-svelte/commit/7879fe7f0762ae0851184f179c3d65de286d032c))
- **form-group:** describe the fieldset with nested form parts ([ebba19b](https://github.com/carbon-design-system/carbon-components-svelte/commit/ebba19b23baf255dc77056e88e752ec2da4a0742))
- **form-helper-text:** add FormHelperText component ([98321a2](https://github.com/carbon-design-system/carbon-components-svelte/commit/98321a2f69cfe9f92b97b69e7edfb920be4cbfc8))
- **form-item:** associate child labels with a control ([bf2364f](https://github.com/carbon-design-system/carbon-components-svelte/commit/bf2364f58798d6c134e4169de66444675205a6f9))
- **form-item:** expose label id, form size, and fluid slot props ([a15e47d](https://github.com/carbon-design-system/carbon-components-svelte/commit/a15e47d3670b1d38a5daff1d52ec5340b462057b))
- **form-label:** add `for` prop ([c86a152](https://github.com/carbon-design-system/carbon-components-svelte/commit/c86a152e230b62a768d0aa66d1657da9db8a2d43))
- **form-requirement:** add FormRequirement component ([330ff44](https://github.com/carbon-design-system/carbon-components-svelte/commit/330ff445e16ba1b6c9e58373aa9efaca39db41bd))
- **form:** add `size` that every field inherits ([39c8daf](https://github.com/carbon-design-system/carbon-components-svelte/commit/39c8daf794e88442c5717705728e7fc85ebc3d21))
- **grid:** add CssGrid and CssColumn, v11's display:grid layout ([c0f21d3](https://github.com/carbon-design-system/carbon-components-svelte/commit/c0f21d3ec17c4e4b203bdde701ae5ab16ddd2d8f))
- **grid:** align a CssColumn on its own ([accb74b](https://github.com/carbon-design-system/carbon-components-svelte/commit/accb74b6165467c7707bb9dc05f9ee3fb38c2562))
- **header-nav-menu:** add textChildren slot ([c2be34d](https://github.com/carbon-design-system/carbon-components-svelte/commit/c2be34d561682d3b70c78e2969114c95809a169b))
- **header-search:** derive its child ids from an `id` prop ([b805ae6](https://github.com/carbon-design-system/carbon-components-svelte/commit/b805ae6a20b5d07e8589cce0c947d78d310ce56a))
- **header-search:** show and bind a keyboard shortcut ([d6e6760](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6e6760d38cad331a1f3abe3ea8bf3ec402415d1))
- **heading:** forward rest props from Section to its element ([6a00ac8](https://github.com/carbon-design-system/carbon-components-svelte/commit/6a00ac8ab864a0038cdeef9c5db4294568154ecc))
- **icon-indicator:** add hideLabel, and keep the icon's size ([6c6151f](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c6151f4b1a9f03941c479442876f747e7e3fa7e))
- **icon-indicator:** read the v11 status tokens ([52d8903](https://github.com/carbon-design-system/carbon-components-svelte/commit/52d8903c22cfae605a63d6fd3117e3dfc46aeef8))
- **image-loader:** add `lazy` to load images near the viewport ([4b03a78](https://github.com/carbon-design-system/carbon-components-svelte/commit/4b03a789f3f12dbb567ed063d98f93eb063183a5))
- **inline-edit:** add InlineEdit component ([f980832](https://github.com/carbon-design-system/carbon-components-svelte/commit/f980832a47c1bc70a59f4f5cb96eba0a78addd66))
- **inline-loading:** add size="sm" for a status in small text ([77a0792](https://github.com/carbon-design-system/carbon-components-svelte/commit/77a079258047c64c40bc441b78dc2e50624fe893))
- **inline-notification:** add `fullWidth` to fill the parent ([f1e42b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/f1e42b46da2fdb4e392331b7a7649e8ad03ad0d3))
- **input-group:** add InputGroup to attach buttons and fields to an input ([a31ee34](https://github.com/carbon-design-system/carbon-components-svelte/commit/a31ee345f1707537fbb9c72db378f86659e79cf4))
- **interstitial-screen:** add stepLabelText for untitled steps ([902e553](https://github.com/carbon-design-system/carbon-components-svelte/commit/902e5534bc2eed833896799d6494f3c8bbf85acd))
- **interstitial-screen:** add stepText and statusText to the header ([9434564](https://github.com/carbon-design-system/carbon-components-svelte/commit/94345643b90a8e006f302f238e73ec2d344fef94))
- **interstitial-screen:** follow Carbon v11's header, footer and headings ([af2fe01](https://github.com/carbon-design-system/carbon-components-svelte/commit/af2fe0160e18bf6811df3d9aa0827eee6c21fe61))
- **kbd:** add Kbd ([d2bc15f](https://github.com/carbon-design-system/carbon-components-svelte/commit/d2bc15f768558e7c40230df6f47085c16b711fea))
- **keyboard-shortcut:** add the shortcut helpers ([032c2cd](https://github.com/carbon-design-system/carbon-components-svelte/commit/032c2cd0b2019c67e0113c9b2eb003b85f1dfbf1))
- **layer:** add Layer and read contextual tokens in components ([0df3208](https://github.com/carbon-design-system/carbon-components-svelte/commit/0df32087382ac4427dc48650160a02c2480bd517))
- **layout-direction:** set the writing direction for part of a page ([3a65a95](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a65a95cc6d1257e422a5a3fe8ba3733ca1912d0))
- **lazy-mount:** add LazyMount to defer rendering until near the viewport ([569b71c](https://github.com/carbon-design-system/carbon-components-svelte/commit/569b71c558a1629863708aaf5b38b2f4232aa4ad))
- **link:** expose link color custom properties ([b9d9fc4](https://github.com/carbon-design-system/carbon-components-svelte/commit/b9d9fc4a9d157cf3355e38fb97c58ad728e5f9af))
- **list-box:** add a `loading` state to the menu ([eaf7b5e](https://github.com/carbon-design-system/carbon-components-svelte/commit/eaf7b5ea77588710a68c49e5296745d4dfe1acc1))
- **list-box:** dispatch an `open` event from Dropdown, ComboBox, and MultiSelect ([5c14862](https://github.com/carbon-design-system/carbon-components-svelte/commit/5c14862c280b3623272768a3587b9e7ec8ac2faf))
- **list-box:** keep options in view during fast scrolls ([148c73a](https://github.com/carbon-design-system/carbon-components-svelte/commit/148c73a8a333d374aee795d8c2e88776dd45b19c))
- **list-box:** move the highlight a page with PageUp/PageDown ([a19af68](https://github.com/carbon-design-system/carbon-components-svelte/commit/a19af680be7fcfc18c0c5e0bcd5b956277250f70))
- **list-box:** show the invalid state for an empty required list box ([a758f16](https://github.com/carbon-design-system/carbon-components-svelte/commit/a758f161fb92faa31c411859c5e885ba95db6330))
- **list-box:** support `required` on Dropdown, ComboBox, and MultiSelect ([d471ea9](https://github.com/carbon-design-system/carbon-components-svelte/commit/d471ea962b362fface524fb481e6648cc8c7a6a6))
- **menu:** add shortcutChildren slot to MenuItem ([cf09de9](https://github.com/carbon-design-system/carbon-components-svelte/commit/cf09de9794e68bf6f6bcfe670e96333372c87089))
- **menu:** show a keyboard shortcut on menu items ([cea4b80](https://github.com/carbon-design-system/carbon-components-svelte/commit/cea4b80bfaf89c42e7b46a04abf7f28f1909d8e3))
- **meter:** add `locale` for the generated number text ([c48fdbd](https://github.com/carbon-design-system/carbon-components-svelte/commit/c48fdbdeb12fb5b7972b9a316d9e4eec5ed489f8))
- **meter:** derive helper, thresholds, and status ids from `id` ([eedf91a](https://github.com/carbon-design-system/carbon-components-svelte/commit/eedf91a7526ba6ad54cb9a2d13636bea6228a676))
- **modal:** add `lazy` to build the content on first open ([f718bea](https://github.com/carbon-design-system/carbon-components-svelte/commit/f718bea4079121a5d0deeba056309a4d3be4055b))
- **modal:** add labelChildren slot ([697c7ac](https://github.com/carbon-design-system/carbon-components-svelte/commit/697c7ac1956a48c542623500be3cf83efbd48ad9))
- **modal:** add loadingStatus ([5cf3214](https://github.com/carbon-design-system/carbon-components-svelte/commit/5cf3214d6e4e2814e0afbb6ff14be64a4f48f713))
- **modal:** show the close button tooltip ([f67d2a6](https://github.com/carbon-design-system/carbon-components-svelte/commit/f67d2a67a133f9d1707838f2bab650d5ba73c5b4))
- **multi-select:** add `selectionDisplay="tags"` ([28e9475](https://github.com/carbon-design-system/carbon-components-svelte/commit/28e9475442524e40c7e5a6f3673c0a747e89bc24))
- **multi-select:** add selectionCountText ([358640d](https://github.com/carbon-design-system/carbon-components-svelte/commit/358640d95d60ecfa797293a3cef11191fd696d71))
- **multi-select:** open collapsed tags in a popover ([3dbfd21](https://github.com/carbon-design-system/carbon-components-svelte/commit/3dbfd2164aa7b8051d6f7fdbc96a41dc94401f03))
- **multi-select:** show an empty state when there are no items ([97172c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/97172c33cba76898810220038f470d949629d482))
- **notification-queue:** add an action to queued toasts ([50fae4b](https://github.com/carbon-design-system/carbon-components-svelte/commit/50fae4b7977d0e67cbdef6b1b4ad5c34d4efc809))
- **notification-queue:** pause timers while the queue has focus or hover ([0887b26](https://github.com/carbon-design-system/carbon-components-svelte/commit/0887b269f07f39598eb8b0ef2a96c60131355dc6))
- **notification:** add actionable mode with alertdialog focus handling ([073b9da](https://github.com/carbon-design-system/carbon-components-svelte/commit/073b9da55641a6732de31ca362d5a98d8623238d))
- **number-input:** add scrubbable to change the value by dragging the label ([569ff44](https://github.com/carbon-design-system/carbon-components-svelte/commit/569ff4469700b508b2c976af6ae2049bf5e0965a))
- **number-input:** repeat a held stepper button ([725c83c](https://github.com/carbon-design-system/carbon-components-svelte/commit/725c83c91701a11b214b79fdde8d62037a40d65c))
- **overflow-menu:** add iconEnd slot and prop to OverflowMenuItem ([1ae6f1f](https://github.com/carbon-design-system/carbon-components-svelte/commit/1ae6f1f2ceaf186bc816b30818e88a2083f4cb14))
- **overflow-menu:** add tooltipAlign to OverflowMenu ([f172159](https://github.com/carbon-design-system/carbon-components-svelte/commit/f172159c2781b41e0a1e616c30b4e622bf4c304b))
- **pagination-nav:** add pageText, pageRangeText and pageSelectLabelText ([bf3edad](https://github.com/carbon-design-system/carbon-components-svelte/commit/bf3edadd7317de5856a6a17c9442bafe8286f204))
- **pagination:** add pageInputType input mode ([2013cfb](https://github.com/carbon-design-system/carbon-components-svelte/commit/2013cfbea41ad2ffcae38e98b0db03ec374727e4))
- **password-input:** add tooltipAlign to PasswordInput ([6fe4c34](https://github.com/carbon-design-system/carbon-components-svelte/commit/6fe4c3444e882e5c0fc781512fe6a387d7bada86))
- **password-input:** join tooltip groups ([48b3569](https://github.com/carbon-design-system/carbon-components-svelte/commit/48b356964691dc4fe935d885701c30072acaaad8))
- **popover:** accept v11 align names ([e674ad3](https://github.com/carbon-design-system/carbon-components-svelte/commit/e674ad34cc1cb11772f59e839a8bf6ef171684eb))
- **popover:** add dropShadow and border, and use the v11 caret ([9f5079d](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f5079dfa0c13f8b0268bca9f7b852dfca9bda28))
- **profile-menu-detail:** derive the label id from an `id` prop ([fe328e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/fe328e8e0987abbcc1e54e2d5515c1deb5eca5de))
- **progress-bar:** accept Carbon v11's small and big sizes ([c491f95](https://github.com/carbon-design-system/carbon-components-svelte/commit/c491f95270f8b4150783f389def32b28327bdedb))
- **progress-bar:** derive helper and status ids from `id` ([be57176](https://github.com/carbon-design-system/carbon-components-svelte/commit/be5717674622d9742625f84a1a5095130d6ad4ad))
- **progress-indicator:** add statusText for complete and invalid steps ([549b6e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/549b6e9fb741bd0f570d266c4f9d2043a978b5ba))
- **prose:** add `deferOffscreen` to skip rendering offscreen code blocks ([426bd8e](https://github.com/carbon-design-system/carbon-components-svelte/commit/426bd8e7cfda5252cff68f1d654a0ed5247063a1))
- **prose:** add Prose ([64993ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/64993ab05dfec4fb1e57ff1612ac5b61f00b85a6))
- **radio-tile:** add `ref` prop ([8a6a51c](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a6a51c1c720efd041610cea3204d588a91330e6))
- **range-slider:** add markSnapDistance for soft snapping to marks ([c7b52f1](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7b52f1dda6944495f5edae885ab4c153ea8cdaa))
- **range-slider:** add snapToMarks for snapping to configured marks ([414b66b](https://github.com/carbon-design-system/carbon-components-svelte/commit/414b66b937dee9dd33a666dedf304bfbcbda9725))
- **range-slider:** add trackDrag to move or brush the whole range ([13ff0b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/13ff0b14bec0f49e3ebd94bc0c1b246535727d64))
- **range-slider:** announce mark labels in aria-valuetext ([a2980a6](https://github.com/carbon-design-system/carbon-components-svelte/commit/a2980a6040f0e8b14fa30e37c0128d698ed2d148))
- **recursive-list:** add a `nested` prop ([16562cc](https://github.com/carbon-design-system/carbon-components-svelte/commit/16562ccbc947960475bf32d93d21569e104c6b4a))
- **relative-time:** add `timeZone` for the absolute `title` ([95aa0bf](https://github.com/carbon-design-system/carbon-components-svelte/commit/95aa0bf7f841ad5a5901295bed58a0abd3a25a84))
- **relative-time:** add minUnit and absoluteAfter for chat-style times ([bb9e564](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb9e5640ea44c73209e80d1dbe61e79462650c1a))
- **search:** add loadingDescription ([6d6b367](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d6b3672802acac31faa9a42690d7c7277fb6996))
- **search:** show and bind a keyboard shortcut ([c029119](https://github.com/carbon-design-system/carbon-components-svelte/commit/c029119541c5adddad929f98990e9079fc01cdcb))
- **selectable-tag:** add `lg` size ([74c8d25](https://github.com/carbon-design-system/carbon-components-svelte/commit/74c8d2586e92744eb08925094a257d29040c7c57))
- **selectable-tag:** inherit size and overflow from a parent `TagSet` ([0b2b160](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b2b160e0ed5d29972f4cefd073bf80dc49528d9))
- **selectable-tile-group:** add `change` event ([cd79bb1](https://github.com/carbon-design-system/carbon-components-svelte/commit/cd79bb127208a444dd7e4672d373a50bfe35ea18))
- **selectable-tile-group:** warn when tiles share a value ([1b7d8c8](https://github.com/carbon-design-system/carbon-components-svelte/commit/1b7d8c8df37e248fd6897bde9308b85104114e86))
- **selectable-tile:** forward the `change` event ([0fa37ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/0fa37ab2d976b89f40fa40eccca55bb200ffd233))
- **selectable-tile:** type `value` with a `Value` generic ([2019cb6](https://github.com/carbon-design-system/carbon-components-svelte/commit/2019cb623fcad2e2914fb370476a3d00419469eb))
- **shape-indicator:** read the v11 status tokens ([7f37ff1](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f37ff131a423099be894c50c17bd8420eed32f1))
- **side-panel:** add SidePanel component ([3c0bd90](https://github.com/carbon-design-system/carbon-components-svelte/commit/3c0bd90e0821dc54005e73c93e2b357da22d9ec7))
- **skeleton-text, file-uploader-item:** add noMargin ([5554601](https://github.com/carbon-design-system/carbon-components-svelte/commit/55546017c9b6f0c7606ad630550dd6975ca37767))
- **skeleton:** add ai variant ([7d23b16](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d23b16f2977936279e8e173629fed79f912d8bf))
- **slider:** add `hideRangeLabels` to hide the min and max labels ([adb6d2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/adb6d2a84dc59157da3fad7d5064e433e349d117))
- **slider:** add markSnapDistance for soft snapping to marks ([fab20f3](https://github.com/carbon-design-system/carbon-components-svelte/commit/fab20f39283a1a9e2dc267894150d03c166c9b3b))
- **slider:** announce mark labels in aria-valuetext ([e3b416f](https://github.com/carbon-design-system/carbon-components-svelte/commit/e3b416f3f2b27c99963698bb58bb1cbe1ba8c8f1))
- **splitter:** accept pixel lengths for min and max ([5e480ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/5e480cab586f0321b551f6671faa77493746fa0b))
- **splitter:** add a bindable collapsed prop ([eff8e82](https://github.com/carbon-design-system/carbon-components-svelte/commit/eff8e8286469230a8fa0130f523e314263b9287e))
- **splitter:** add collapsedSize to collapse below min ([157453e](https://github.com/carbon-design-system/carbon-components-svelte/commit/157453eafea58405f6dc930327d3af74d7d33da5))
- **splitter:** add Splitter for resizable panes ([241c94e](https://github.com/carbon-design-system/carbon-components-svelte/commit/241c94e729581ebb7b9638a2226f6fe8c0bca64e))
- **star-rating:** add StarRating to rate with stars or show a rating ([ed55633](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed55633a9a191c1ecd6170a98df545fca07f1f25))
- **stepper:** add Stepper for multi-step flows ([a605c9f](https://github.com/carbon-design-system/carbon-components-svelte/commit/a605c9f8e005794dcde56fe31cb76b06f652e7c4))
- **stepper:** add validate:error for a throwing or rejecting validate ([27700d1](https://github.com/carbon-design-system/carbon-components-svelte/commit/27700d1d0acbb7efbee96d7aff25fad17efc0b32))
- **structured-list:** accept a `name` for the radio inputs ([8880e20](https://github.com/carbon-design-system/carbon-components-svelte/commit/8880e20bb9da94847b9caff1d56a67e021b6888b))
- **syntax:** add Carbon syntax token stylesheets ([a558dd1](https://github.com/carbon-design-system/carbon-components-svelte/commit/a558dd182ab45ac04b1d359f95535f8d76ba5c1c))
- **syntax:** add precision to the highlighter ([30a6541](https://github.com/carbon-design-system/carbon-components-svelte/commit/30a65413af75c86151e88ca4c30e9c785301e960))
- **syntax:** add the syntax subpath highlighter ([9f8b56b](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f8b56bb26b02b72053ca3406f6224e1db824ce1))
- **syntax:** cover Svelte 4 and 5 syntax in the highlighter ([9f7dde0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f7dde04fb21e4055f15e2682fc7663246fe04ca))
- **table-container:** derive the title and description ids from `id` ([68ca991](https://github.com/carbon-design-system/carbon-components-svelte/commit/68ca99126aadab27dcd68d5a490b8ba18a5e3fb4))
- **table-of-contents:** add TableOfContents and TableOfContentsItem ([f78cf6f](https://github.com/carbon-design-system/carbon-components-svelte/commit/f78cf6f5d2c35a6f93019fe3b206590d20a2c013))
- **tabs:** add `orientation` prop to `TabsVertical` ([173d9f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/173d9f63cbefc2e866f6a004052269456b603904))
- **tabs:** add dismissText for dismiss button names ([34e23e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/34e23e3a6c9c733ec3f9884613744bd3ebfefe94))
- **tabs:** add navigation to render tabs as page links ([cad780d](https://github.com/carbon-design-system/carbon-components-svelte/commit/cad780d6abd3b0d1da18eedcd34690fa255e1c5c))
- **tabs:** add tooltipAlign to Tab ([6bc3277](https://github.com/carbon-design-system/carbon-components-svelte/commit/6bc327769432f775f5588419a28b9863d34a763d))
- **tag-input:** add TagInput ([52c3f57](https://github.com/carbon-design-system/carbon-components-svelte/commit/52c3f57ec98ffb0849031037c99a6d7710b90ea3))
- **tag-set:** add `navigation="roving"` for a single tab stop ([505cecc](https://github.com/carbon-design-system/carbon-components-svelte/commit/505ceccd9936eeb2cbc607719ca776bfa5183f8d))
- **tag-set:** add `overflowMode="popover"` ([c3ae461](https://github.com/carbon-design-system/carbon-components-svelte/commit/c3ae4616840fd80bbed88cf12ceb32ad9956c350))
- **tag-set:** add View all and overflowType ([7dbbbef](https://github.com/carbon-design-system/carbon-components-svelte/commit/7dbbbefd25a23256ddeb67397cf02609e2e88ecf))
- **tag-set:** derive the overflow tooltip id from an `id` prop ([66400fd](https://github.com/carbon-design-system/carbon-components-svelte/commit/66400fd7584b60b0b67d36b8fcb46e58590c6dbd))
- **tag-set:** name the "+N" indicator with `overflowLabel` ([fa77c0e](https://github.com/carbon-design-system/carbon-components-svelte/commit/fa77c0e840d2d8e5ec8b26eab3c3ec323bdabd74))
- **tag:** add `value` to identify tags in `TagSet` events ([d8c9719](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8c9719efac95d2b5a07600e9335c9766806ad1d))
- **tag:** add an xs size for 24px fields ([eb48a61](https://github.com/carbon-design-system/carbon-components-svelte/commit/eb48a61b6a00745ebde062efe26762798fde1268))
- **tag:** add OperationalTag ([ba7d638](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba7d638db8d8329f65126355e66ab9857883263d))
- **text-area:** add counterMode to count words ([1e6a4b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e6a4b12a0e7e817e3676c0f25b089ed7e95a277))
- **theme-zone:** add ThemeZone to theme part of a page ([fd20519](https://github.com/carbon-design-system/carbon-components-svelte/commit/fd2051917c354db6470d36ba57824e3fa8d8e94d))
- **theme:** add a CSS-only system theme ([cfe2ddc](https://github.com/carbon-design-system/carbon-components-svelte/commit/cfe2ddc365c736e2ca0c5960f907d1acf1202950))
- **theme:** add createTheme ([5bce03c](https://github.com/carbon-design-system/carbon-components-svelte/commit/5bce03c3998f5fa259252215e6953c76f581eda4))
- **theme:** add system option that follows prefers-color-scheme ([19c7e4d](https://github.com/carbon-design-system/carbon-components-svelte/commit/19c7e4df54aad29b5a67496ad4ae36c2da6dfb08))
- **theme:** add the v11 tag-border tokens ([0706468](https://github.com/carbon-design-system/carbon-components-svelte/commit/070646829bba6cdd7d61422858543a0c1037f85e))
- **theme:** add themeScript to apply the theme before first paint ([99c721a](https://github.com/carbon-design-system/carbon-components-svelte/commit/99c721adae538d8553e10a7abc4592b663aa9266))
- **theme:** declare the remaining v11 component tokens ([15c6d3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/15c6d3a9a18224ff6efb3fdd49c415d0ce26cb33))
- **tile-group:** add `hideLegend` prop ([5a1b667](https://github.com/carbon-design-system/carbon-components-svelte/commit/5a1b667ce529c3ae7acfa4b1de6ba296eb64ede5))
- **tile:** add `ref` prop ([e9bf6dd](https://github.com/carbon-design-system/carbon-components-svelte/commit/e9bf6dd9f10240fb493e6a5eae026f1a8ec646dc))
- **tile:** add rounded corners ([d6111b3](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6111b347b8650ed8b5b9006b0c58623b0ed501f))
- **tile:** add size="sm" for compact tiles ([e24c5ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/e24c5abdd8ceed4782d9f3a7cb41fb20f4e6a986))
- **tile:** show the v11 selection checkbox ([c2baf5f](https://github.com/carbon-design-system/carbon-components-svelte/commit/c2baf5f55ec695f66b5abb3fc235792d5dac7ca4))
- **toast-notification:** add actions slot ([c1e9051](https://github.com/carbon-design-system/carbon-components-svelte/commit/c1e905116a4bd65a9802adc680031bc16417260a))
- **toggle-button-group:** add `grid` for an even grid of buttons ([5badd19](https://github.com/carbon-design-system/carbon-components-svelte/commit/5badd19af33a2e3ad972931d5f64dd8165afe011))
- **toggle-button-group:** add tooltipAlign to ToggleButton ([e3b84ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/e3b84ea23952d4559403c689e86ec87d26c0ce73))
- **toggle:** add invalid, invalidText and helperText ([73c56ec](https://github.com/carbon-design-system/carbon-components-svelte/commit/73c56ec6e03bbd5ac994f9bb74e02e12c726311e))
- **toggletip:** add labelChildren slot ([57eee05](https://github.com/carbon-design-system/carbon-components-svelte/commit/57eee0556d2868761a9fdc4ee65955635f071d75))
- **toggletip:** derive the content id from an `id` prop ([16af5af](https://github.com/carbon-design-system/carbon-components-svelte/commit/16af5afe8e8294b491e754a01d59f5887fafce9f))
- **tokens:** export theme, type, and spacing tokens as data ([e687834](https://github.com/carbon-design-system/carbon-components-svelte/commit/e68783452798633d48f1e0ab59b849b8a23fdcaf))
- **toolbar-search:** add `deferFilter` to yield before filtering rows ([ed461d9](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed461d91fb9976ef69722ad997845b6037bb383f))
- **tooltip-definition:** join tooltip groups ([f2c6179](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2c6179d0c9fac4792a2bfa18b1bd10f0729ca4b))
- **tooltip-group:** add `TooltipGroup` for instant tooltip handoff ([4553c13](https://github.com/carbon-design-system/carbon-components-svelte/commit/4553c13cb401d74bd9845376392c6b29aef208ca))
- **tooltip-group:** skip the fade-in on instant handoff and focus ([b12f22a](https://github.com/carbon-design-system/carbon-components-svelte/commit/b12f22afa0b5301db3cb8315f58feb86759447fc))
- **tooltip-icon:** add tooltipChildren slot ([5b92233](https://github.com/carbon-design-system/carbon-components-svelte/commit/5b92233cc8e10ce65d47edc2682a2b97d1cfb6ea))
- **tooltip-icon:** join tooltip groups ([a8c5ce4](https://github.com/carbon-design-system/carbon-components-svelte/commit/a8c5ce49ac1cb9373b80176f8cf049e9fec2ede9))
- **tooltip:** add triggerChildren slot ([03909f4](https://github.com/carbon-design-system/carbon-components-svelte/commit/03909f40519eecd24adce84b9d6ac6c3b794b331))
- **tooltip:** join tooltip groups ([aa5288a](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa5288abf79c665e80da6825622fc98d168dd138))
- **tree-view:** add TreeViewSkeleton ([00dce7c](https://github.com/carbon-design-system/carbon-components-svelte/commit/00dce7c1793263c00ce96fe101ce97352a42ae56))
- **tree-view:** derive its internal ids from an `id` prop ([b4df493](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4df49390a3eaa2c5d1f3f6d9326304e5dddb017))
- **truncate:** add tooltipAlign to Truncate ([59e1178](https://github.com/carbon-design-system/carbon-components-svelte/commit/59e1178bb6ffed30344d75c37ba1118ef8c604fb))
- **truncate:** reveal clipped text with a tooltip or expand toggle ([eb88e4e](https://github.com/carbon-design-system/carbon-components-svelte/commit/eb88e4e53ba32468e4b7a9b40e79c71d4cdb52c6))
- **ui-shell:** add `icon` and `text` slots to `HeaderNavMenu` trigger ([7f9def6](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f9def6718c7f0c955b93449665226deaff01724))
- **ui-shell:** add `text`, `icon` prop and slot to `HeaderPanelLink` ([2e2e223](https://github.com/carbon-design-system/carbon-components-svelte/commit/2e2e2233c40df0e5faf7b135c9171886ac207cb6))
- **ui-shell:** add arrow, Home, and End navigation to `HeaderPanelLinks` ([d511977](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5119773dd842f85f16406f7df878f2694593cf7))
- **ui-shell:** add first-letter typeahead to `HeaderNav` and `HeaderNavMenu` ([7d04cf9](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d04cf9b2c383660983b17402b21342fc19c14df))
- **ui-shell:** add HeaderPanelGroup for labelled header panel link groups ([bf2cdda](https://github.com/carbon-design-system/carbon-components-svelte/commit/bf2cdda447a7e15b7fcf5dd3fc7d25699f09c1e5))
- **ui-shell:** add menubar keyboard navigation to `HeaderNav` ([a8c108d](https://github.com/carbon-design-system/carbon-components-svelte/commit/a8c108d39cea01e048cfd6ec6cf7bb6507f3b206))
- **ui-shell:** add resizeEnterDelayMs to SideNav ([d9c6582](https://github.com/carbon-design-system/carbon-components-svelte/commit/d9c65827fcb4288b1b48df8ad7f0342965dab074))
- **ui-shell:** add vertical menubar keyboard navigation to `HeaderSideNavItems` ([3bebd59](https://github.com/carbon-design-system/carbon-components-svelte/commit/3bebd59ba779eceae1a23503e34132d6f1a04944))
- **ui-shell:** close `HeaderSwitcher` when a `ProfileMenuItem` is activated ([42caaa5](https://github.com/carbon-design-system/carbon-components-svelte/commit/42caaa5d65714215326f5c8175fc397f586b457c))
- **ui-shell:** close `ProfileMenu` when a `ProfileMenuItem` is activated ([6fb54d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/6fb54d29b6435a7a51d499c264132b3a0801234e))
- **ui-shell:** close the `HeaderAction` panel when a `HeaderPanelLink` is activated ([230a42e](https://github.com/carbon-design-system/carbon-components-svelte/commit/230a42eeaf7ed6c539bb735c8b7503928bf6764f))
- **ui-shell:** delay the rail's hover expansion ([9cd474c](https://github.com/carbon-design-system/carbon-components-svelte/commit/9cd474c9659fd018a84c0ded5881877bce892753))
- **ui-shell:** hide header nav at a custom expansion breakpoint ([b42c7ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/b42c7addf4b94734939da1f0f01d5ccb274ce0a5)), closes [#1809](https://github.com/carbon-design-system/carbon-components-svelte/issues/1809) [#4148](https://github.com/carbon-design-system/carbon-components-svelte/issues/4148)
- **ui-shell:** mark collapsed SideNavMenu holding the current page ([abdbec6](https://github.com/carbon-design-system/carbon-components-svelte/commit/abdbec668e01221e2a0ebd1b945da8fc4abd0fc3)), closes [#4127](https://github.com/carbon-design-system/carbon-components-svelte/issues/4127)
- **user-avatar:** add a strong shade for every fill ([e44a701](https://github.com/carbon-design-system/carbon-components-svelte/commit/e44a701a98e83caf92da2b86ba12b44ac3ce9c96))
- **user-avatar:** add status badge ([dea6f42](https://github.com/carbon-design-system/carbon-components-svelte/commit/dea6f42fa08368ed2a2ff08ff20c1ad3a39e8645))
- **user-avatar:** derive the tooltip id from an `id` prop ([3e32a75](https://github.com/carbon-design-system/carbon-components-svelte/commit/3e32a75bc9ca38b8f675959b9c3fe22199c20938))
- **utils:** add createLoadingDelay and delayedLoading ([457ead3](https://github.com/carbon-design-system/carbon-components-svelte/commit/457ead3cd8db3800a375e76c2774408fdc775870))
- **utils:** add splitAriaNaming ([985c804](https://github.com/carbon-design-system/carbon-components-svelte/commit/985c80472bb1d11eaf0690b6871c38129135009e))
- **utils:** export dismiss, rovingFocus, trapFocus, preserveFocusSelection, formReset, floatingPosition ([9cb4df1](https://github.com/carbon-design-system/carbon-components-svelte/commit/9cb4df1e970bd336cead80996e8a93e8b85f27c2))
- **virtual-list:** keep rows in view during fast scrolls ([fb19bc1](https://github.com/carbon-design-system/carbon-components-svelte/commit/fb19bc167371d9259cc869549fbc5ed1bec4fbb0))
- **virtual-list:** render items straight into a parent list with `spacerTag` ([1955adf](https://github.com/carbon-design-system/carbon-components-svelte/commit/1955adf29d2ad50afe49a05f54ab5a48a92e33ba))
- **virtualize:** keep the window ahead of fast scrolls ([78e7292](https://github.com/carbon-design-system/carbon-components-svelte/commit/78e7292ac5191289f6c3ec6175702a42e493d228))
- accept v11 size names as aliases ([13f7de5](https://github.com/carbon-design-system/carbon-components-svelte/commit/13f7de56055151bd98a209f020a1222bcd11f99b))
- add `size` to field skeletons ([39bdf21](https://github.com/carbon-design-system/carbon-components-svelte/commit/39bdf21fcbf013a0e5fb02bd933b97f921c74e86))
- add `xs` size to Button, FileUploader, and Slider ([c00a14f](https://github.com/carbon-design-system/carbon-components-svelte/commit/c00a14fbd9dd819cca5717a55cee85b86be022a6))
- add `xs` size to NumberInput, DatePickerInput, TimePicker, and CopyInput ([51879e1](https://github.com/carbon-design-system/carbon-components-svelte/commit/51879e11c41304a88201d86cfd7aba147b07b300))
- add loadingDelay to list boxes, Search and SearchMenu ([8e8b778](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e8b778812b1c722d3461711ba100cd6e2c69e85))

### Bug Fixes

- **accordion:** forward aria naming to the heading button ([1ee5856](https://github.com/carbon-design-system/carbon-components-svelte/commit/1ee5856163dba18b2700fef4de74e084afe2f525))
- **accordion:** keep an item disabled when the accordion is re-enabled ([4d90dce](https://github.com/carbon-design-system/carbon-components-svelte/commit/4d90dce3a534fd5ea9f0fae7a78348a5a7a4bc21))
- **accordion:** let an item added with open take over in single mode ([f244989](https://github.com/carbon-design-system/carbon-components-svelte/commit/f244989dea5ccf9e7937acaf0ef60f9977362f79))
- **accordion:** mirror the arrow and title margins in RTL ([67822f3](https://github.com/carbon-design-system/carbon-components-svelte/commit/67822f3a71c056c38e7dab7936abfcbe38694bab))
- **accordion:** open an item added after the open one unmounts ([daf914a](https://github.com/carbon-design-system/carbon-components-svelte/commit/daf914a336a3d885ce6b48b90ed048f3f468d672))
- **accordion:** pad content by the accordion's width, not the window's ([6410df6](https://github.com/carbon-design-system/carbon-components-svelte/commit/6410df6bca558209d3a024d4219adaea6e84fac3))
- **action-set:** align actions to the inline end ([1b63528](https://github.com/carbon-design-system/carbon-components-svelte/commit/1b63528812b51af3a706a3bc3411260fee7a37ff))
- **action-set:** stack buttons in a set too narrow for them, and before it hydrates ([3baaca9](https://github.com/carbon-design-system/carbon-components-svelte/commit/3baaca9f5feac70adcf606c84974fd2b08e6e627))
- **ai-label:** close the explanation when the label is reverted ([5d4918d](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d4918d05a515d9bdaf8a75928731c60ff9d9b4b))
- **ai-label:** keep focus on the label after reverting ([d273f59](https://github.com/carbon-design-system/carbon-components-svelte/commit/d273f596a763d0e50d5900bd36be5f7018ad9eed))
- **ai-label:** line the revert icon up with the label in a field ([661d60c](https://github.com/carbon-design-system/carbon-components-svelte/commit/661d60c6f152930b50a9ef14f016f61248191df6))
- **ai-label:** match v11's callout caret and actions bar ([cb7a909](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb7a9090b439871c6267afc61b3af8f1441ff3cc))
- **ai-label:** order field icons like v11 ([b457ebf](https://github.com/carbon-design-system/carbon-components-svelte/commit/b457ebf5584cf374148a08bbc352088823410d4d))
- **big-number:** keep numbers in their locale's order in RTL ([b133e0c](https://github.com/carbon-design-system/carbon-components-svelte/commit/b133e0c1455ef38bd86029547d483ab8502d7c6f))
- **big-number:** put the percent sign where the locale puts it ([4225854](https://github.com/carbon-design-system/carbon-components-svelte/commit/422585416b7c74da6eff68553d8529c0685ffc06))
- **box, scroll-gradient:** paint layer-03 with the v11 layer-03 token ([d53f156](https://github.com/carbon-design-system/carbon-components-svelte/commit/d53f1561b99364d355cd635496a1d51e3987f6a0))
- **breadcrumb:** escape backslash and quote in a text separator ([f8cfaf4](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8cfaf46385a7f2fa6abe471ed56d28a792977ad))
- **breadcrumb:** forward aria naming to the item link ([2d7e120](https://github.com/carbon-design-system/carbon-components-svelte/commit/2d7e120802a9173781d4ff9d6e5028a84f0252ff))
- **breadcrumb:** mirror the trail and its overflow menu in RTL ([6784813](https://github.com/carbon-design-system/carbon-components-svelte/commit/67848137eee2cf1d0eef4e7370674ebe36e1c195))
- **breadcrumb:** type the `aria-current` slot prop as an ARIA value ([069d23b](https://github.com/carbon-design-system/carbon-components-svelte/commit/069d23bde94c72a7d98a4903bb9fd2b0973867b9))
- **breadcrumb:** wrap an item too long for the trail ([1ad7d5b](https://github.com/carbon-design-system/carbon-components-svelte/commit/1ad7d5b7c2b05f0c3ac07d30551c0c2c9cfa25c3))
- **breakpoint:** report one size at exact breakpoint widths ([b24e564](https://github.com/carbon-design-system/carbon-components-svelte/commit/b24e5649005bdf107e460576a8dcaa3802d9afcc))
- **button-skeleton:** drop the unnamed tab stop when href is set ([862c980](https://github.com/carbon-design-system/carbon-components-svelte/commit/862c9804aab545dc3a7ea054bd196c2a0e422ca9))
- **button:** dismiss the icon-only tooltip with Escape ([e566eb5](https://github.com/carbon-design-system/carbon-components-svelte/commit/e566eb5ae498ff171c0947456b3a9f9b0b665bb9))
- **button:** draw disabled icon-only ghost buttons in $icon-disabled ([5a214ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/5a214cae2631c24e1658f17acbdef907dcb6724d))
- **button:** flip its padding, icon and dividers in RTL ([9ec4a47](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ec4a476545dd4b6a4b58ac1a61914d020599e39))
- **button:** keep a consumer style on a skeleton button ([75a657f](https://github.com/carbon-design-system/carbon-components-svelte/commit/75a657fe3d594d2acad8d56639bd50bde6ec0772))
- **button:** keep a ghost button's width while loading ([f98ca58](https://github.com/carbon-design-system/carbon-components-svelte/commit/f98ca58377972fbccc7f0bea0c355f3e87db841f))
- **button:** let one class plus svg restyle the icon fill ([be844ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/be844ab498680e96d756d5bf9d2a86d4c09f376c))
- **button:** render aria-pressed only on a toggle icon button ([c481434](https://github.com/carbon-design-system/carbon-components-svelte/commit/c48143463c3d830747a38e31a55949843f67abc5))
- **button:** use $text-disabled for disabled ghost buttons ([681c476](https://github.com/carbon-design-system/carbon-components-svelte/commit/681c476e43d04ad3ade7fb3bdfe00cada6ce5c69))
- **button:** wait out the tooltip group's enter delay before an icon tooltip ([9d6a85c](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d6a85c4147070e4053d7a95df2db7a19090e242))
- **card:** render the AI surface on the server ([0d1c31a](https://github.com/carbon-design-system/carbon-components-svelte/commit/0d1c31aa2e08690e6bf5b85826f9a9b014421879))
- **carousel:** don't override focus a change handler moved ([9fab981](https://github.com/carbon-design-system/carbon-components-svelte/commit/9fab981ad5ac23b7a4d2e37c2a61d3317001fa6d))
- **carousel:** keep selectedIndex when slides load after mount ([dd8cc99](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd8cc99470168b8a21749c52001705b0c4665f3b))
- **carousel:** keep the counter text in order in RTL ([c796352](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7963525d88836224a3739696063d79cbb4b9e26))
- **carousel:** omit slide label from server-rendered markup ([285da19](https://github.com/carbon-design-system/carbon-components-svelte/commit/285da1956d5d787992b2133515706fec5be28bd7))
- **carousel:** show only the selected slide before hydration ([ec50638](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec5063884cbacf7a3474eee59be684fa54cf1fa2))
- **carousel:** size the viewport and controls before hydration ([27af638](https://github.com/carbon-design-system/carbon-components-svelte/commit/27af638cabfc6edd9dedcb5c20af76ba0a0281ab))
- **carousel:** swap Left and Right in RTL ([60d9424](https://github.com/carbon-design-system/carbon-components-svelte/commit/60d9424f1331dcf4d5a861e4f80dd1f948635a10))
- **checkbox-group:** fire no events on a form reset ([6d22a2d](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d22a2d59ec1d1eb98ac3484c0d05757f19547da))
- **checkbox-group:** hide the invalid state on a disabled group's boxes ([98d5454](https://github.com/carbon-design-system/carbon-components-svelte/commit/98d545444714aa55163b92286059b383b6aa8359))
- **checkbox-group:** let one checked box satisfy required ([39063fe](https://github.com/carbon-design-system/carbon-components-svelte/commit/39063fee8c93190a736fb0704a15b52535afffee))
- **checkbox-group:** pass form to the checkboxes ([42389a9](https://github.com/carbon-design-system/carbon-components-svelte/commit/42389a9e787cf812996a329664cb8ee7f4a2a204))
- **checkbox, checkbox-group:** announce the invalid message ([d3d8c2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/d3d8c2e2a87088ba714d28c3dea125e2b2e15cb7))
- **checkbox:** follow a disabled fieldset ([0efcda7](https://github.com/carbon-design-system/carbon-components-svelte/commit/0efcda7fc02020667b291a16928a9b16b3702191))
- **checkbox:** forward aria naming to the input and fieldset ([176e13e](https://github.com/carbon-design-system/carbon-components-svelte/commit/176e13ec515ab372fa09ccf9f5a65cbc90f31a95))
- **checkbox:** honor form on the checkbox input ([036351e](https://github.com/carbon-design-system/carbon-components-svelte/commit/036351e837328dcb02daeadca4cabd5457bcb7cb))
- **checkbox:** keep a decorative checkbox's state after a form reset ([228d168](https://github.com/carbon-design-system/carbon-components-svelte/commit/228d16820f09c73f520bc534610dc88eb1d44c46))
- **checkbox:** match v11 checkbox metrics ([3bd17b2](https://github.com/carbon-design-system/carbon-components-svelte/commit/3bd17b21bc31ca82a9f82b64953161328c43b21f))
- **checkbox:** show the indeterminate state in server-rendered markup ([ec2fcd6](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec2fcd658f88a02b1a2ef371f5cec681ce8f2efc))
- **clickable-tile:** activate once while Space is held ([d6a98db](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6a98dbd8531deebd8ac8fad88b18db00114d155))
- **clickable-tile:** make the tile a focusable button without `href` ([ceb4deb](https://github.com/carbon-design-system/carbon-components-svelte/commit/ceb4deb0503bcbc2e079deee8547e81eddc57e68))
- **code-snippet:** announce copy feedback for inline snippets ([8628c85](https://github.com/carbon-design-system/carbon-components-svelte/commit/8628c850881bd0ac47a82c3338703a3f8aaf82ff))
- **code-snippet:** count a multi-line snippet's rows in rem ([332a71b](https://github.com/carbon-design-system/carbon-components-svelte/commit/332a71b2968df45d5544e4c7a939fa94e2ee998c))
- **code-snippet:** dismiss the inline copy feedback with Escape ([ae7fd59](https://github.com/carbon-design-system/carbon-components-svelte/commit/ae7fd59b8109c9824f8d8f9c35876c06dc376152))
- **code-snippet:** drop show more when a multi snippet is emptied ([6872b41](https://github.com/carbon-design-system/carbon-components-svelte/commit/6872b410b6625921e67de54f3ac36734c232914a))
- **code-snippet:** forward aria naming to the code container ([80abada](https://github.com/carbon-design-system/carbon-components-svelte/commit/80abadae8ffd826c3c73282e66f8663b31151f16))
- **code-snippet:** keep code left to right in RTL ([a851a4e](https://github.com/carbon-design-system/carbon-components-svelte/commit/a851a4e47c194fcf8d49e6af33bcf70fcaf9aec7))
- **code-snippet:** render the inline skeleton in its line of text ([7fc4838](https://github.com/carbon-design-system/carbon-components-svelte/commit/7fc483811b282ec94dd5c8d4f29430c6b9ffc6ff))
- **code-snippet:** show "Show more" from the line count until measured ([0a3b2e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/0a3b2e787b0b7fe98a1540b838bc52581bebb0d8))
- **column:** skip a null breakpoint instead of throwing ([d24a4bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/d24a4bc1cc5908574933e9f876a45e101386fa99))
- **combo-box, multi-select:** ignore IME composition keys ([44a2f58](https://github.com/carbon-design-system/carbon-components-svelte/commit/44a2f5837afb047bc95c33410daaf6c6a5fc9808))
- **combo-box:** close the menu when disabled or readonly turns on ([a2a1d84](https://github.com/carbon-design-system/carbon-components-svelte/commit/a2a1d841187d6fee0c3664ec0950344b5e39e25e))
- **combo-box:** describe a read-only field as read-only ([03f09ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/03f09ef0851ae3c61b235c07ce7bcf1819bada2b))
- **combo-box:** dispatch clear when Escape clears the selection ([2ea648e](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ea648e0e41e4a24a94708f6b9ee957f54622922))
- **combo-box:** follow a disabled fieldset ([70017c5](https://github.com/carbon-design-system/carbon-components-svelte/commit/70017c5d3f4cde4e6228efcbaf84a4bc15a13574))
- **combo-box:** keep `open` off the clear button ([f85d723](https://github.com/carbon-design-system/carbon-components-svelte/commit/f85d723fc0aebb265e05e2f2e42b6a21a749daf0))
- **combo-box:** keep `selectTextOnFocus` selection after a click in Safari ([24e0a5e](https://github.com/carbon-design-system/carbon-components-svelte/commit/24e0a5e9c928a8dd5dc9446c143e0897c6ad0fcc))
- **combo-box:** keep autofilled and exact-match text as a selection (#4411) ([ae4fea6](https://github.com/carbon-design-system/carbon-components-svelte/commit/ae4fea67a1d6a3736caabf5af5b83757cabfbb2a))
- **combo-box:** leave focus alone when rendered open ([16bcb86](https://github.com/carbon-design-system/carbon-components-svelte/commit/16bcb864edc5d99ca96c759fcc6ddc007454e6db))
- **combo-box:** render the selected item's text on the server ([2a1fe2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a1fe2a45a17b15922757e92324e8c7f27798ca3))
- **combo-button:** forward aria naming to the primary action ([44188fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/44188fcee5d36c6381e819e8fb80d213028c60d2))
- **combo-button:** line the menu up with the whole button group ([a892a2c](https://github.com/carbon-design-system/carbon-components-svelte/commit/a892a2ccf850059bab773d364b5595ff3935bba0))
- **composed-modal:** clear the header label when the header unmounts ([67882ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/67882abf8e4a49c36762a3e18f54389b986702c3))
- **composed-modal:** forward aria-describedby to the dialog ([12a36ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/12a36ed2f5a0209d41ba8f56064db14b0fa76328))
- **composed-modal:** name the dialog on the server ([5b8d43d](https://github.com/carbon-design-system/carbon-components-svelte/commit/5b8d43dcc45f589a055436cf49b9337057feeb00))
- **confirm-modal:** reset loading state when reopened mid-confirm ([eef4464](https://github.com/carbon-design-system/carbon-components-svelte/commit/eef44640419d3cd022f07d83cf944840febd5f13))
- **contained-list:** disable a contained list item that has an href ([bcb2f51](https://github.com/carbon-design-system/carbon-components-svelte/commit/bcb2f514318e975beed45f129d9eae6422d5f5a5))
- **contained-list:** render the id prop on the list element ([6b85e68](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b85e68be54860d79e97eb47fbf2d66f209d12f0))
- **content-switcher, tabs:** follow a keyed reorder with the bound index ([9a9f49c](https://github.com/carbon-design-system/carbon-components-svelte/commit/9a9f49cabb85aefce650a38c4df765934b97c2bb))
- **content-switcher, tree-view:** render a tab stop in server markup ([9b3bafd](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b3bafd5ae08545fe93b668536499146757c455f))
- **content-switcher:** center an icon before a switch's text ([a808b54](https://github.com/carbon-design-system/carbon-components-svelte/commit/a808b54aaea53c60f2096ed70a72af13637c428a))
- **content-switcher:** draw one line between switches in forced colors ([76e2643](https://github.com/carbon-design-system/carbon-components-svelte/commit/76e26439abd74ef82e20447ded4c80fbe5aab7d2))
- **content-switcher:** drop the double outline on low contrast selected ([8536433](https://github.com/carbon-design-system/carbon-components-svelte/commit/8536433e1bb65c17f697d58ee28341d3a4d39b8c))
- **content-switcher:** icon switches in server-rendered markup ([602f11a](https://github.com/carbon-design-system/carbon-components-svelte/commit/602f11a6a03f78600adecc4707b40e212ec55519))
- **content-switcher:** keep selection when an earlier switch is removed ([8585d64](https://github.com/carbon-design-system/carbon-components-svelte/commit/8585d645251c5608b32301875f679bca720eb798))
- **content-switcher:** leave modified arrow keys to the browser ([958cda5](https://github.com/carbon-design-system/carbon-components-svelte/commit/958cda5a11b4892586ecebb49e06bce2bec7fd06))
- **content-switcher:** let a consumer aria-label name the switch panel ([139cbcc](https://github.com/carbon-design-system/carbon-components-svelte/commit/139cbcc9e842742d9bc8f83721f8181331acf6c5))
- **content-switcher:** move arrow-key focus from the focused switch ([66ba753](https://github.com/carbon-design-system/carbon-components-svelte/commit/66ba7539422a7fd4c0e32a7c6c292c461884a19e))
- **content-switcher:** read the v11 low contrast tokens ([82e69b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/82e69b6415d65db454ee9e9e6e36511098f60462))
- **content-switcher:** render the initial selection without a fade ([186efeb](https://github.com/carbon-design-system/carbon-components-svelte/commit/186efeb00b28b9f5fd61e46bc2b273b72adc6b80))
- **content-switcher:** round the selected switch as in v11 ([a62c94b](https://github.com/carbon-design-system/carbon-components-svelte/commit/a62c94b3bfd444aa38222e3ca96f0f732b316a7a))
- **content-switcher:** show a cut-off switch label on hover ([9c82aa4](https://github.com/carbon-design-system/carbon-components-svelte/commit/9c82aa444509b5d518f4947c2bbd7e68d7ef835f))
- **content-switcher:** show the selected switch in forced colors ([919f54e](https://github.com/carbon-design-system/carbon-components-svelte/commit/919f54e96c821400f690b0982a9ce3b2f4ff0f20))
- **context-menu:** derive `data-nested` from context, not a DOM ref ([4f43ac0](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f43ac065110e1cd664d4d83a4c6b3b1a204fbca))
- **context-menu:** don't clip custom labelChildren content ([6c37e45](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c37e458f04a6c53fcb5393a514613e3f6ed0e15))
- **context-menu:** focus the first option when opened from the keyboard ([d5c7314](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5c73143b7bf706d7bae6d39333ee61dbae8fcb5))
- **context-menu:** reopen a submenu after it closes itself ([931ad43](https://github.com/carbon-design-system/carbon-components-svelte/commit/931ad439c485e667714b97ef609b8965a7cdd57a))
- **context-menu:** skip disabled items in submenu arrow navigation ([d0370a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/d0370a192e25452e15ce9de279f3d674eb681dad))
- **context-menu:** stop rendering `indented` on options ([cd4eb2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/cd4eb2eb615448978d832b1800eb0ceaf82b219b))
- **context-menu:** type `target` as one element or a list ([960b10e](https://github.com/carbon-design-system/carbon-components-svelte/commit/960b10e99f56011bb5af0f57e70f3adf2287d27f))
- **copy-button:** announce copy feedback to screen readers ([1a4c0e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a4c0e5893f62b9fa2e9a944c5f3aa03dec059c0))
- **copy-button:** dismiss the tooltip and copy feedback with Escape ([c37e8f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/c37e8f6f6b79a3a44a1725a3ed68ccbb4f4cfb01))
- **copy-button:** don't reopen "Copied!" after the modal closes mid-copy ([cc81411](https://github.com/carbon-design-system/carbon-components-svelte/commit/cc8141139e9ce48f470b04e21056a5a30b0df92f))
- **copy-button:** fade the copy feedback in and out ([f413dc9](https://github.com/carbon-design-system/carbon-components-svelte/commit/f413dc900f795725d42a80fbb4c54de26697aeb6))
- **copy-button:** retry a failed copy on the next click ([279ff76](https://github.com/carbon-design-system/carbon-components-svelte/commit/279ff768ec45d337ee33dc828fea44680aa32f30))
- **copy-input:** describe the copy button with its field label ([2ef31de](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ef31dea0ab73d38f069185f4be7e50b7b79e67d))
- **copy-input:** disable the copy button while the value is empty ([03cf06b](https://github.com/carbon-design-system/carbon-components-svelte/commit/03cf06b591664933df303d533e96b6a2705f4834))
- **copy-input:** follow a disabled fieldset ([fc48aa4](https://github.com/carbon-design-system/carbon-components-svelte/commit/fc48aa497ead6f522afcd95123546bece427bc8a))
- **copy-input:** keep `selectOnFocus` selection after a click in Safari ([ab5c29a](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab5c29a170a1c8896d9ccef0c8c3d4c4ef3b3d9e))
- **copy-input:** keep a disabled value obscured on hover ([adbc188](https://github.com/carbon-design-system/carbon-components-svelte/commit/adbc1886e44827c8666d0ad3e4aff06444139125))
- **copy-input:** keep a hover-revealed value visible over the copy button ([8d1f321](https://github.com/carbon-design-system/carbon-components-svelte/commit/8d1f321a38f1608d34b82a181c8152238f5cf935))
- **copy-input:** keep the value after a form reset ([719f026](https://github.com/carbon-design-system/carbon-components-svelte/commit/719f02646a6868cf48c87acf53f7de17969beeb9))
- **copy-input:** link inline helper text to the input ([aa3e10b](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa3e10b7626bf26ed4dd8d46b8c49424fa719969))
- **copy-input:** take the value's direction from its text ([4e015f3](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e015f3ebff0e1e476e46b3b52d9931c5c1b73dc))
- **countdown:** fire end when the time is already up ([c2ed42a](https://github.com/carbon-design-system/carbon-components-svelte/commit/c2ed42a2971aba9aa4c36fe7d22b98f18aa10442))
- **css:** break words too long for their line in labels, titles and links ([46f3f8d](https://github.com/carbon-design-system/carbon-components-svelte/commit/46f3f8dfbc0e829f6b44da3bcc8eed3e1fea1f60))
- **css:** draw a black "!" in every warning icon ([c837814](https://github.com/carbon-design-system/carbon-components-svelte/commit/c83781443cac2965cdebedf54c3fdd9ddc50f0db))
- **css:** draw changing numbers in tabular figures ([15d3116](https://github.com/carbon-design-system/carbon-components-svelte/commit/15d3116e22b5e6e6eade1ab839611a28fc04a96b))
- **css:** fill highlighted menu rows with Highlight in forced colors ([bca8288](https://github.com/carbon-design-system/carbon-components-svelte/commit/bca8288ce78f4752698c02967ae7925046540654))
- **css:** flip DatePicker and Select fields in RTL ([c22d571](https://github.com/carbon-design-system/carbon-components-svelte/commit/c22d571c457aff7af2cf51413585ba7c4cb6c7b2))
- **css:** flip the text fields in RTL ([b4c0225](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4c0225e6767fe6fa8b4c96d1611c01a9eee8918))
- **css:** flip UI Shell, menus and list boxes in RTL ([38b776a](https://github.com/carbon-design-system/carbon-components-svelte/commit/38b776a2ed322bbde4b334aa1c84b9ff38e1184b))
- **css:** give read-only checkbox, radio and toggle outlines contrast ([bc77e94](https://github.com/carbon-design-system/carbon-components-svelte/commit/bc77e940a2b9b65cb788be18478edc22e7c48a75))
- **css:** give read-only field icons readable contrast ([0fdf119](https://github.com/carbon-design-system/carbon-components-svelte/commit/0fdf1190d8a2c6c2b12ab7027440a6a766a779f2))
- **css:** keep an svg that sets fill none an outline in forced colors ([c0895e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/c0895e5c79f4eb737b6d9ec0d7044f2a284388cf))
- **css:** keep five components' states visible in forced colors ([1500dce](https://github.com/carbon-design-system/carbon-components-svelte/commit/1500dce63d3e27170742ba1bcf07acc844f31532))
- **css:** keep icons visible in forced colors ([43b0242](https://github.com/carbon-design-system/carbon-components-svelte/commit/43b0242dcbe9852bc8f69facd831720566667329))
- **css:** keep visually hidden text inside the page in RTL ([dccde1b](https://github.com/carbon-design-system/carbon-components-svelte/commit/dccde1b28b0d2348b7ce44174cc00b7cfe0084b0))
- **css:** make text-placeholder the color placeholders draw in ([6f19e82](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f19e82538bf559a257835be5718096cb0d2c619))
- **css:** match @carbon/type's fluid heading-04 and display-04 ([b10948e](https://github.com/carbon-design-system/carbon-components-svelte/commit/b10948eb8c287288eaeeb2d1ff9d3fffc2dda0b9))
- **css:** read the fluid type styles from their v11 maps ([dc5fb46](https://github.com/carbon-design-system/carbon-components-svelte/commit/dc5fb46f3848407b7beaab04d3256f9281939adb))
- **css:** show selected and disabled states in forced colors ([958b0f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/958b0f07a6d05fd4b52598e363bcb1ff8b8dbc3f))
- **css:** show selected labels in forced colors ([be03803](https://github.com/carbon-design-system/carbon-components-svelte/commit/be0380335dfb2a994fcd6adb5090f745049369b5))
- **css:** thicken field focus rings in forced colors ([cad5284](https://github.com/carbon-design-system/carbon-components-svelte/commit/cad5284c54b5757c88b93968925df5e7d976ea2d))
- **data-table:** add inputForm for the selection inputs ([72795f1](https://github.com/carbon-design-system/carbon-components-svelte/commit/72795f11436b0eada1a77dfa52b4becaadd4ec75))
- **data-table:** allow `columnAlign` on an empty header ([0e5c26d](https://github.com/carbon-design-system/carbon-components-svelte/commit/0e5c26df46c8036c6443f0853ad93af7be1aba6a))
- **data-table:** allow a null sortKey ([52889ec](https://github.com/carbon-design-system/carbon-components-svelte/commit/52889ec25d47829dbcd08e4239d7c78d9ae230a4))
- **data-table:** don't name the skeleton toolbar as a region ([02ef63a](https://github.com/carbon-design-system/carbon-components-svelte/commit/02ef63a19f81df7daf0b9c03b45ee0baf0afa21d))
- **data-table:** draw a 16px search close icon in small toolbars ([194fc1d](https://github.com/carbon-design-system/carbon-components-svelte/commit/194fc1ddae206128dfa2c2403eda46e77b778227))
- **data-table:** draw the first selected row's top border as in v11 ([0f5f6da](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f5f6dae805623f88a36970a869cfffdaf81cd12))
- **data-table:** draw zebra stripes with layer-accent, as in v11 ([73a6fdb](https://github.com/carbon-design-system/carbon-components-svelte/commit/73a6fdb28d6bf8e92c70e24d233a2033c792191f))
- **data-table:** estimate medium virtual rows at 40px ([b132fa3](https://github.com/carbon-design-system/carbon-components-svelte/commit/b132fa3b8fd00535adcd1bc73e686bc60d2094d4))
- **data-table:** fill selected rows with Highlight in forced colors ([632d579](https://github.com/carbon-design-system/carbon-components-svelte/commit/632d57927713880ea67ce5fb86c70b40934900e3))
- **data-table:** fit a grid or flex parent, and scroll there by keyboard ([c3833f4](https://github.com/carbon-design-system/carbon-components-svelte/commit/c3833f463bf0c8ba921e06b94b3d7697d4e0011c))
- **data-table:** forward aria naming to the table ([c62f003](https://github.com/carbon-design-system/carbon-components-svelte/commit/c62f0037940fa542bfe72ae9866c2a77318875c0))
- **data-table:** keep a collapsed toolbar search from shrinking ([fc45c77](https://github.com/carbon-design-system/carbon-components-svelte/commit/fc45c771383d82596135eb94e02822641c964d91))
- **data-table:** keep checked rows on reset without inputName ([d8b54b7](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8b54b76acc684e5cac311d87abace47fc94450c))
- **data-table:** keep focus when a row action removes its own row ([ff5ae7c](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff5ae7c505ff649224c0ad86dd784ad906cd6cca))
- **data-table:** keep row heights with a small tag in a cell ([baab8ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/baab8ea9e419a3ffa4ae629eba39ade9150b7656))
- **data-table:** keep the header in view when virtualize scrolls ([bc2f18a](https://github.com/carbon-design-system/carbon-components-svelte/commit/bc2f18a0aa6ac42a25987b7985b931df83cedfde))
- **data-table:** keep the header type through column settings helpers ([f331a49](https://github.com/carbon-design-system/carbon-components-svelte/commit/f331a49bbd601837ef89a79fcf2ff94488a39395))
- **data-table:** leave a skeleton header blank when it has no value ([11c98c5](https://github.com/carbon-design-system/carbon-components-svelte/commit/11c98c55d8b4a6c24317116d92f769ecd3648583))
- **data-table:** name ToolbarSearch by default ([9bcaefa](https://github.com/carbon-design-system/carbon-components-svelte/commit/9bcaefaf229ef83916a97a33b77d92e21ec4cf5d))
- **data-table:** pad the bottom of tall cells ([ab4fb61](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab4fb61dcc5463ec17ad7c114fdd306709c1baf6))
- **data-table:** render the virtualized sticky-header scroll style on the server ([652f26f](https://github.com/carbon-design-system/carbon-components-svelte/commit/652f26fe8d6ee1624aed5ccb23708abb23ac5574))
- **data-table:** scroll a focused row control clear of the sticky header ([02b146f](https://github.com/carbon-design-system/carbon-components-svelte/commit/02b146f4d4b44147a53eed229372922c7c4d569f))
- **data-table:** show select all as mixed in server markup ([d41e46f](https://github.com/carbon-design-system/carbon-components-svelte/commit/d41e46f05d77cf4c81be8fcd230a115e0f9a69ac))
- **data-table:** size the selection column under fixedLayout ([5d94332](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d94332375da4cd2935a1155bdeff28ac6df7606))
- **data-table:** stripe the second row pair of expandable tables ([9f3b4ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f3b4ad9c1e77ae35ab39e3eb296f308cde96fcf))
- **data-table:** sync the row selection after a form reset ([a953fdb](https://github.com/carbon-design-system/carbon-components-svelte/commit/a953fdb533c5a0c32a2cf084d8298b1edf8a71a3))
- **data-table:** type `Table`'s `ref` as the section it binds ([e1ee3cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1ee3cf9a4bb97ba225897b2c95c97bb99e62003))
- **data-table:** type a computed column, whose key isn't a row's ([218cc29](https://github.com/carbon-design-system/carbon-components-svelte/commit/218cc2939fddb43ce37061056804178ef0867c4a))
- **data-table:** type a slot-drawn column with a visible label ([5114020](https://github.com/carbon-design-system/carbon-components-svelte/commit/511402079b1b9445767469492c3035382378e680))
- **date-picker:** accept a time in the derived input pattern ([6a4af20](https://github.com/carbon-design-system/carbon-components-svelte/commit/6a4af2043b03b4513945196726bccfd3dbf62f09))
- **date-picker:** close the calendar when disabled turns on ([33e170f](https://github.com/carbon-design-system/carbon-components-svelte/commit/33e170f15227b000a5a6c30546986f73c4dd5432))
- **date-picker:** close the gap above an inline calendar ([c2f57ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/c2f57eff38a447cbc0c5564cffc2f2e34834a9d5))
- **date-picker:** close the popup when focus tabs out of the calendar ([e07e8cb](https://github.com/carbon-design-system/carbon-components-svelte/commit/e07e8cba0744365e7cb80c89410b2f3ddec4572c))
- **date-picker:** cut a multiple value between dates ([cca5267](https://github.com/carbon-design-system/carbon-components-svelte/commit/cca5267ea8ca417fa5ed9d763b8cf8dbb56e6197))
- **date-picker:** draw a fluid read-only cell before hydration ([e4ef092](https://github.com/carbon-design-system/carbon-components-svelte/commit/e4ef092d02d9cea646af00a9237c7d3795512a80))
- **date-picker:** drop the unstyled no-label class ([33343c6](https://github.com/carbon-design-system/carbon-components-svelte/commit/33343c637d6debbb79c845f20c11f26007c64cd2))
- **date-picker:** fit fluid date pickers to narrow containers ([7a96481](https://github.com/carbon-design-system/carbon-components-svelte/commit/7a964816e4b738bd5414054449287beb4082c916))
- **date-picker:** fit single and range pickers to narrow containers ([d6e63c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6e63c48d5fb20023b19d6251dd269dd1c9b5b2a))
- **date-picker:** fluid helper text and calendar icon ([2509a85](https://github.com/carbon-design-system/carbon-components-svelte/commit/2509a85afae7264ba9efb622dee7740f8baa84ba))
- **date-picker:** follow a disabled fieldset ([b199936](https://github.com/carbon-design-system/carbon-components-svelte/commit/b199936513066bc390504aaaa582e37bd332560d))
- **date-picker:** format and parse flatpickr's time tokens ([a652166](https://github.com/carbon-design-system/carbon-components-svelte/commit/a652166a3aa65988d41038d8681f120aaf6f50f4))
- **date-picker:** keep `selectTextOnFocus` selection after a click in Safari ([c852233](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8522338c8343a5181b1168055e50ea2b896497b))
- **date-picker:** keep a date's text in order in right-to-left pages ([261d0a6](https://github.com/carbon-design-system/carbon-components-svelte/commit/261d0a6ca04ec49de1c5a5a351b602bbc406c553))
- **date-picker:** keep an inline range's end field level with the start ([6f72210](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f7221011a5e82b5c09369dbee27f180813e8b87))
- **date-picker:** keep arrow keys off days blocked by range limits ([461a84a](https://github.com/carbon-design-system/carbon-components-svelte/commit/461a84a6e0c8ab311435d057b5ed63882cfbfb8e))
- **date-picker:** keep flatpickr plugins, now, and locale modules working ([97cd31d](https://github.com/carbon-design-system/carbon-components-svelte/commit/97cd31dbeb5a8c2496dd63fb77fa2a96856057e2))
- **date-picker:** keep focus in an input focused before hydration ([8e90872](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e90872d164ed63c84969813e11788bd3760a008))
- **date-picker:** keep the AI label off the clear button ([4066712](https://github.com/carbon-design-system/carbon-components-svelte/commit/406671226c68a888af4e5a79643a59628e89497b))
- **date-picker:** keep the calendar open on an IME Escape ([b746959](https://github.com/carbon-design-system/carbon-components-svelte/commit/b746959f1e5aec1cf9ce4a67cf47c40d0a5557e5))
- **date-picker:** match the locale's month names in the input pattern ([f8ae566](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8ae566c4a6f80329697538cd2af4f5f3e90d5ca))
- **date-picker:** name AM and PM in the picker's locale ([dada866](https://github.com/carbon-design-system/carbon-components-svelte/commit/dada866eb73e7425a244df328d9668caf9299163))
- **date-picker:** name and order dates by the Gregorian calendar ([6f78337](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f783370ec9580897135625130a9e905ffc11cd4))
- **date-picker:** only mark out-of-range months and years aria-disabled ([ca09b5b](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca09b5b4e2293f35eeb80717ca1a35c4d0b50cf0))
- **date-picker:** outline an invalid fluid picker in the server's markup ([05c0b89](https://github.com/carbon-design-system/carbon-components-svelte/commit/05c0b89b4dba4b5af682f1f489669b2d85d599e7))
- **date-picker:** parse the AM/PM token ([230561a](https://github.com/carbon-design-system/carbon-components-svelte/commit/230561acd6df42a79bc3d7834240a0ad6fabf8e1))
- **date-picker:** portal a calendar that a box around it would cut off ([78661fe](https://github.com/carbon-design-system/carbon-components-svelte/commit/78661fed7e95935971b75022681fde69b312a0c1))
- **date-picker:** remove listeners without AbortSignal options ([d04bd2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d04bd2a769fe2d6022eaed1d030382b9510c0450))
- **date-picker:** run flatpickr's monthSelect and scroll plugins ([0b776bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b776bc43fe14defd6c5387d07853aeb755d8275))
- **date-picker:** run the calendar right to left in RTL ([7379cb5](https://github.com/carbon-design-system/carbon-components-svelte/commit/7379cb55a48531a5c110890f0277b31164b5bb69))
- **date-picker:** show the full multiple value on hover and focus ([8934b2d](https://github.com/carbon-design-system/carbon-components-svelte/commit/8934b2d93753a9d04caea9f3252c13f4e18256f6))
- **date-picker:** stop fluid invalid outline from doubling up ([aee9b1b](https://github.com/carbon-design-system/carbon-components-svelte/commit/aee9b1ba1fd9563d7e9ae11a083e81bb61c47e79))
- **date-picker:** stop range pickers leaking their second input ([094e7ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/094e7cab588b462383e3f1eea8e79ae3c0f22bd3))
- **date-picker:** style only the readonly prop as read-only ([1bd6dd5](https://github.com/carbon-design-system/carbon-components-svelte/commit/1bd6dd51333141f15643a8306e64a73680e30901))
- **date-picker:** style only the readonly prop as read-only ([36fe1b0](https://github.com/carbon-design-system/carbon-components-svelte/commit/36fe1b0b0cdfb2f00ca2ff70dc6e6f6e67a02b5e))
- **date-picker:** sync value when minDate/maxDate drop the selection ([26bd52a](https://github.com/carbon-design-system/carbon-components-svelte/commit/26bd52abcb0943acecb977f5dc8ec372a953de1b))
- **date-picker:** take down a calendar whose build throws ([60fae96](https://github.com/carbon-design-system/carbon-components-svelte/commit/60fae96a90e496ed2bef70545c890ca2f22bd9dd))
- **date-picker:** update the header month when locale changes ([4a3e108](https://github.com/carbon-design-system/carbon-components-svelte/commit/4a3e10810572eeb9577acaa50d70a4b34f218ebb))
- **date-picker:** warn when short is set on a non-simple picker ([f01f1d0](https://github.com/carbon-design-system/carbon-components-svelte/commit/f01f1d0e94b3c8a48cd6aa4089320dd8c037429b))
- **date-picker:** write a year-first locale's word after the year ([402dbf0](https://github.com/carbon-design-system/carbon-components-svelte/commit/402dbf0c9bec14a208b2993be670b01cca6e5512))
- **dialog:** keep modal open on drag-release and padding clicks ([fbcedef](https://github.com/carbon-design-system/carbon-components-svelte/commit/fbcedef4436b3d1466a84a775ee7176649c998ce))
- **dialog:** render `open` on the server for non-modal dialogs ([b91f5a3](https://github.com/carbon-design-system/carbon-components-svelte/commit/b91f5a3a58262f6eff74ff4d371a53b98d06bdb2))
- **dialog:** stop Svelte 3/4 from closing an open dialog on update ([33792cd](https://github.com/carbon-design-system/carbon-components-svelte/commit/33792cd5bb4e47e2e017852b1ce60493ffc087dc))
- **disclosure:** forward aria naming to the trigger button ([665595f](https://github.com/carbon-design-system/carbon-components-svelte/commit/665595f9810dc75c021169685336ab2804903447))
- **disclosure:** ignore bubbled animationend from descendants ([d60395a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d60395aa3a32d7abf589883c2abac3f744b6b19a))
- **dropdown, multi-select, search:** helper text in inline and fluid ([38ccef5](https://github.com/carbon-design-system/carbon-components-svelte/commit/38ccef5b0f14a0ba11735125430eaa1fff88c76d))
- **dropdown:** announce the invalid message as an alert ([6579b45](https://github.com/carbon-design-system/carbon-components-svelte/commit/6579b45aa0356fa8c3c22ebca101b093c9b1fe8f))
- **dropdown:** close the menu when disabled or readonly turns on (#5321) ([5495e05](https://github.com/carbon-design-system/carbon-components-svelte/commit/5495e0514bf5f204e3ad2b80504495ac2fa02cf2))
- **dropdown:** dispatch clear when Delete or Backspace clears ([4827d31](https://github.com/carbon-design-system/carbon-components-svelte/commit/4827d31842ebbfde061c8477bceb3d585c1d881e))
- **dropdown:** follow a disabled fieldset ([305a8ee](https://github.com/carbon-design-system/carbon-components-svelte/commit/305a8ee789a61d8b7e3b5103ccf0027195ab6f40))
- **dropdown:** forward aria-labelledby and aria-describedby to the combobox ([d701bdc](https://github.com/carbon-design-system/carbon-components-svelte/commit/d701bdcc4bb4723620f009729d84697229a1839a))
- **dropdown:** honor form on the hidden input ([9de397e](https://github.com/carbon-design-system/carbon-components-svelte/commit/9de397e137bc66d8f98557ad4cbf8e331ef7b857))
- **dropdown:** keep a read-only Dropdown closed on Space ([30bacb6](https://github.com/carbon-design-system/carbon-components-svelte/commit/30bacb6aa5a0c57c91c0fa750d5ecad6d029a39f))
- **dropdown:** keep the invalid icon clear of the clear button ([327c206](https://github.com/carbon-design-system/carbon-components-svelte/commit/327c20601f56a8799f1e1f86b645315e7526c688))
- **dropdown:** pass the selection clear label through a typed wrapper ([6c4ff98](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c4ff98a7437ca61588e920194c11d399d9cfd03))
- **dropdown:** render no text when the label is unset ([9803820](https://github.com/carbon-design-system/carbon-components-svelte/commit/9803820053dd68390e7c4be9861c4bda1e42ef7a))
- **dropdown:** render size="lg" at 48px like ComboBox and MultiSelect ([9e5bda6](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e5bda6fe19e17002950e0b72df0bce659973625))
- **expandable-tile:** apply `tabindex` to the chevron button ([3be0f54](https://github.com/carbon-design-system/carbon-components-svelte/commit/3be0f54b26bb04fdc252a230d0f70ea948b2229c))
- **expandable-tile:** drop the tile-wide click affordance with interactive content ([f36cd26](https://github.com/carbon-design-system/carbon-components-svelte/commit/f36cd2628c593d8e87ef18c461415174f76a7de4))
- **expandable-tile:** forward focus and blur from the chevron button ([3398528](https://github.com/carbon-design-system/carbon-components-svelte/commit/3398528b9a02f4e3d7166702445e0d773ab0687d))
- **expandable-tile:** name the chevron by its visible label ([0e037bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/0e037bc67ca00e570cb907e7d75c1c4a30f1e86d))
- **expandable-tile:** render without `ResizeObserver` ([2cf3b5b](https://github.com/carbon-design-system/carbon-components-svelte/commit/2cf3b5b136202fbd33d083337d7faa0ca451835b))
- **expandable-tile:** set aria-controls and detect interactive content ([83f3b2f](https://github.com/carbon-design-system/carbon-components-svelte/commit/83f3b2f4b923c8a823a56a8b3ee7af1eff56830b))
- **expandable-tile:** show a focus ring on the interactive chevron ([001e754](https://github.com/carbon-design-system/carbon-components-svelte/commit/001e754218d0a0ba2aa745066638930cbda368e7))
- **expandable-tile:** size the interactive chevron button to its label ([e15f674](https://github.com/carbon-design-system/carbon-components-svelte/commit/e15f674f98480784d8c2f5a640a03621dfdbcec9))
- **file-uploader-button:** forward aria-label to the button ([7ae327e](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ae327ec648975150395743ba1606a38d5035964))
- **file-uploader-button:** keep the icon-only style after a pick ([b50eeea](https://github.com/carbon-design-system/carbon-components-svelte/commit/b50eeea8777680e1076d12d3677704751323a110))
- **file-uploader-button:** restore the current labelText on clear ([be83095](https://github.com/carbon-design-system/carbon-components-svelte/commit/be83095154378ba517ad4e1faa886e5688243082))
- **file-uploader-drop-container:** forward aria-label to the drop target ([a40ca1f](https://github.com/carbon-design-system/carbon-components-svelte/commit/a40ca1fcd877187b0215c21cc81d586e66a1c84a))
- **file-uploader-drop-container:** honor form on the file input ([16cd153](https://github.com/carbon-design-system/carbon-components-svelte/commit/16cd15362bf41013ae5658ab1f1e800e3ea130d7))
- **file-uploader-drop-container:** keep a re-picked file in single mode ([d1bc8cb](https://github.com/carbon-design-system/carbon-components-svelte/commit/d1bc8cb3436b227f65026744967bfd10b4025063))
- **file-uploader-drop-container:** keep one file in single mode ([f4eb6ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/f4eb6edb7ac26649dcadfb3ff6fbe37e2b86c4bd))
- **file-uploader:** announce a completed upload ([55166d1](https://github.com/carbon-design-system/carbon-components-svelte/commit/55166d182dd5d57d812b9a5320aa148f7e4aea5d))
- **file-uploader:** announce item errors and link them to the remove button ([279a11d](https://github.com/carbon-design-system/carbon-components-svelte/commit/279a11dd0cf90d52ec96b68250d2266dac7712d4))
- **file-uploader:** apply accept to dropped files ([ac015a5](https://github.com/carbon-design-system/carbon-components-svelte/commit/ac015a5bf8e42feefb16e67e11b4a4f66f804818))
- **file-uploader:** clear files after a form reset ([3605360](https://github.com/carbon-design-system/carbon-components-svelte/commit/3605360b1391f5b39acacbf8800b48d6c8855132))
- **file-uploader:** describe an invalid row's remove button with its error ([889ac72](https://github.com/carbon-design-system/carbon-components-svelte/commit/889ac721fe8893962b85ed188021507065887b48))
- **file-uploader:** disable row remove buttons when disabled ([c7d6ead](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7d6ead342cbdd0516621c877b2120695091fee2))
- **file-uploader:** dispatch change when a file row is removed ([d4cfd50](https://github.com/carbon-design-system/carbon-components-svelte/commit/d4cfd507667b19fdb3d6f5d5cf2df3db76bf68fd))
- **file-uploader:** dispatch delete once per key press ([c6df12f](https://github.com/carbon-design-system/carbon-components-svelte/commit/c6df12fbb64addd1e59326fb0e4f0eb428ce2683))
- **file-uploader:** dispatch one click per file row removal ([eadc210](https://github.com/carbon-design-system/carbon-components-svelte/commit/eadc2105e71eb0015057be9c3e491c42a07e26b8))
- **file-uploader:** follow a disabled fieldset ([d49967d](https://github.com/carbon-design-system/carbon-components-svelte/commit/d49967dae124f9136983905793d8ea49e9534cdf))
- **file-uploader:** forward aria-describedby to the focusable element ([10464d1](https://github.com/carbon-design-system/carbon-components-svelte/commit/10464d1a6d49ad9bffc8f9520a2de07a1acf7012))
- **file-uploader:** forward aria-label to the add button ([05dfbfa](https://github.com/carbon-design-system/carbon-components-svelte/commit/05dfbfa0e493baccc7c014e8e15cbc2768ccc0fd))
- **file-uploader:** hide the native file input from screen readers ([a1ac34a](https://github.com/carbon-design-system/carbon-components-svelte/commit/a1ac34a913f55ab0fdbde919927a3c437b451fac))
- **file-uploader:** honor form on the file input ([ef320e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/ef320e5432b31a324d6926f84e65f18a5ea5ab46))
- **file-uploader:** honor prevented keys and keep focus on file removal ([9f508f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f508f9ba81f407a80bbb4e7ddb858e2dd4d4e4c))
- **file-uploader:** keep the drop container's input inside the page ([c79f53b](https://github.com/carbon-design-system/carbon-components-svelte/commit/c79f53bead12da3a96a9de6396e1a5be094b7df8))
- **file-uploader:** let native `change` bubble from `FileUploaderButton` ([cb0edfd](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb0edfd57fdd50c1fa4884c171a03472e3ec1278))
- **file-uploader:** name each remove button after its file ([f6d4ff2](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6d4ff2554f6672e0aebbdc446390863e1fc6562))
- **file-uploader:** render the drop target as a div, not a label ([17de64f](https://github.com/carbon-design-system/carbon-components-svelte/commit/17de64f6892b273220c39975c045beb5ab156c5d))
- **file-uploader:** snap the browse button focus ring ([21b0110](https://github.com/carbon-design-system/carbon-components-svelte/commit/21b0110b127e556debb67943b8156737a2680ee9))
- **floating-portal:** place a box inside a transformed target ([dde4b70](https://github.com/carbon-design-system/carbon-components-svelte/commit/dde4b709e643dd3a67dc15dcd960b46019ee2ccc))
- **floating-portal:** place again when an ancestor's motion ends ([7964dd5](https://github.com/carbon-design-system/carbon-components-svelte/commit/7964dd56a695e854806505415c741f158197fcea))
- **fluid:** show a cut-off field label on hover ([a0d06af](https://github.com/carbon-design-system/carbon-components-svelte/commit/a0d06af45ba1baf82164b4f1e27b287ba41ec7bd))
- **fluid:** truncate long labels instead of scrolling them ([ba19a76](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba19a76b1b588ded61e20a1a7d49b52b898b6fb4))
- **form-group:** announce the invalid message ([be5706d](https://github.com/carbon-design-system/carbon-components-svelte/commit/be5706db748deab880bfb79a0021634f5fe42078))
- **form-group:** omit an empty aria-labelledby ([0dcbb9c](https://github.com/carbon-design-system/carbon-components-svelte/commit/0dcbb9cf4830a5fb44910b6fcb27b5160ce92b54))
- **form-group:** stop copying aria-labelledby onto the legend id ([b4df5b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4df5b10e2f93fa21c23f4bf13c9ac48487d2d0f))
- **form-helper-text:** follow a disabled fieldset ([1f52473](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f5247396e404b30ea52cf588d018d97db1ec8e4))
- **form-item:** give repeated helper text and messages their own ids ([2704ed4](https://github.com/carbon-design-system/carbon-components-svelte/commit/2704ed448534fec887eabbe3f7efbb6dee949339))
- **form-item:** keep helper ids when a control's description changes ([2f0258d](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f0258d2a1ee05c0e818beaf9e6a1d364cfe4ff7))
- **form-item:** restore a control's own aria-invalid after an error ([1291e5a](https://github.com/carbon-design-system/carbon-components-svelte/commit/1291e5a31c4263f338aaf81d34962c598199c516))
- **form-label:** follow a disabled fieldset ([d9f1d5d](https://github.com/carbon-design-system/carbon-components-svelte/commit/d9f1d5dc94c4406e991d37beab5ff2c823805ff9))
- **form-label:** leave out `for` when no control is named ([8b0856c](https://github.com/carbon-design-system/carbon-components-svelte/commit/8b0856cb234f8b66abb19851f71696f3d84f9f7a))
- **form:** accept readonly `actions` entries in `Form` and `FluidForm` ([1634d24](https://github.com/carbon-design-system/carbon-components-svelte/commit/1634d24f8e88aa12836a78f0146996b234498a98))
- **form:** declare `FormAction` typedefs once ([56bf9ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/56bf9ab9222c45cfd2727ec31dd59f2aaac84efb))
- **form:** render a field's invalid or warning message only when it has text ([0082efb](https://github.com/carbon-design-system/carbon-components-svelte/commit/0082efb650e43a19762ebaa7888bf786251574d9))
- **fuzzy-match:** keep indices on the text when lowercasing changes it ([91df74e](https://github.com/carbon-design-system/carbon-components-svelte/commit/91df74e736a28c53ed727b767e55135bad62a40f))
- **fuzzy-match:** match astral characters as a subsequence ([f95ccf2](https://github.com/carbon-design-system/carbon-components-svelte/commit/f95ccf2dd462c6dc773187bee2655e8ef8801b6b))
- **header-nav-item:** move the Tab stop when the current page changes ([0df5bd3](https://github.com/carbon-design-system/carbon-components-svelte/commit/0df5bd30bee57ca90729ff6e6455740ab1551696))
- **header-nav-menu:** close on item activation and refocus the trigger ([aac7920](https://github.com/carbon-design-system/carbon-components-svelte/commit/aac792032ebdec06b4c72ad0b3cffb37360c1fc8))
- **header-nav-menu:** leave modified arrow keys to the browser ([62b2b94](https://github.com/carbon-design-system/carbon-components-svelte/commit/62b2b940bb91f4bd26b43e903a3327301c5cd71a))
- **header-nav-menu:** stop pulling focus back to the trigger on blur ([33ad47a](https://github.com/carbon-design-system/carbon-components-svelte/commit/33ad47a8e30090980cba69661f3444eb52bb38d1))
- **header-search:** ignore keys that belong to an IME composition ([e1bebfb](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1bebfbce8dd42d383c4d529803fab9efcfc13d4))
- **header-search:** keep `selectTextOnFocus` selection after a click in Safari ([29db7c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/29db7c43ca82157d7bb328c2b567aa6e15ba1585))
- **header-search:** keep focus in the input when the menu is pressed ([6d82868](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d82868c169b4906f34c8db4752395800ca126f1))
- **header-search:** name the results menu only while it's shown ([215bf78](https://github.com/carbon-design-system/carbon-components-svelte/commit/215bf7868eb67eeb0b0eb9234e951c160244534d))
- **header-search:** name the search button and results with labelText ([e78aa16](https://github.com/carbon-design-system/carbon-components-svelte/commit/e78aa169835fce41349a9cfb4b578ccd8969cf51))
- **header-search:** return focus to the search button on keyboard close ([efcb0d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/efcb0d590529573f053ed584662f80f7e3aec84d))
- **header-search:** type `select` for menu-slot items too ([e7472d9](https://github.com/carbon-design-system/carbon-components-svelte/commit/e7472d9f9deeaba863da41c8a33e0f7c2eed1123))
- **header-switcher:** take the header's text color ([9b2e58b](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b2e58bef52acc7dd55a153c63b86a7d772a2f3b))
- **header:** forward aria naming to the banner ([ca6f2f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca6f2f91fd4331647707faea6f31f3cfe0cafe15))
- **heading:** follow Section level changes after mount ([0ed8fd5](https://github.com/carbon-design-system/carbon-components-svelte/commit/0ed8fd504ff750ce6ffe5432b4f3760040c7f9b6))
- **heading:** honor an explicit `level` on nested sections ([a8d8172](https://github.com/carbon-design-system/carbon-components-svelte/commit/a8d81720dccccb8b9c5e895bf463454c8578d5fe))
- **icon-indicator:** read as text in forced colors ([d1126e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/d1126e5450a6dad7136d7c36137558b59e0ad2fe))
- **icons:** type the `title` prop as a string ([1eb7b38](https://github.com/carbon-design-system/carbon-components-svelte/commit/1eb7b3814fbc5bdac46de5931d38984f372397cd))
- **image-loader:** ignore a superseded image's late load and error ([f8159c2](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8159c2e526448aca2a737a5544e2f54c7256c86))
- **image-loader:** render a hidden `<img>` in the server HTML ([1d8e7fd](https://github.com/carbon-design-system/carbon-components-svelte/commit/1d8e7fd02273fb3584ba1199cf25e48858d5b9df))
- **image-loader:** reset when src is cleared and treat empty src as idle ([af027ae](https://github.com/carbon-design-system/carbon-components-svelte/commit/af027aeb886784562e362c5e96ba0d76467acb03))
- **image-loader:** show the loading slot when src changes after a load ([3b2587f](https://github.com/carbon-design-system/carbon-components-svelte/commit/3b2587f1041be169c3475d2b6cf8b736d6887158))
- **image-loader:** show the URL passed to loadImage ([9b38520](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b38520fcb7a6ddcb39de5fca4974f09fa690b41))
- **inline-checkbox:** drop the stale aria-checked from select all ([dec76b7](https://github.com/carbon-design-system/carbon-components-svelte/commit/dec76b7ade81cdc0dd76fd55bb78020243367ddd))
- **inline-edit:** announce invalidText as an alert ([f819fe2](https://github.com/carbon-design-system/carbon-components-svelte/commit/f819fe20bcc469f2c80e52f90ecf8467bfb10159))
- **inline-edit:** follow a disabled fieldset ([9ffc348](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ffc3486113b286e113a8481a402d011e3e56c4b))
- **inline-loading:** draw the finished checkmark (#5339) ([10b1769](https://github.com/carbon-design-system/carbon-components-svelte/commit/10b17691e0c18e00c9a8c6f608644bb361d1a251))
- **inline-loading:** keep the spinner off its text in RTL ([ed87d0a](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed87d0acdb36bb52b78641e7672a798edfb1b182))
- **inline-loading:** send success when mounted finished with no delay ([40c7f87](https://github.com/carbon-design-system/carbon-components-svelte/commit/40c7f875e2b4c9a9265f26c08c2a885e9e4d9a52))
- **inline-loading:** stop firing success after status leaves finished ([ed392fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed392fc519747e87296b730442e0bf823e80b449))
- **inline-notification:** ignore timeout on a notification with an action ([0abe695](https://github.com/carbon-design-system/carbon-components-svelte/commit/0abe695cddfc64c3552867dab5c5608ca1069c28))
- **inline-notification:** lay out by its own width, not the window's ([8a1d837](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a1d837f3cbb53c840df9195f377da6f5ee953e2))
- **input-group:** hide invalid and warn states when disabled ([a368dee](https://github.com/carbon-design-system/carbon-components-svelte/commit/a368deebd9eeb9bd98fbce71cd4c7fdc0581d0d2))
- **interstitial-screen:** keep full-screen open on IME Escape ([f799674](https://github.com/carbon-design-system/carbon-components-svelte/commit/f799674dd51457c98a9166503a98c0ae42ea5730))
- **interstitial-screen:** keep Get Started when last view is removed ([ea83cec](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea83cec35cb8b65d575ea1b69003dc87babeaf6a))
- **interstitial-screen:** order late-inserted views by DOM position ([de29c9f](https://github.com/carbon-design-system/carbon-components-svelte/commit/de29c9f123b23d54e6623a9b8bf8ed78ec41d026))
- **interstitial-screen:** return focus to the opener without `launcherButtonRef` ([d430462](https://github.com/carbon-design-system/carbon-components-svelte/commit/d430462f85eb65c975eab2d40150e1bcfbfedf44))
- **interstitial-screen:** show only the current step before hydration ([c50f92e](https://github.com/carbon-design-system/carbon-components-svelte/commit/c50f92e8e29379e54b0195330bdc84a665a8250b))
- **link:** keep a visited link's color while pressed or disabled ([03c7e3f](https://github.com/carbon-design-system/carbon-components-svelte/commit/03c7e3f05585614c878c721476e0c81edf02e098))
- **link:** let inline links wrap and match v11 active and focus styles ([bb50d2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb50d2a50add871baad321f3aafe99aac45e77cf))
- **list-box-selection:** keep rest props with a selection count ([1e607db](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e607db0abe98562190282ac151fe9efa0a5773a))
- **list-box:** draw one divider between options in forced colors ([ec89e35](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec89e35e4e57ca09ff5c52d0daa806815d930830))
- **list-box:** draw one edge around the field and menu in forced colors ([9a543da](https://github.com/carbon-design-system/carbon-components-svelte/commit/9a543da4863d0cbbd12c6629101c1ced7a604142))
- **list-box:** keep an inline field's warning icon off its value ([0b0f4c5](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b0f4c5779801c4602052241f0f64a72fe42628a))
- **list-box:** keep an inline label's words whole in a narrow row ([3d72d22](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d72d2215303bb94ebab6ac43f651cd4cc66b1ff))
- **list-box:** keep the highlighted option in view when keys outrun frames ([879f551](https://github.com/carbon-design-system/carbon-components-svelte/commit/879f55193492fecfba43fbb6218a26cc3b14a751))
- **list-box:** keep the menu open on an IME Escape ([d48f15d](https://github.com/carbon-design-system/carbon-components-svelte/commit/d48f15d741497b4344845c7beefc0fc251e15921))
- **list-box:** leave a menu that's open off-screen on its side ([1053f08](https://github.com/carbon-design-system/carbon-components-svelte/commit/1053f0877bada2906cf579ecfd398be9b75419e2))
- **list-box:** let Escape reach a parent Modal when the menu is closed ([b314b8e](https://github.com/carbon-design-system/carbon-components-svelte/commit/b314b8ee8faa6aceaa10c199e000ef69f8b43475))
- **list-box:** open a menu above when it doesn't fit below ([a93ccc3](https://github.com/carbon-design-system/carbon-components-svelte/commit/a93ccc32f1c5d230655eae4f69c36f9cfae95e73))
- **list-box:** outline the highlighted option and space icons as in v11 ([e07b0b3](https://github.com/carbon-design-system/carbon-components-svelte/commit/e07b0b320f711d01b841bd4a9f32938fd98e8947))
- **list-box:** pass `disabled` on non-form elements through a spread ([2c29dab](https://github.com/carbon-design-system/carbon-components-svelte/commit/2c29dab53702c879e6511bc41e84d7d4e5495656))
- **list-box:** portal a menu that a box around it would cut off ([6e437e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e437e9bf9d352ff06a36c0295bba2b593b630a4))
- **list-box:** read typed filter text in its own direction ([31a1008](https://github.com/carbon-design-system/carbon-components-svelte/commit/31a1008dac6c6248fe9646487115113b3a33f1d3))
- **list-box:** set aria-invalid on invalid list box fields ([ae853f4](https://github.com/carbon-design-system/carbon-components-svelte/commit/ae853f40f716dbc74b304a1c6d5fcb316ecbe6e9))
- **list-box:** show a cut-off selected label on hover ([0c27b70](https://github.com/carbon-design-system/carbon-components-svelte/commit/0c27b70c3847c5e34ad6df978745e4fa34cd9279))
- **list-box:** space groups twice as far apart as their options ([cf6111f](https://github.com/carbon-design-system/carbon-components-svelte/commit/cf6111f451ed491af4b68b62711f8ce7e3ac3959))
- **list-box:** thin the field ring while an option is highlighted ([1462781](https://github.com/carbon-design-system/carbon-components-svelte/commit/14627811913abbb339ac7c88b759df8c3105afb1))
- **list:** indent top-level lists as in v11 ([2ad3434](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ad3434a5939ae710e92732529b74ca4d01749c9))
- **loading:** draw the spinner in system colors in forced colors ([067cfb0](https://github.com/carbon-design-system/carbon-components-svelte/commit/067cfb05128a44c6269bf9f6a3f5443656aca42c))
- **loading:** remove the assertive live region from the spinner ([275a685](https://github.com/carbon-design-system/carbon-components-svelte/commit/275a6857d14bee1498b514347a1d0fe1a252d427))
- **loading:** trap and restore focus while an overlay is active ([3cd7043](https://github.com/carbon-design-system/carbon-components-svelte/commit/3cd7043722713f1683eb2ac9fbdf72cefa52c92a))
- **local-storage, session-storage:** ignore other storage area events ([54f57a9](https://github.com/carbon-design-system/carbon-components-svelte/commit/54f57a9b66171a4eed784943824192489a178bab))
- **local-storage, session-storage:** keep JSON-like strings as strings ([78303af](https://github.com/carbon-design-system/carbon-components-svelte/commit/78303afd2f2aa94faa7b43ae4b51e7e66b290015))
- **local-storage, session-storage:** reset value on clearItem/clearAll ([b81dfc1](https://github.com/carbon-design-system/carbon-components-svelte/commit/b81dfc1a4c441adaed4ec3f64d83e66b50faa811))
- **local-storage, session-storage:** reset value on remote clear() ([9e976a5](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e976a562a0f2a44b647047192112d95b82b2f73))
- **local-storage, session-storage:** stop writing back remote values ([e1521d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1521d5ee39980d5f96ec253f37a6fa356a09c4b))
- **menu-button:** close the menu when disabled turns on ([b52fabd](https://github.com/carbon-design-system/carbon-components-svelte/commit/b52fabd7823a28ebd55ee0feea9395e3cc9b7ffe))
- **menu, tooltip, tag:** keep menus and tooltips open on an IME Escape ([ede211c](https://github.com/carbon-design-system/carbon-components-svelte/commit/ede211c08bfd3cf270f8f3385b8d067e56ea75b5))
- **menu:** don't clip custom labelChildren content ([5410180](https://github.com/carbon-design-system/carbon-components-svelte/commit/5410180e5bf2b1bcfcfbae4a021f6b7bd3810e98))
- **menu:** keep a MenuButton's menu inside the window ([a25a5d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/a25a5d857be845513d18af042ee478315ce4f09f))
- **menu:** keep a submenu open while the pointer moves toward it ([ae90b3f](https://github.com/carbon-design-system/carbon-components-svelte/commit/ae90b3f0193f0e67d41c6de78b2522dd71476dde))
- **menu:** keep an unchecked item unchecked when the menu reopens ([3e02b7e](https://github.com/carbon-design-system/carbon-components-svelte/commit/3e02b7ee192bdca0b7a15c6a85ee9cd28bd422f1))
- **menu:** keep disabled items focusable ([c5e7515](https://github.com/carbon-design-system/carbon-components-svelte/commit/c5e751516be144d3d63a658ee973b991483320ed))
- **menu:** open menus and submenus toward the inline end in RTL ([afdf2c8](https://github.com/carbon-design-system/carbon-components-svelte/commit/afdf2c83c43a325ed67a59d149e7eb53ce125557))
- **menu:** read a disabled MenuItem as GrayText in forced colors ([8b4ff1b](https://github.com/carbon-design-system/carbon-components-svelte/commit/8b4ff1b3ecb4d9f7eaefc0a135326ffd537386fd))
- **menu:** return focus to the anchor after selecting an item ([7b77cb2](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b77cb2407a9c48d8a7fed6d6e452ee8913eae50))
- **menu:** return focus to the anchor on Escape or Tab inside a submenu ([18d360e](https://github.com/carbon-design-system/carbon-components-svelte/commit/18d360e8fffcc803e542a55cf7bf27969aefd02c))
- **menu:** start arrow keys from the clicked item ([23851ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/23851ad61facc56fb1f804ec9498b32d0946ec70))
- **menu:** vertically center custom labelChildren content ([df103e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/df103e5a5b7e2d085d62f53b58d45ab78a558478))
- **meter:** collapse the label row when `hideLabel` leaves it empty ([ba46c15](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba46c155d92f59bb4f44f0ca2e431233afbbb893))
- **meter:** describe the status when valueText is set ([93f4fae](https://github.com/carbon-design-system/carbon-components-svelte/commit/93f4faeb931d2ac289caea965892a2559310a88d))
- **meter:** drop the `@slot` tag for a default slot it never renders ([ba109e1](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba109e1c051c56446e4996484c0c243ad3c8515d))
- **meter:** fill the bar for an infinite value instead of emptying it ([ba72060](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba72060cc23b16e6d4eea7819d74557bacf50117))
- **meter:** forward aria naming to the meter element ([412271f](https://github.com/carbon-design-system/carbon-components-svelte/commit/412271fb96103e5c5b0f9b08b5876f823f147c8b))
- **meter:** hide the label row when hideLabel has whitespace valueText ([33f31de](https://github.com/carbon-design-system/carbon-components-svelte/commit/33f31def9f4649c2567dc64ce78231c988eff5c3))
- **modal:** don't restore focus over a close handler that moved it ([046adb0](https://github.com/carbon-design-system/carbon-components-svelte/commit/046adb0202952c8a5295764ff8498072adc5d168))
- **modal:** focus an element created in the update that opens it ([74dfdfd](https://github.com/carbon-design-system/carbon-components-svelte/commit/74dfdfd1f557dc46cb236569dff36d3c0d6ce58a))
- **modal:** focus the dialog when nothing else can take focus ([0647462](https://github.com/carbon-design-system/carbon-components-svelte/commit/0647462f28e20192817e6f1c0df896ef42e1bff8))
- **modal:** forward aria naming to the dialog ([10e716b](https://github.com/carbon-design-system/carbon-components-svelte/commit/10e716bfe16c5fba7ae669ea4eed625de01c9b07))
- **modal:** keep focus when a backdrop press does not dismiss the dialog ([02b98d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/02b98d8d0b61e9009ecc7212ccb38a19bd5c2032))
- **modal:** keep transactional modals open on an outside click, as in v11 ([5ccb5db](https://github.com/carbon-design-system/carbon-components-svelte/commit/5ccb5dbcab2fb07e7cb321a742031301351a6701))
- **modal:** leave handled Tab to nested modals and children ([4e666cc](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e666cc38dfbcdbf7de19812184fd8ed0e7cf089))
- **modal:** let a consumer aria-label name the dialog ([c4f8fcb](https://github.com/carbon-design-system/carbon-components-svelte/commit/c4f8fcb0cd861a082d6087a34a65e1cae7e7e89b))
- **modal:** match v11 container, header and footer spacing ([c87e4ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/c87e4ead180c3f1f3ff2d880a48817aa1487d0d4))
- **modal:** mirror the close button in RTL ([da7c25d](https://github.com/carbon-design-system/carbon-components-svelte/commit/da7c25dfeb1fd4f309603e9f8a4593b60dd849eb))
- **modal:** put every aria-* attribute on the dialog ([1fc63d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/1fc63d2fcc9a5f637d5fdc619d445017c2f5a69a))
- **modal:** render the label slot without modalLabel ([393c578](https://github.com/carbon-design-system/carbon-components-svelte/commit/393c5786793d09ae61405847935f7735496d7af6))
- **modal:** return focus to the button a click opened the modal from ([d1b412c](https://github.com/carbon-design-system/carbon-components-svelte/commit/d1b412c5404960c679c8ca44a5a1a849797ecfe5))
- **modal:** return focus to the opener when the close has no transition ([8ff2654](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ff26547b0bbf307eb746449ba9d3455ed0221e1))
- **modal:** return focus when the closing transition never runs ([e1aa227](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1aa227348d9550faab1f6b77a366eccc0ed8ec8))
- **modal:** ring scrolling content only for the keyboard ([c1eb5ae](https://github.com/carbon-design-system/carbon-components-svelte/commit/c1eb5aef5f7ecfae8edcab527022efe91eecc687))
- **modal:** size the overlay and dialog by the modal's container ([5cef9f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/5cef9f0ce34b4966edc385692eadbe57e307fd2d))
- **modal:** skip a disabled button for the first focus ([a5e6276](https://github.com/carbon-design-system/carbon-components-svelte/commit/a5e627645750374fc0b0388d1878f8ee87d524f3))
- **modal:** use an h2 heading, as in v11 ([8e099bb](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e099bb57ecfc8067a58e24657271b7a49dca653))
- **multi-select:** announce the invalid message as an alert ([1a5e647](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a5e6476cba8881de6b422d5effbb4db31018c98))
- **multi-select:** clear selectionRef and fieldRef on unmount ([29b51c8](https://github.com/carbon-design-system/carbon-components-svelte/commit/29b51c897d23ca25b64ea36dd3700e851228bcd8))
- **multi-select:** close the menu when disabled turns on ([00b64be](https://github.com/carbon-design-system/carbon-components-svelte/commit/00b64bea0b124aebced71bd95367099da43c4006))
- **multi-select:** dispatch clear when Delete or Backspace clears ([69555c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/69555c47188fb77cdbbb4f20d15f90152ae38d08))
- **multi-select:** drop the second invalid outline on filterable inputs ([7b013f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b013f8676bd5f6b73b4b821cceb0c05b51f5c4f))
- **multi-select:** fit the count tag to xs and sm fields ([adb6e9e](https://github.com/carbon-design-system/carbon-components-svelte/commit/adb6e9e0fa55f5cddc3e7c1edeb79d32f58cc023))
- **multi-select:** follow a disabled fieldset ([9fee4f2](https://github.com/carbon-design-system/carbon-components-svelte/commit/9fee4f2fd43fc3aa403ece0b5af567c9dd76ec79))
- **multi-select:** honor form on the hidden inputs ([32462ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/32462ad5467496f801a88d22d763d9a72bed5110))
- **multi-select:** keep `selectTextOnFocus` selection after a click in Safari ([178d6a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/178d6a03b5cdb39f45449dcab01b7adb31a949e8))
- **multi-select:** keep the filter status icon left of the clear button ([2ad01e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ad01e91ef4d4dd263e76cf039255da28eeec9fe))
- **multi-select:** keep the option checkbox's default value on Svelte 3/4 ([c54a4b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/c54a4b48f09bdf45033787039e38814d14c4f8cb))
- **multi-select:** label options with `itemToInput`'s `labelText` ([bcfd877](https://github.com/carbon-design-system/carbon-components-svelte/commit/bcfd8770393a401efa44a87b7e24118454b1e3bd))
- **multi-select:** reopen a virtual menu at the top ([daeaba1](https://github.com/carbon-design-system/carbon-components-svelte/commit/daeaba114ca768bc45f4aaa19b9d25aab8ecb48f))
- **multi-select:** show the focus outline on an invalid multi-select ([d3a1c0e](https://github.com/carbon-design-system/carbon-components-svelte/commit/d3a1c0ec03e27a5f867eee56f16c60110f77e36c))
- **multi-select:** stop range selection at maxSelectedItems ([c64fffe](https://github.com/carbon-design-system/carbon-components-svelte/commit/c64fffe69d765754fdaf4d53cd1f545e015e4fdf))
- **multi-select:** stop rendering `open` on the clear-filter button ([e23dfb8](https://github.com/carbon-design-system/carbon-components-svelte/commit/e23dfb80a0aed6de4ee33013b3c9eda14b6a5693))
- **multi-select:** sync the filter value after a form reset ([0b5bb24](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b5bb24b81e6b1c496bfdd2fc937de26698cfd4d))
- **multi-select:** validate a required field against its form attribute ([36270c8](https://github.com/carbon-design-system/carbon-components-svelte/commit/36270c808fa25f021590e1a2eea76c929061c055))
- **notification-queue:** hold layout while the pointer is in the queue ([cca1107](https://github.com/carbon-design-system/carbon-components-svelte/commit/cca1107b26417d4dc7b639ee70833cccd02b5a77))
- **notification-queue:** move focus to the next toast after a close ([78e4e75](https://github.com/carbon-design-system/carbon-components-svelte/commit/78e4e75be54382a85e339a40c04368e9ce3fa38b))
- **notification:** default to role="status" and name the status icon, as in v11 ([7470ea8](https://github.com/carbon-design-system/carbon-components-svelte/commit/7470ea81bfdf9b1fb0e9bf0b0c92e3c51f0edc9f))
- **notification:** describe the action by the notification title ([22bbac3](https://github.com/carbon-design-system/carbon-components-svelte/commit/22bbac3478c69831e1456a6b7cd5ac202d65591f))
- **notification:** fit inline and toast notifications to narrow containers ([667f1b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/667f1b65b6372640ad3002122d3a92e1a26a33d3))
- **notification:** keep the timeout paused while hovered or focused ([300313b](https://github.com/carbon-design-system/carbon-components-svelte/commit/300313b8fdc1f3eddabdd6aa84bd212bea34ebb5))
- **notification:** let one class restyle icon fill ([e518464](https://github.com/carbon-design-system/carbon-components-svelte/commit/e518464fc0b6c57e137d6122f6208f5244ac4480))
- **notification:** let one class restyle link color ([69955bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/69955bccdd1f96d0b686724e3af9419762ea579a))
- **notification:** let one class restyle low-contrast backgrounds ([7b44f54](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b44f548f515283974681930ea922e02b31aeb63))
- **notification:** mirror notifications and callouts in RTL ([d8a7c87](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8a7c879c9748b7174bf9f9cf45fc1ea388994bf))
- **notification:** return focus after closing a focused notification ([76c03d3](https://github.com/carbon-design-system/carbon-components-svelte/commit/76c03d38635c99ae446601a6cf972ada332ea896))
- **notification:** return focus when the queue removes a focused toast ([d575a9e](https://github.com/carbon-design-system/carbon-components-svelte/commit/d575a9eb33eb7cb483051d0f700e25f7a551a90c))
- **notification:** stop setting the queue id as the toast's DOM id ([8970276](https://github.com/carbon-design-system/carbon-components-svelte/commit/897027638d0ddd1777ec2e69ebfeaf421c9b5fec))
- **notification:** type the rest props on Toast and InlineNotification ([7dc71b3](https://github.com/carbon-design-system/carbon-components-svelte/commit/7dc71b36b5f7fe454ce24c1348c65ba7a36eea68))
- **notification:** underline links in the subtitle ([7681439](https://github.com/carbon-design-system/carbon-components-svelte/commit/76814399c1ce7e5eb3a9cb8ce40866815c64f57a))
- **notification:** use inverse colors for content in high-contrast notifications ([09f148b](https://github.com/carbon-design-system/carbon-components-svelte/commit/09f148bce4ab81dd3b733cd800c297b11b07d90f))
- **number-input:** describe only rendered helper or error text ([5cd0e85](https://github.com/carbon-design-system/carbon-components-svelte/commit/5cd0e853827d322f374f3e9cd68f1175a8ad4922))
- **number-input:** draw the stepper dividers with v11's tokens ([233d2ce](https://github.com/carbon-design-system/carbon-components-svelte/commit/233d2cefafacf9328fd18d21afcf74beee677ccd))
- **number-input:** drop stepper padding when `hideSteppers` is set ([e9e35d0](https://github.com/carbon-design-system/carbon-components-svelte/commit/e9e35d055d1015f8262dfe357c20bec5306f7254))
- **number-input:** end a scrub when disabled or readonly turns on ([aed994d](https://github.com/carbon-design-system/carbon-components-svelte/commit/aed994d335aa6d4c61fbd8d2436bda76d4560f60))
- **number-input:** fit narrow columns and keep the value visible ([ac7be9b](https://github.com/carbon-design-system/carbon-components-svelte/commit/ac7be9ba32e473b1c38c42606bb22b1877093435))
- **number-input:** follow a disabled fieldset ([fd1671c](https://github.com/carbon-design-system/carbon-components-svelte/commit/fd1671cb393e2efed76a4b9ae5f40bda47babd86))
- **number-input:** keep `selectTextOnFocus` selection after a click in Safari ([b62ccf4](https://github.com/carbon-design-system/carbon-components-svelte/commit/b62ccf42eba7f4bcf029ec5172ccd4680831c016))
- **number-input:** keep a negative value's minus sign in front ([3d7c378](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d7c37874f47386b3ff4a761e9e92687db6c0c0c))
- **number-input:** read back only the symbols the locale formats ([bd71a99](https://github.com/carbon-design-system/carbon-components-svelte/commit/bd71a99a9a858a5c359b8f8cddca44ac878d0ac9))
- **number-input:** read back the text a formatted locale displays ([fe4d199](https://github.com/carbon-design-system/carbon-components-svelte/commit/fe4d199fa205fb0b60a786bfc1fd9a5c78ec51bf))
- **number-input:** reformat the value when formatOptions change ([fce7874](https://github.com/carbon-design-system/carbon-components-svelte/commit/fce7874c887d6ac64c23c0515fc0dd32d5c49f82))
- **number-input:** render a read-only field as a text input ([b737c66](https://github.com/carbon-design-system/carbon-components-svelte/commit/b737c660485cc48baf2bc8e8c152d082dda51da1))
- **overflow-menu:** close the menu when disabled turns on ([6890666](https://github.com/carbon-design-system/carbon-components-svelte/commit/6890666eef870b74916e5674b671418bb267eede))
- **overflow-menu:** close the menu when Tab moves focus out ([726dd3d](https://github.com/carbon-design-system/carbon-components-svelte/commit/726dd3dc88a9e2f51ab1c369669d9da2109648df))
- **overflow-menu:** draw the trigger ring only when focused or open ([1bde5e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/1bde5e32f324ab9dfafe3b12106506fb4fb5721d))
- **overflow-menu:** focus the first enabled item on open ([568c89d](https://github.com/carbon-design-system/carbon-components-svelte/commit/568c89d96433f630b770f541b88a0d516531c7b8))
- **overflow-menu:** forward aria attributes to the menu item ([3de78af](https://github.com/carbon-design-system/carbon-components-svelte/commit/3de78af50d6d08de143d6ac42d71bbd17c577e2c))
- **overflow-menu:** forward aria naming to the menu item ([89035de](https://github.com/carbon-design-system/carbon-components-svelte/commit/89035de7f88add2dbc9858713d71370aeab6be5d))
- **overflow-menu:** keep item order and close index in sync with the DOM ([db8e128](https://github.com/carbon-design-system/carbon-components-svelte/commit/db8e128187cceddee02985660225cd75f7ac09e2))
- **overflow-menu:** leave focus alone when rendered open ([965ac1f](https://github.com/carbon-design-system/carbon-components-svelte/commit/965ac1f44e9739214b98fdbb9cd55d317d6bbc7f))
- **overflow-menu:** name the trigger and show its tooltip, as in v11 ([123ed3b](https://github.com/carbon-design-system/carbon-components-svelte/commit/123ed3baf973d65dfb58ca4ae14c1ae774f7b4bf))
- **overflow-menu:** return focus to the trigger after selecting an item ([3cfff5e](https://github.com/carbon-design-system/carbon-components-svelte/commit/3cfff5eb383947957692a3c449e1f07f0aa7e499))
- **overflow-menu:** set `aria-controls` only while the menu is open ([efb2bd2](https://github.com/carbon-design-system/carbon-components-svelte/commit/efb2bd29b632429b56f31b4516c933bfc9c7d83a))
- **overflow-menu:** track item text and disabled changes after mount ([afd154f](https://github.com/carbon-design-system/carbon-components-svelte/commit/afd154f2143dd0fd9bb3b836b5d550a66a0ee37e))
- **page-header:** describe the default slot instead of a "Page" slot ([ed06a51](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed06a51e85268e03fa5ac3962cd8b42689d25244))
- **page-header:** keep body panels working when header tabs mount late ([e642e34](https://github.com/carbon-design-system/carbon-components-svelte/commit/e642e34d1f27c1f07426111a7ef49cea15ea3de4))
- **pagination-nav:** announce a page change only in the nav used ([d169216](https://github.com/carbon-design-system/carbon-components-svelte/commit/d169216d3a38c0614e6e63292fb4431d1b93b6b4))
- **pagination-nav:** clamp the page when total shrinks ([6aaac61](https://github.com/carbon-design-system/carbon-components-svelte/commit/6aaac61e2c3de0b147054c745e6f76000bf6eea6))
- **pagination-nav:** wrap the pages at narrow widths ([7534179](https://github.com/carbon-design-system/carbon-components-svelte/commit/75341797c42f5c1b1002795dfdad01b26a7c62e6))
- **pagination:** don't fire update when clamping the initial page ([1f691fb](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f691fb00d363a0de97035b0d8a369a39ec3b287))
- **pagination:** don't override focus a change handler moved ([1a313b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a313b6f2b2b38dffa1775d20e5cc8c80be005aa))
- **pagination:** draw the separators beside the selects ([b627341](https://github.com/carbon-design-system/carbon-components-svelte/commit/b62734154b2f377dfcc49a39f7af77a7d657a75b))
- **pagination:** hide the page select when pages are unknown ([249b862](https://github.com/carbon-design-system/carbon-components-svelte/commit/249b86283f5b8d9fb3af8b4e7d743de9402001e8))
- **pagination:** keep force-enabled nav buttons within the page bounds ([b596817](https://github.com/carbon-design-system/carbon-components-svelte/commit/b5968179ac3b566295577dfe121f90d2ae497964))
- **pagination:** lay out by the pagination's own width ([0666c26](https://github.com/carbon-design-system/carbon-components-svelte/commit/0666c26d3fd986f536a52c0d5460e2249ee29668))
- **pagination:** put separators and gaps on the inline start in RTL ([21b3c9b](https://github.com/carbon-design-system/carbon-components-svelte/commit/21b3c9bc2d3c8fa85d2ed004a46cfa59a66cdd52))
- **pagination:** select the current page in server-rendered markup ([d4bbf50](https://github.com/carbon-design-system/carbon-components-svelte/commit/d4bbf50ad4f50081da81cf692ce8e49bfccd2353))
- **pagination:** show a narrow skeleton's bars instead of none ([9a014c1](https://github.com/carbon-design-system/carbon-components-svelte/commit/9a014c1f0e361536139994285357835bb0edefe1))
- **pagination:** use singular "page" in the page select label ([5c931e1](https://github.com/carbon-design-system/carbon-components-svelte/commit/5c931e123d1fda34e553e31232966a9bcfecb747))
- **password-input:** describe the field with its helper text ([f7faecd](https://github.com/carbon-design-system/carbon-components-svelte/commit/f7faecdd294bb05abe6968bee427aaa28d2ef459))
- **password-input:** drop the in-place tooltip classes in a portal ([44d6bc1](https://github.com/carbon-design-system/carbon-components-svelte/commit/44d6bc16acfd00356dce6ed1d54794a4689c9b0f))
- **password-input:** give the inline label the TextInput label column ([f633ff1](https://github.com/carbon-design-system/carbon-components-svelte/commit/f633ff1315b87ed0415ad7ebb2aab5e7fbf889d7))
- **password-input:** keep `selectTextOnFocus` selection after a click in Safari ([f141729](https://github.com/carbon-design-system/carbon-components-svelte/commit/f1417298ed60480e746247410d233e29e4403a6f))
- **pin-code-input:** fit the segments to a narrow container ([3274f97](https://github.com/carbon-design-system/carbon-components-svelte/commit/3274f971312a51c1f87fc4bdbf2a46a0be0200b4))
- **pin-code-input:** follow a disabled fieldset ([db37ada](https://github.com/carbon-design-system/carbon-components-svelte/commit/db37adaf2679a0508c7b9a1a1f532a182b8bf4fb))
- **pin-code-input:** forward aria naming to the fieldset ([a5dce0c](https://github.com/carbon-design-system/carbon-components-svelte/commit/a5dce0c03332400d65cd741846e2e8c336b093d9))
- **pin-code-input:** honor form on the hidden input and segments ([b5d6311](https://github.com/carbon-design-system/carbon-components-svelte/commit/b5d63119c9d329d2573eb22dafdafdde5e7b3f32))
- **pin-code-input:** keep `selectTextOnFocus` selection after a click in Safari ([e2efa85](https://github.com/carbon-design-system/carbon-components-svelte/commit/e2efa85d7382efa25674e64df32e65a1c85cfefd))
- **pin-code-input:** leave the legend out of the tab order ([ffb8a30](https://github.com/carbon-design-system/carbon-components-svelte/commit/ffb8a30556639a1c7a6e437f9e9be40deec4fe57))
- **pin-code-input:** reset the code of an outside form ([2aa4b03](https://github.com/carbon-design-system/carbon-components-svelte/commit/2aa4b03fc10bbe5cad399228cfc80330003bb972))
- **pin-code-input:** swap Left and Right in RTL ([5134d8a](https://github.com/carbon-design-system/carbon-components-svelte/commit/5134d8a2d186cf9b8b9a7610259a1467bdc1d212))
- **popover:** keep an open popover in view ([ea293b2](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea293b25911b5605b97ef92eb103aefb4a672b51))
- **popover:** keep open on an Escape that cancels IME composition ([c361623](https://github.com/carbon-design-system/carbon-components-svelte/commit/c361623ac28bd20b8023a8e0a5c53e846bc29f12))
- **popover:** open below when neither side has room ([c764c71](https://github.com/carbon-design-system/carbon-components-svelte/commit/c764c7112426db9b7969116ca6674a026f744afb))
- **popover:** outline floating surfaces in forced colors ([1fcac1e](https://github.com/carbon-design-system/carbon-components-svelte/commit/1fcac1e3314612d942a06924166389808b751804))
- **portal:** mount floating menus inside the fullscreen element ([1ec8539](https://github.com/carbon-design-system/carbon-components-svelte/commit/1ec85392e4c3f2bc56eb14a5979736c1f02a1bf9))
- **portal:** portal menus clipped by paint containment ([b446bc8](https://github.com/carbon-design-system/carbon-components-svelte/commit/b446bc81533d23b4cdb47a99242640c1ee47cab7))
- **portal:** render portal content only after mount ([df829d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/df829d2172306ebb16358b16a3a49d01d1dcee37))
- **progress-bar:** collapse the label row when `hideLabel` leaves it empty ([70a2bd3](https://github.com/carbon-design-system/carbon-components-svelte/commit/70a2bd3cdac970ddb49ac32f6be7e7939624472a)), closes [#4315](https://github.com/carbon-design-system/carbon-components-svelte/issues/4315)
- **progress-bar:** don't clip custom labelChildren content ([4e8940c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e8940ce11f6df78946532fa96d906ac165dd058))
- **progress-bar:** don't render `transform: false` on the server ([63950ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/63950ea8d49376a0fe29b2ec31a680c83404ce27))
- **progress-bar:** fix value text order and position in RTL ([27d09f3](https://github.com/carbon-design-system/carbon-components-svelte/commit/27d09f39a5f1d052a9724ef48d8da09033f384d0))
- **progress-bar:** forward aria naming to the progressbar element ([e4e701e](https://github.com/carbon-design-system/carbon-components-svelte/commit/e4e701e273cde3522e1a0ef2d328848e82c2b17d))
- **progress-bar:** show the bar and meter fill in forced colors ([6ac6464](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ac646451c31346b8a74960e04722900cb8a9737))
- **progress-bar:** stop throwing when valueText is cleared after mount ([480b854](https://github.com/carbon-design-system/carbon-components-svelte/commit/480b854cd2ecd1401a8b5feac94eb07c74527418))
- **progress-bar:** use the v11 track color ([4136107](https://github.com/carbon-design-system/carbon-components-svelte/commit/4136107206cb618060071c93ac10543170be0437))
- **progress-bar:** vertically center custom labelChildren content ([e54ae20](https://github.com/carbon-design-system/carbon-components-svelte/commit/e54ae201803f1109584834d4b16d21dac7ee6605))
- **progress-indicator:** don't dispatch change for the current step ([14a7c99](https://github.com/carbon-design-system/carbon-components-svelte/commit/14a7c99031fb3f4e233505b28996ba50b10b6c7a))
- **progress-indicator:** fit `spaceEqually` steps to narrow containers ([7e2cc40](https://github.com/carbon-design-system/carbon-components-svelte/commit/7e2cc40f8cf40f15a071e0becfd4156d9019cc1b))
- **progress-indicator:** forward aria naming to the step button ([b903e15](https://github.com/carbon-design-system/carbon-components-svelte/commit/b903e159cd757f43129ba3349e17465f5ccf7532))
- **progress-indicator:** index steps by their position after a reorder ([e10541f](https://github.com/carbon-design-system/carbon-components-svelte/commit/e10541f52aeb395e000edd81329fc9de22d80ff2))
- **progress-indicator:** leave modified arrow keys to the browser ([d8c62d6](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8c62d6faca6d1943da9457b69f714805a1de48c))
- **progress-indicator:** mark the current step in server-rendered markup ([97e66bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/97e66bde552af32e9888746da94a3201ed2b3a45))
- **progress-indicator:** mirror the rail and labels in RTL ([1861619](https://github.com/carbon-design-system/carbon-components-svelte/commit/186161973f21c5557d3f4d03354769354b536389))
- **progress-indicator:** show a cut-off step label on hover ([17728d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/17728d8b02e8e3a417214280253f7f141c6a2e8c))
- **prose:** force the hr rule to CanvasText in Firefox forced colors ([164be98](https://github.com/carbon-design-system/carbon-components-svelte/commit/164be988c3d2e1cefa7180c1af48ef182f83517e))
- **prose:** reserve a deferred code block the height of its lines ([19b4018](https://github.com/carbon-design-system/carbon-components-svelte/commit/19b40181a9f099ab7e21d148192d24b309cabe53))
- **radio-button-group:** announce the invalid message ([e40c993](https://github.com/carbon-design-system/carbon-components-svelte/commit/e40c99377585ee6cf7159d6ba7a57834b5f76edc))
- **radio-button-group:** follow a disabled fieldset ([e44e1d9](https://github.com/carbon-design-system/carbon-components-svelte/commit/e44e1d9912fd2faf3af1933da5286a63d34ea513))
- **radio-button-group:** pass form to the radio buttons ([55f3726](https://github.com/carbon-design-system/carbon-components-svelte/commit/55f372608457b849e9b8ab8e667b394e9754a0a4))
- **radio-button-group:** restore numeric values on form reset ([9ce8b8d](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ce8b8d516bba80c6bb5dbe6025badcf55893745))
- **radio-button-group:** type the cleared change payload as null ([651c8d9](https://github.com/carbon-design-system/carbon-components-svelte/commit/651c8d96123b15a1150305343c3c3b3ff0ac415d))
- **radio-button-group:** wrap buttons instead of splitting labels ([07c19fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/07c19fc6c9de4e2cb98aab51f48f170292d878ac))
- **radio-button:** forward aria naming to the input and radiogroup ([c8ab221](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8ab221122652fa08283436a8c5013fdb79fc750))
- **radio-button:** honor form on the radio input ([84f1dc0](https://github.com/carbon-design-system/carbon-components-svelte/commit/84f1dc003bf813543f43e4fe90074fce449c5c0e))
- **radio-button:** keep a consumer aria-label with labelText ([233f078](https://github.com/carbon-design-system/carbon-components-svelte/commit/233f07830894f0c4c88270e9a0752df90ef04ae1))
- **radio-button:** size the label to its circle and text ([2094c3e](https://github.com/carbon-design-system/carbon-components-svelte/commit/2094c3e3344b8b3a0be692fea57a809234b439b7))
- **radio-button:** uncheck same-name siblings when checked is set ([e216851](https://github.com/carbon-design-system/carbon-components-svelte/commit/e216851da6494b77d6f03189c1b50f71cc69da0b))
- **radio-tile:** carry the group selection to a checked tile's new value ([4f9605a](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f9605a9c33cb81f6287f167cb7a4119495474da))
- **radio-tile:** forward aria-label to the radio input ([811fe9f](https://github.com/carbon-design-system/carbon-components-svelte/commit/811fe9f85cb6dc0aad838bbbc27ccc1a5cf16b5c))
- **radio-tile:** forward focus and blur from the radio ([a9934e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/a9934e5ab4da0cdcb156668bb8274d4c748e4795))
- **radio-tile:** hide checkmark icon from assistive technology ([efeaf44](https://github.com/carbon-design-system/carbon-components-svelte/commit/efeaf4478ab74d94735021a6b071772820442ab0))
- **radio-tile:** honor form on the radio input ([1d79302](https://github.com/carbon-design-system/carbon-components-svelte/commit/1d793027478649d1b638e3100442f5660325e7ff))
- **radio-tile:** let Space reach the native radio ([7ceccef](https://github.com/carbon-design-system/carbon-components-svelte/commit/7cecceff5544eb864ffee00f0fdba09f26fa4602))
- **radio-tile:** push checked writes into the TileGroup ([76f3256](https://github.com/carbon-design-system/carbon-components-svelte/commit/76f3256cdc0a03e90bafd9bd9ce07e78d045bd77))
- **radio-tile:** track selection outside a TileGroup ([fa60c0e](https://github.com/carbon-design-system/carbon-components-svelte/commit/fa60c0e807a94b7f056050f5acc84df92e25efe6))
- **range-slider:** honor form on both value inputs ([410cd9f](https://github.com/carbon-design-system/carbon-components-svelte/commit/410cd9fbba0d0573fbad448d2213ebe4f4f48015))
- **range-slider:** keep `selectTextOnFocus` selection after a click in Safari ([6c5f374](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c5f374de2b58abc8c97c635203b36e9e023cee2))
- **range-slider:** keep the pressed handle focused ([e764575](https://github.com/carbon-design-system/carbon-components-svelte/commit/e764575cf0bdb723b7647234885f06477f3522c3))
- **range-slider:** keep the upper thumb inside a narrow container ([f6095ff](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6095ff784b2b3a685aff6c423f41aa36091aad2))
- **range-slider:** mirror a horizontal RangeSlider in RTL ([1706e6f](https://github.com/carbon-design-system/carbon-components-svelte/commit/1706e6f1f3cfd56ca691e3d166179298af4ab7f9))
- **range-slider:** move the upper thumb for clicks above stacked thumbs ([da0b57d](https://github.com/carbon-design-system/carbon-components-svelte/commit/da0b57d586bee919156ecef10b090f8a78843c13))
- **range-slider:** pin vertical range labels and inputs to the track ends ([0b1a965](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b1a965d1fcec638827c5940c9d0ad14c2d62188))
- **range-slider:** show read-only values as text, not number inputs ([b6e2872](https://github.com/carbon-design-system/carbon-components-svelte/commit/b6e2872145c2cef375763b418ee373da6668b01e))
- **range-slider:** track drags with pointer capture ([3ca03aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/3ca03aa23bb9b1f96465ccd245a03bc054064e13))
- **recursive-list:** keep node fields off nested lists ([9df206d](https://github.com/carbon-design-system/carbon-components-svelte/commit/9df206d84a699685376c8e7641e742060a8ca6a6))
- **recursive-list:** pass item props to `RecursiveListItem` explicitly ([91ec906](https://github.com/carbon-design-system/carbon-components-svelte/commit/91ec906d1c957e0160f748d922daee1d6472bfad))
- **recursive-list:** render nodes that mix ids and no ids ([0f5a317](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f5a3179b1d7e219ca639feb5d2cbb96144d29eb))
- **recursive-list:** skip the nested list for empty `nodes` ([a5e684e](https://github.com/carbon-design-system/carbon-components-svelte/commit/a5e684e8a50b870a74630c2405023c54f34b1f7d))
- **recursive-list:** stop rendering `native` on unordered lists ([1f2f415](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f2f4154d3fe3246b80305f4069344a55cad7287))
- **recursive-list:** type nodes by the node type, children included ([322df16](https://github.com/carbon-design-system/carbon-components-svelte/commit/322df1606383b60279b2a40f8060bfe37ffd88b7))
- **relative-time:** keep the text in its locale's direction ([84736ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/84736abcb87e7be78dd26f01251e65d02179d86a))
- **relative-time:** refresh the text when date, live or now change ([a6f65bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/a6f65bd720840240fc922ecbe2d01e52233bee6e))
- **search-menu, header-search:** submit on Enter after a hover highlight ([2bc8d46](https://github.com/carbon-design-system/carbon-components-svelte/commit/2bc8d4664215c724ee76e672b9c015a795883cea))
- **search-menu:** drop the active option when typing hides it ([2c8b663](https://github.com/carbon-design-system/carbon-components-svelte/commit/2c8b663f816e5b2eebdc837b5f179f942da25f4c))
- **search-menu:** fill the field with the picked item's text, not its value ([1d41e53](https://github.com/carbon-design-system/carbon-components-svelte/commit/1d41e530f498414d89e9404dfde09180263b388c))
- **search-menu:** ignore keys pressed during an IME composition ([2433782](https://github.com/carbon-design-system/carbon-components-svelte/commit/2433782b22b8cc32d4463ee5658ed669f380695a))
- **search-menu:** type `icon` props with a generic like other components ([e955f99](https://github.com/carbon-design-system/carbon-components-svelte/commit/e955f996f2d27338c986e6f21faa57dc6c1e766a))
- **search, header-search:** keep the query on an IME Escape ([c4080bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/c4080bc1ec02796d36a804096eb5755224c3dccc))
- **search:** default to the 40px md size, as in v11 ([8ede5de](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ede5dec7d36eb831a1a7eff1c63539427c2ba67))
- **search:** describe helper text in fluid search ([84b5f13](https://github.com/carbon-design-system/carbon-components-svelte/commit/84b5f13fd44fdc69627a5ffb3d35d10c980439fc))
- **search:** draw one focus ring while the clear button is hovered ([85638f5](https://github.com/carbon-design-system/carbon-components-svelte/commit/85638f5847fd4724a1179bd513e24c3277aa78bd))
- **search:** follow a disabled fieldset ([1907a9c](https://github.com/carbon-design-system/carbon-components-svelte/commit/1907a9cd7f6b34f574dc2eea2359b5edba3151ed))
- **search:** keep `selectTextOnFocus` selection after a click in Safari ([79122e1](https://github.com/carbon-design-system/carbon-components-svelte/commit/79122e1d102ff1359a3e57439e9aa939e1e37a06))
- **search:** keep the focus ring whole past the clear button ([d57ea80](https://github.com/carbon-design-system/carbon-components-svelte/commit/d57ea80f26f56c72f70dddedcb78e81840364c51))
- **search:** lay out fluid Search's invalid and warning states ([83a83e1](https://github.com/carbon-design-system/carbon-components-svelte/commit/83a83e16c8c9a24f97258572a9a3b62a6e0e1e26))
- **search:** move focus to the magnifier button when Escape collapses it ([b73583c](https://github.com/carbon-design-system/carbon-components-svelte/commit/b73583cec0174cae7c4b58e1a1a6d1538b6de6b9))
- **search:** read a query in its own direction ([2be2f6b](https://github.com/carbon-design-system/carbon-components-svelte/commit/2be2f6bb21ba4807fca131e98eecdee6aafe2b30))
- **search:** skip the search event on an IME Enter ([333eb4e](https://github.com/carbon-design-system/carbon-components-svelte/commit/333eb4e5fe374a4d0e6d68ef6cf3b0fda65bf532))
- **select:** announce the invalid message as an alert ([a290d65](https://github.com/carbon-design-system/carbon-components-svelte/commit/a290d650c035917740db792d22d2603a672a64a7))
- **select:** follow a disabled fieldset ([0fbd8c8](https://github.com/carbon-design-system/carbon-components-svelte/commit/0fbd8c80e966408c16d49af4bd9e725ee1ff95b5))
- **select:** hide a fluid status divider while the field is hovered ([0f1f707](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f1f707bfbe9a1d91a20695f7fdf481bf1bd81f1))
- **select:** keep inline selects at their content width in flex rows ([f46af2b](https://github.com/carbon-design-system/carbon-components-svelte/commit/f46af2baf35ce05ababca81677291db224a79e0f))
- **select:** keep the value when a script sets one it doesn't list ([d31acf5](https://github.com/carbon-design-system/carbon-components-svelte/commit/d31acf50ca903df463769f5fbe3091900472bf7a))
- **select:** lay out an inline warning like an inline error ([9992324](https://github.com/carbon-design-system/carbon-components-svelte/commit/999232438a511bed37871be272cadf6e186d15df))
- **select:** put inline helper text under the field ([cb50820](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb50820302a94798e9a688a7b563c8cc32fe9772))
- **selectable-tile-group:** dispatch events for every tile a range changes ([0995015](https://github.com/carbon-design-system/carbon-components-svelte/commit/0995015f10461b31ba6faf1c8952e2be9b83cc55))
- **selectable-tile-group:** drop disabled tiles from the tab order ([d927fb1](https://github.com/carbon-design-system/carbon-components-svelte/commit/d927fb16909b2d71b763483d6a3e4320f312fdde))
- **selectable-tile-group:** keep nested group tiles out of Shift ranges ([72ef25b](https://github.com/carbon-design-system/carbon-components-svelte/commit/72ef25b4e726ed8ec26cdbdfebfec4219c365970))
- **selectable-tile-group:** pass form to the selectable tiles ([b429db9](https://github.com/carbon-design-system/carbon-components-svelte/commit/b429db99e16a2afe49a45c9eea450b8217a485d4))
- **selectable-tile-group:** style tiles as disabled when the group is disabled ([165fcbe](https://github.com/carbon-design-system/carbon-components-svelte/commit/165fcbe8527a4333fb1bfacf001d0af962f721a5))
- **selectable-tile:** honor form on the checkbox input ([c830819](https://github.com/carbon-design-system/carbon-components-svelte/commit/c830819da3b2b364d7650232c1c20772da30fd56))
- **selectable-tile:** sync selection after a form reset ([ec7bdd6](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec7bdd6eff56d0174d3d405238e7e86c6d967f3f))
- **selectable-tile:** toggle once when Enter is held down ([811305a](https://github.com/carbon-design-system/carbon-components-svelte/commit/811305a8499729fa0f60789f295db4f37b3de76f))
- **side-nav-menu:** follow the enclosing SideNav's rail state ([b378dde](https://github.com/carbon-design-system/carbon-components-svelte/commit/b378ddee86013232f5d860da5bec636da0ea37b2))
- **side-nav-menu:** keep current-page menu collapsed in a collapsed rail ([b2694a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/b2694a8e64e3cc2767b523339e440ff65d2c32d9))
- **side-nav:** stop server renders leaking rail and width state ([9216d05](https://github.com/carbon-design-system/carbon-components-svelte/commit/9216d05c11e9960846e4f382b0f841aa6d4f9346))
- **side-panel:** leave focus alone when the panel is open on load ([7cdf53c](https://github.com/carbon-design-system/carbon-components-svelte/commit/7cdf53ca7c268115296fea6bbfcc8932b0b181d0))
- **skeleton-text:** clamp narrow paragraph widths to avoid negative px ([8c606d9](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c606d96fd33c988abdd7682fc7651ad00f38455))
- **skeleton:** count the top border in PaginationSkeleton's height ([3f33ec4](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f33ec48f5fd8420f9f52ab8092c8a6284d06a61))
- **skeleton:** draw a label bar on list box skeletons ([d40540f](https://github.com/carbon-design-system/carbon-components-svelte/commit/d40540f598b9ead0641795d59edffb7ef7821906))
- **skeleton:** draw FileUploaderSkeleton to the uploader's metrics ([db8c5d9](https://github.com/carbon-design-system/carbon-components-svelte/commit/db8c5d93bd9186a587aac4538fe276e188b37bd9))
- **skeleton:** draw PinCodeInput skeletons as segments ([da980ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/da980ef25da72427fd09e827175ec58c69a298c8))
- **skeleton:** draw the number input on Slider skeletons ([17a3d3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/17a3d3ad824ef436cd80ae527726ec5124df61b2))
- **skeleton:** draw ToggleSkeleton in the toggle's own layout ([ebd82c9](https://github.com/carbon-design-system/carbon-components-svelte/commit/ebd82c96232660a8fbbb5ba0be230c157ee9dcc3))
- **skeleton:** give ProgressIndicatorSkeleton the label's line ([91716c0](https://github.com/carbon-design-system/carbon-components-svelte/commit/91716c0984678e9d19c8f78d3b0de76306863ae8))
- **skeleton:** give RadioButtonSkeleton a radio button's height ([b8641f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/b8641f9395381c3cf0c8add6e6839f67c3c3c5b3))
- **skeleton:** give StructuredListSkeleton's rows a row's height ([c08aed1](https://github.com/carbon-design-system/carbon-components-svelte/commit/c08aed1ca591bf065ea3bc7e99703855f96ba8c8))
- **skeleton:** give the label bar a real label's line height ([7b48d96](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b48d96e6122642cd68302eb696d1acfa587811a))
- **skeleton:** keep BigNumber and PageHeader skeletons to their type's lines ([42b2fd1](https://github.com/carbon-design-system/carbon-components-svelte/commit/42b2fd11bf64bb563b4e5404acef50950921f0c0))
- **skeleton:** leave label space out of SearchSkeleton ([e1804d7](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1804d721ff8971b0084ebac64e33ca293875a7e))
- **skeleton:** match CodeSnippetSkeleton to the snippet's height ([2f30485](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f30485ec8008850a16e30cb7f54f5772101c107))
- **skeleton:** narrow BreadcrumbSkeleton's crumbs to fit a line ([0d4512d](https://github.com/carbon-design-system/carbon-components-svelte/commit/0d4512d1709d6ee09c423b2eb665ca47d4e0ab8a))
- **skeleton:** size TextArea skeletons by rows ([1d82428](https://github.com/carbon-design-system/carbon-components-svelte/commit/1d82428dc1213e1c0d3445f831e5b4dbb1ced851))
- **slider, range-slider:** catch a release right after the press ([1e3b76f](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e3b76f99e4a4c9587abb17142b5f9c916195fa8))
- **slider, range-slider:** leave modified arrow keys to the browser ([fc1ca55](https://github.com/carbon-design-system/carbon-components-svelte/commit/fc1ca55f5e972ac5419324bdacdc944463a47a78))
- **slider, range-slider:** parse typed values and resync the input ([7c2ecfa](https://github.com/carbon-design-system/carbon-components-svelte/commit/7c2ecfa380c3e2ccff25c3a8f482f9201dd782ba))
- **slider, range-slider:** round steps and align them to min ([63da8c7](https://github.com/carbon-design-system/carbon-components-svelte/commit/63da8c7e66ed000498451c890965d14f727a4461))
- **slider:** announce the invalid message ([e1cee92](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1cee92dfe93d75dfa3c4313a08b7dba42660173))
- **slider:** drop the stray width and mark disabled thumbs ([5307344](https://github.com/carbon-design-system/carbon-components-svelte/commit/5307344ebfdb9ac8d9fd78f4abea4f24a1060a9f))
- **slider:** fit sliders to narrow containers ([aa341eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa341ebe49b1a848fdc2f4b6e97cda4af3fe901f))
- **slider:** focus the thumb when pressing the track ([881ea38](https://github.com/carbon-design-system/carbon-components-svelte/commit/881ea381e34886fbb40f4bade02bcad4549515d3))
- **slider:** follow a disabled fieldset ([338dbbd](https://github.com/carbon-design-system/carbon-components-svelte/commit/338dbbd750e110874c9a32797e99cc9fa6c532d0))
- **slider:** forward aria naming to the thumbs and text inputs ([64dbe36](https://github.com/carbon-design-system/carbon-components-svelte/commit/64dbe36f6505613aa63e2b58c2c2d39e3e774073))
- **slider:** honor form on the value input ([bcc8d81](https://github.com/carbon-design-system/carbon-components-svelte/commit/bcc8d814a1d9c5a0406608b73c626043bea741cd))
- **slider:** keep `selectTextOnFocus` selection after a click in Safari ([f0f1cb4](https://github.com/carbon-design-system/carbon-components-svelte/commit/f0f1cb4aa262b030bdc26e5be9615f0e92dcf2a9))
- **slider:** keep disabled thumbs inert on press and hover ([accdf58](https://github.com/carbon-design-system/carbon-components-svelte/commit/accdf58c73b5bdc674c42ea4ded467b551a32ef8))
- **slider:** keep negative values' minus signs in front ([004c207](https://github.com/carbon-design-system/carbon-components-svelte/commit/004c207c17d19380d680e949f9b21558b1b712cc))
- **slider:** keep read-only thumbs focusable ([289cfd9](https://github.com/carbon-design-system/carbon-components-svelte/commit/289cfd9085e8fde4b4f8cacef4f3712f9ab5fc45))
- **slider:** keep read-only thumbs focusable without a text input ([3f919b9](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f919b924568789776459e6fdbdc5506cd780c09))
- **slider:** keep the range label gaps in RTL ([4d6fad6](https://github.com/carbon-design-system/carbon-components-svelte/commit/4d6fad611b1ffa873e2a8836fae31989c062edb8))
- **slider:** mirror a horizontal Slider in RTL ([f63767f](https://github.com/carbon-design-system/carbon-components-svelte/commit/f63767f2037fcf4c2efca1d783abf54fc98f0849))
- **slider:** mirror vertical mark labels in RTL ([2ac064d](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ac064d52b6699f8e020e45954415290affb4c1a))
- **slider:** move the number input below a short track ([3900058](https://github.com/carbon-design-system/carbon-components-svelte/commit/39000589224f35d355bbeedaf9e74e7c512cc824))
- **slider:** name range slider thumbs and inputs by the label ([7ea17b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ea17b427c4bdad73f6995ffd87d0790b5389ec9))
- **slider:** pin vertical range labels to the track ends and fill container height ([58216c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/58216c42c0331fd1b7be6306d127cd3adf5b1016))
- **slider:** show the read-only value as text instead of a number input (#4422) ([9a64895](https://github.com/carbon-design-system/carbon-components-svelte/commit/9a648959940585ae21cb25c64ec95325c3ce144e))
- **slider:** snap stepped values from min without float noise ([76caa3f](https://github.com/carbon-design-system/carbon-components-svelte/commit/76caa3f56f9e11550520856072c9c79eaf18cd99))
- **slider:** track drags with pointer capture ([c93f6a4](https://github.com/carbon-design-system/carbon-components-svelte/commit/c93f6a4c7f92bcd8e21d5911ce01d029c9e089d8))
- **slider:** widen the text input for values over three characters ([b5c8736](https://github.com/carbon-design-system/carbon-components-svelte/commit/b5c8736e8e12b0b072924f6dfc1f556fc76c5cc4))
- **splitter:** forward aria naming to the separator ([df22bf5](https://github.com/carbon-design-system/carbon-components-svelte/commit/df22bf592000d3bfeade8c0b25d84bdb39eaa208))
- **splitter:** keep the divider visible in forced colors ([342609d](https://github.com/carbon-design-system/carbon-components-svelte/commit/342609d6580030ff56dce8dabfd858214ef48d11))
- **splitter:** leave Alt/Ctrl/Meta+Arrow to the browser ([5058847](https://github.com/carbon-design-system/carbon-components-svelte/commit/50588472cbe25755d435c5524cd80bdfda207c0e))
- **star-rating:** clear the hover preview when it becomes disabled ([decf1c1](https://github.com/carbon-design-system/carbon-components-svelte/commit/decf1c10adf9baafd68acbb311b547633c3fc091))
- **star-rating:** follow a disabled fieldset ([708459a](https://github.com/carbon-design-system/carbon-components-svelte/commit/708459aa5291b92b6b509534a14b92c454e680b6))
- **star-rating:** reset the rating of an outside form ([74b0cb7](https://github.com/carbon-design-system/carbon-components-svelte/commit/74b0cb7af97fae5488d416bd864355b13038f78a))
- **stepper:** derive step ids from `id` so server markup is stable ([5829a86](https://github.com/carbon-design-system/carbon-components-svelte/commit/5829a868c084e2fe6c5e8b0ab11c90b4e0db7d31))
- **stepper:** drop the step name from the confirmation panel ([084b978](https://github.com/carbon-design-system/carbon-components-svelte/commit/084b9789466e04ac799546861470e963cdfc9809))
- **stepper:** scroll the progress rail instead of widening the page ([aa05708](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa057080ad87d9a2a0f3a8941ec2525c865d6078))
- **structured-list:** clear `selected` when the selected row unmounts ([1a17552](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a175524dc24fef2eb6bff196a10d4e116e48e66))
- **structured-list:** drop the hidden Select row text from the selection header ([ba6ca34](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba6ca34b707805fdc30b222956155fa978d3512f))
- **structured-list:** drop v10's bottom margin, as v11 does ([90142ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/90142ab01cffe0d5e0bd3b3558ae2b1e138f33b6))
- **structured-list:** keep `checked` rows selected without firing change ([565028b](https://github.com/carbon-design-system/carbon-components-svelte/commit/565028b0af97374dc8175bf2e7d2ec0ba1f7e30f))
- **structured-list:** keep a single `selected` value in `multiple` mode ([d9f6184](https://github.com/carbon-design-system/carbon-components-svelte/commit/d9f6184048b2d1290930cbec9aff052d7f4310dd))
- **structured-list:** style selected rows as in v11 ([afa6b5d](https://github.com/carbon-design-system/carbon-components-svelte/commit/afa6b5dc9d5edd1763f1bb5fb78fd4e4c2cd12e2))
- **structured-list:** sync the selection after a form reset ([9750435](https://github.com/carbon-design-system/carbon-components-svelte/commit/9750435634c5ebe2617c3c8c2087868eef215239))
- **structured-list:** toggle a checkbox once when Enter is held down ([01d6582](https://github.com/carbon-design-system/carbon-components-svelte/commit/01d65821f2339b739ac7aed318cdb23ebad5f9a2))
- **switch-panel:** show the selected panel in the server render ([9a119b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/9a119b415bf67b5f76f11160a13723ac3cbf9a1c))
- **switch:** render an icon set after mount ([bb6b0a2](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb6b0a21ec4a1a22828a6e46fc88de8cbd1c72e6))
- **syntax:** color comments in JSON and use the JSON lexer for jsonc ([b866c8f](https://github.com/carbon-design-system/carbon-components-svelte/commit/b866c8fe1cf562422d0799f25fa972e4455a680b))
- **syntax:** color non-ASCII JavaScript identifiers as one word ([cd4c698](https://github.com/carbon-design-system/carbon-components-svelte/commit/cd4c69874a2460b12d5b3362c712cc0a100f91f7))
- **syntax:** end `<SCRIPT>` and `<STYLE>` bodies at an uppercase close ([1358885](https://github.com/carbon-design-system/carbon-components-svelte/commit/1358885ed2c73be9eba657d4bf68bea0f56d04da))
- **syntax:** keep SCSS `url(http://…)` slashes out of line comments ([d56561a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d56561aae61d0031e8b2fd67fd04e550824565eb))
- **syntax:** mark import bindings and export default ([f289a2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/f289a2ec844f670bfc053e51e00d5972c712fcda))
- **syntax:** read JSON exponents as a single number token ([4b2cdbd](https://github.com/carbon-design-system/carbon-components-svelte/commit/4b2cdbdad8aba72cb66a4cde1c3989c5cd3b5be6))
- **syntax:** start shell comments at a word and JS hashbangs at line 1 ([3c83338](https://github.com/carbon-design-system/carbon-components-svelte/commit/3c833385604d70cc77be09c51c15d08f4613a519))
- **syntax:** tell division from a regexp after `++`, `--` and `${` ([ee23126](https://github.com/carbon-design-system/carbon-components-svelte/commit/ee23126080f6b6d1bc7101e4e0b34b7aca7f6c97))
- **syntax:** treat `constructor` and `__proto__` as unknown languages ([dbbfbe0](https://github.com/carbon-design-system/carbon-components-svelte/commit/dbbfbe076f3915c8d7abb04e7812adb547f3ab64))
- **tab-content:** make the tab panel focusable ([fd8c3a6](https://github.com/carbon-design-system/carbon-components-svelte/commit/fd8c3a66f4cfa61fae303294a808dafad37a0cd7))
- **table-body:** remove the default aria-live ([00dacf1](https://github.com/carbon-design-system/carbon-components-svelte/commit/00dacf11e0e34b1f580296c6a5141deefb1c24f7))
- **tabs-vertical:** absorb sub-pixel width at the row's end ([0108c09](https://github.com/carbon-design-system/carbon-components-svelte/commit/0108c0978d07dec5d291690610c920bb17f07f85))
- **tabs-vertical:** draw the indicator at the inline start in RTL ([ac26276](https://github.com/carbon-design-system/carbon-components-svelte/commit/ac26276c17eb25bb57b39bcdfff64126bff097be))
- **tabs, tabs-vertical:** don't dispatch change on mount for selectedId ([ed7fbab](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed7fbabef3aa09d44fd8c3886e764277790b014e))
- **tabs, tabs-vertical:** leave modified arrow keys to the browser ([a764699](https://github.com/carbon-design-system/carbon-components-svelte/commit/a764699a1d366d4a1e034f25f7444d6ae4b0ab85))
- **tabs:** derive the reserved panel id from the tab id ([010a668](https://github.com/carbon-design-system/carbon-components-svelte/commit/010a668cc719c171e9d533799cae2966a16f3ea1))
- **tabs:** dismiss with Enter or Space on a focused dismiss button ([c468496](https://github.com/carbon-design-system/carbon-components-svelte/commit/c46849623d07b7e91770d15e7b7efa6d36e99f47))
- **tabs:** draw contained tab dividers at the inline start in RTL ([df8cd61](https://github.com/carbon-design-system/carbon-components-svelte/commit/df8cd61291f51c7405e3bf95665e3d72d7f05780))
- **tabs:** draw secondary labels in server markup ([e181a8a](https://github.com/carbon-design-system/carbon-components-svelte/commit/e181a8aeeefffb1948494eb2db48ddce991614eb))
- **tabs:** draw the forced-colors focus ring only on the focused tab ([320f537](https://github.com/carbon-design-system/carbon-components-svelte/commit/320f5372160f90d9841e3761c212515b7a782413))
- **tabs:** drop the unnamed navigation landmark from the tab list ([97a72ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/97a72efff7db68cc12adeb0b971ecf202a6bb04f))
- **tabs:** forward aria naming and `aria-controls` to the tab ([b910ea1](https://github.com/carbon-design-system/carbon-components-svelte/commit/b910ea1c5ca096f28182012e75edccfac29fb1bf))
- **tabs:** keep dismiss buttons out of the tablist's owned children ([ef77e2b](https://github.com/carbon-design-system/carbon-components-svelte/commit/ef77e2b58a8004c42ea24690f59ecc6067efac79))
- **tabs:** keep dismissible line tabs at the tab height ([6ae9af4](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ae9af4a922c41979e37eb0c21d9131b26b8c9ce))
- **tabs:** keep large icon-only tabs square while focused (#5233) ([5e0be6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/5e0be6a1f4d29ac9ba4c26191975e1067c282f08))
- **tabs:** keep the focused tab in view as the scroll buttons appear ([02b86ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/02b86ef1f58ae6da58e8a3d164f55356859505ac))
- **tabs:** keep the gap between default tabs in RTL ([795e7a3](https://github.com/carbon-design-system/carbon-components-svelte/commit/795e7a34eea13701c525c3efcb3c88b9b6e4fc3f))
- **tabs:** keep the tab stop on a selected disabled tab ([489a270](https://github.com/carbon-design-system/carbon-components-svelte/commit/489a270e7f638ec811fd4d7fe9a09951621809f0))
- **tabs:** lay out sized tabs with secondary labels like unsized ones, from the first paint ([21400fa](https://github.com/carbon-design-system/carbon-components-svelte/commit/21400fab90ff4b7d4c319ba8d27f2c4e730773b8))
- **tabs:** let a consumer aria-label name the tab panel ([254768a](https://github.com/carbon-design-system/carbon-components-svelte/commit/254768aaab4a8d0b94c28705643705932ca0d232))
- **tabs:** let one class restyle container tab backgrounds ([5133eab](https://github.com/carbon-design-system/carbon-components-svelte/commit/5133eab3b5e555bb03d2147a9c962b54ba6ea4a0))
- **tabs:** let one class restyle the selected tab link ([a3bf856](https://github.com/carbon-design-system/carbon-components-svelte/commit/a3bf856db5a2bba20f4c369e667f60f84f4a57dc))
- **tabs:** render the initial `TabsVertical` selection without a fade ([f2a2166](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2a216650b8c95ffc69d92df8514d11790f397bf))
- **tabs:** render the selected tab and panel on the server ([bd19cf4](https://github.com/carbon-design-system/carbon-components-svelte/commit/bd19cf48248ce0825c0036af63649aef6d3a3976))
- **tabs:** scroll the overflow row in RTL ([4b4691a](https://github.com/carbon-design-system/carbon-components-svelte/commit/4b4691a7907979018e2e31936a8343a9017e0ef7))
- **tabs:** select a tab that registers in the same update as selectedId ([bb22c19](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb22c1973228f14e0456f45cdcdf8d88742675da))
- **tabs:** show disabled contained tabs in GrayText in forced colors ([c95969c](https://github.com/carbon-design-system/carbon-components-svelte/commit/c95969cd4c765fa5095ee72606f67797c5408478))
- **tabs:** swap Left and Right in RTL ([7e37a8a](https://github.com/carbon-design-system/carbon-components-svelte/commit/7e37a8a7b04fdab9a2693022457eb47301c530e7))
- **tabs:** sync TabsVertical keyboard orientation with its layout ([243beb3](https://github.com/carbon-design-system/carbon-components-svelte/commit/243beb34b1d1f88ecac232ead6cafd6df4df4bcc))
- **tabs:** update the tall layout when type changes ([4375e5c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4375e5c3f9afe3531a41b070bfe73c6617c43054))
- **tag-input:** an empty field is as tall as its size ([7b7ca75](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b7ca759ff068b7ad596b8b6f8eff058c1413b8d))
- **tag-input:** don't add tags from text still in an IME composition ([3f0dff3](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f0dff34d8379fd7bd2c8d11103a15f12d63d381))
- **tag-input:** drop the placeholder when read-only with tags ([ce04c36](https://github.com/carbon-design-system/carbon-components-svelte/commit/ce04c3662876a05ee0e3def0ed6c97361e51d06f))
- **tag-input:** fire invalid once for a rejected typed tag ([2a987ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a987ba6e4ec79d4aa0e088abfd460c3de43523d))
- **tag-input:** follow a disabled fieldset ([1f4fef0](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f4fef05b217ecd1263fa6057946eba36984a688))
- **tag-input:** join a consumer aria-describedby after built-in ids ([08fecbc](https://github.com/carbon-design-system/carbon-components-svelte/commit/08fecbcd412c05b28ef905fb6f604d85909ae861))
- **tag-input:** keep a tag and the input on one row in narrow fields ([21699e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/21699e377f23435d7a59866b4896d414891e513d))
- **tag-input:** keep RegExp delimiter flags and drop its captures ([217e1d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/217e1d54aa36ad34f5dddeea0aeaee40ae6a5bce))
- **tag-input:** keep the caret in place after a mid-text delimiter ([df2b6b8](https://github.com/carbon-design-system/carbon-components-svelte/commit/df2b6b86fbfb5d1fdc40319ecc2fb555109ce588))
- **tag-input:** paste text as-is when addOnPaste is false ([738c383](https://github.com/carbon-design-system/carbon-components-svelte/commit/738c3831685ce8c97cfbd623e698b0ba0d336bb9))
- **tag-input:** require a tag, not just text in the field ([667b1a6](https://github.com/carbon-design-system/carbon-components-svelte/commit/667b1a60820b5819fb3cde4234b79fb37b3cdb9b))
- **tag-input:** show a message when validate returns false ([9d3d708](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d3d708293427300adf8bdd65f0ff0672199102f))
- **tag-input:** show the invalid and warning messages ([a065882](https://github.com/carbon-design-system/carbon-components-svelte/commit/a0658822965e7fc93878693dba724539bd02e02d))
- **tag-input:** space wrapped xs rows 4px apart ([f6490d0](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6490d0dd2e8a26234e51fa40f5efd706f059cc3))
- **tag-input:** swap Left and Right in RTL ([98179af](https://github.com/carbon-design-system/carbon-components-svelte/commit/98179af3284d5b010578dd61ec6023997193cfc7))
- **tag-set:** clip a one-line set to its width before it measures ([e6cd790](https://github.com/carbon-design-system/carbon-components-svelte/commit/e6cd790b004ee6b1a6abd9c8395dee998bd35095))
- **tag-set:** close one tag per Delete or Backspace press ([dde2764](https://github.com/carbon-design-system/carbon-components-svelte/commit/dde27649330c6b3656014f326f0a2d7673347f60))
- **tag-set:** follow a keyed reorder of its tags ([495a071](https://github.com/carbon-design-system/carbon-components-svelte/commit/495a0714ee5eafdeeb175c0592484910e015a566))
- **tag-set:** keep the "+N" overflow count reading "+1" in RTL ([dd4f653](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd4f653e78c6f74232e0ea38d6869973138760a7))
- **tag-set:** leave modified arrow keys to the browser ([5a637e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/5a637e922319f415bf8dcdecb6fa043bb5965ee1))
- **tag-set:** move focus to a neighbouring tag after closing one ([96e9e52](https://github.com/carbon-design-system/carbon-components-svelte/commit/96e9e52a8c426aba64d89ae3e162e50b0f094a6f))
- **tag:** apply tabindex to a truncated label's tooltip trigger ([3a3f9ec](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a3f9ec0c6310e27e97089f837d00e18325ad7fb))
- **tag:** cap width with a tooltip and use v11 focus and borders ([555db6b](https://github.com/carbon-design-system/carbon-components-svelte/commit/555db6be1fa181ee65a71a443a1271e4aec59a24))
- **tag:** drop the outer margin, as in v11 ([a7de3c2](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7de3c20e4b93a20446133f8521e2650ecbea9fb))
- **tag:** drop the underline from link tags ([a52b487](https://github.com/carbon-design-system/carbon-components-svelte/commit/a52b4871ed46d480a73b00b1222a6cc88884b2c9))
- **tag:** follow a disabled fieldset ([c6d47c8](https://github.com/carbon-design-system/carbon-components-svelte/commit/c6d47c8e9ea68c76f10d40e85e562a4e849e923f))
- **tag:** forward aria naming to the filter close button ([8f4d912](https://github.com/carbon-design-system/carbon-components-svelte/commit/8f4d912f531f53502b0bb2e551fa8b5b125b3d01))
- **tag:** keep a truncated filter tag to one tab stop ([5e6bc87](https://github.com/carbon-design-system/carbon-components-svelte/commit/5e6bc879e7bb5ec2bc08ac5dc4623c9355e65a27))
- **tag:** let TagSet arrow keys reach a tag after filter toggles ([7f3e558](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f3e558e54bfde38a40c3e568b967715e7c5f27d))
- **tag:** name each filter tag's close button by its text ([b540f1b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b540f1b904fbdfed29d8eb3d2314ebb58b5aee3a))
- **tag:** pad the start of a tag with an icon in RTL ([435f3b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/435f3b465e67b3eb8febc0cd6a9dee89cf1b503f))
- **tag:** render the icon in a filter tag ([0f59486](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f594863de5b2d69accc853aa38da1461b0e5a86))
- **tag:** show the close button focus ring only for the keyboard ([b99be10](https://github.com/carbon-design-system/carbon-components-svelte/commit/b99be10f6646293155ad2277770f04bd15415e71))
- **tag:** size the large filter tag's close button to 32px ([705c635](https://github.com/carbon-design-system/carbon-components-svelte/commit/705c6354f91fe7f07c06020616ef71949c0a89cd))
- **text-area:** describe the warning in fluid forms ([11e6b2b](https://github.com/carbon-design-system/carbon-components-svelte/commit/11e6b2b59fa28171b337580ca644d53a66a73fc5))
- **text-area:** follow a disabled fieldset ([ab6aafb](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab6aafb09eb27a0453ddaf4596648bc75f458787))
- **text-area:** keep `selectTextOnFocus` selection after a click in Safari ([faef3cb](https://github.com/carbon-design-system/carbon-components-svelte/commit/faef3cb0c2f2ad8a62b019fde9d3807eda6f69ae))
- **text-area:** keep the counter's hidden text inside the page ([9139dde](https://github.com/carbon-design-system/carbon-components-svelte/commit/9139ddeeb85e7bec4357938101099ab32ca80758))
- **text-area:** wait 1s before announcing the limit, as TextInput does ([793050d](https://github.com/carbon-design-system/carbon-components-svelte/commit/793050d91542ba0561ecabc2b0cb2604eaa773ec))
- **text-input:** announce the character counter ([e07d35e](https://github.com/carbon-design-system/carbon-components-svelte/commit/e07d35ecaad50b2be2dbc386ffb27f1dea77ebb7))
- **text-input:** follow a disabled fieldset ([6f99ff8](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f99ff8e6fd2b194b0c0bd84f973d1589e4ecc8d))
- **text-input:** hide the empty inline label column with `hideLabel` ([bb9f8ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb9f8ca5a59cd6b6002851aa885a92500620960a))
- **text-input:** keep `selectTextOnFocus` selection after a click in Safari ([e22eca4](https://github.com/carbon-design-system/carbon-components-svelte/commit/e22eca411f1dcdeaa5c1d5a5206feaa28775c35f))
- **text-input:** keep inline inputs at their content width in flex rows ([c5f53f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/c5f53f0c1712481ac5e13803c6b4812044f42c49))
- **text-input:** link inline helper text to the input ([7f28c2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f28c2e4b1c9ac003cab8854cb7426a7ff34ff51))
- **text-input:** match v11 read-only styles ([244cfaf](https://github.com/carbon-design-system/carbon-components-svelte/commit/244cfafeb5bdd02ce1d4dfac4a0d0cbd4d7ff4a5))
- **text-input:** read typed text in its own direction ([8a3c6ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a3c6abf0a0c61750964ad761d6222a2d9047d26))
- **text-input:** render a read-only number field as a text input ([6a3dd10](https://github.com/carbon-design-system/carbon-components-svelte/commit/6a3dd10b7a97f0d984836909a8931e01a13b5707))
- **text:** keep `lines` truncation when other props change ([9ddfc2d](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ddfc2d66d2de270cc65a038130d8c0536c52ea1))
- **theme:** apply a first-layer token override to its contextual token ([dd05a60](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd05a60f251ddefd345e6d8fd13e5b3e6fefa10d))
- **theme:** cancel the color fades a theme change starts ([4aa666e](https://github.com/carbon-design-system/carbon-components-svelte/commit/4aa666e56c20d6dd1e40786f0e9d4f12230e0fb6))
- **theme:** darken Gray 80 zebra rows and fields for text contrast ([9e2dbd7](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e2dbd7ab8260149664e391539d594b42db2c436))
- **theme:** declare color-scheme: light for the light themes ([6d9bb34](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d9bb3401506db156fdd2e9a50818a83658251a3))
- **theme:** default the themes when toggle, select or dropdown omit them ([98a811a](https://github.com/carbon-design-system/carbon-components-svelte/commit/98a811abce4d4fd4724e302b16a9248245118a4a))
- **theme:** fall back when the persisted theme is missing or invalid ([b246106](https://github.com/carbon-design-system/carbon-components-svelte/commit/b246106e448c114776447cb5b600c3fde6eeec0f))
- **theme:** give Gray 80 dark tags ([131efc0](https://github.com/carbon-design-system/carbon-components-svelte/commit/131efc0c103e6f41e84f8b080c4034647db50248))
- **theme:** make Gray 80's state overlays translucent ([95f05a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/95f05a0acbfb25549064acd131a4231014225894))
- **theme:** raise Gray 80 helper text and interactive border contrast ([96a780b](https://github.com/carbon-design-system/carbon-components-svelte/commit/96a780bc191bebcd8b8b34279e8b712f334fd6a2))
- **theme:** remove a token's CSS variable when it leaves tokens ([3ed269e](https://github.com/carbon-design-system/carbon-components-svelte/commit/3ed269ee73af59bad3b0face36a64ac71b78f787))
- **theme:** step Gray 80 layer states like Gray 90's ([c8d1f26](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8d1f2686a8a433fd6e6b1cc45d2fb02a68b45d7))
- **theme:** use Carbon v11 values for component tokens ([f5cb278](https://github.com/carbon-design-system/carbon-components-svelte/commit/f5cb2782a265bd7869dbb6e3c6e8d3c71dcace76))
- **tile-group:** clear `selected` when the checked tile unmounts ([a3ab151](https://github.com/carbon-design-system/carbon-components-svelte/commit/a3ab151937dac5ce7ecbc44c75deeb342df7fe10))
- **tile-group:** pass form to the radio tiles ([f477882](https://github.com/carbon-design-system/carbon-components-svelte/commit/f47788284f0ac747f9116ef7148f51853a079b75))
- **tile-group:** restore numeric values on form reset ([718c243](https://github.com/carbon-design-system/carbon-components-svelte/commit/718c243d454baf67f6a2db74677f726decf2efd2))
- **tile-group:** select no tile when a reset checks a radio that's no tile's ([571aa3b](https://github.com/carbon-design-system/carbon-components-svelte/commit/571aa3b6a3ad88196e553e0719d3e6119f7367e7))
- **tile-group:** style tiles as disabled when the group is disabled ([82da6ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/82da6efd97af9fd95806fa8ad2916cc5ffdda1c7))
- **tile:** draw one border on a disabled selected tile ([8b9f6e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/8b9f6e90258b1eb3a57823d54898f223e6f336cc))
- **tile:** follow a disabled fieldset ([0dadef8](https://github.com/carbon-design-system/carbon-components-svelte/commit/0dadef8903fd173b0b27cbc172b52ce50e879abc))
- **tile:** forward aria naming to the expandable tile chevron ([409214d](https://github.com/carbon-design-system/carbon-components-svelte/commit/409214d62aa418f81775cf15da4d71ab997d2749))
- **tile:** forward aria naming to the SelectableTile input ([5dd2383](https://github.com/carbon-design-system/carbon-components-svelte/commit/5dd238306b914a8552750d3b8f62162d30258d3f))
- **tile:** keep content clear of a decorator and the checkbox ([16849f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/16849f64bc9ce8ed4bac75418c56814859012c04))
- **tile:** keep the focus ring clear of a neighbor's selected border ([4d45194](https://github.com/carbon-design-system/carbon-components-svelte/commit/4d451941224608119758aca2da1f22e8b81ae2e2))
- **tile:** set tile text at body line height ([eb5581e](https://github.com/carbon-design-system/carbon-components-svelte/commit/eb5581e9b576e6c71cf3c7a5df452e7be29d2997))
- **tile:** snap the focus ring instead of fading it in ([de2ba6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/de2ba6a72bd1c1611d094aa762fb38ee14df583c))
- **time-picker-select:** honor form on the select ([2c9ccc1](https://github.com/carbon-design-system/carbon-components-svelte/commit/2c9ccc1ebd018eb259fca3ce8668e45ea7520356))
- **time-picker:** follow a disabled fieldset ([91ca032](https://github.com/carbon-design-system/carbon-components-svelte/commit/91ca03223e29ce34af66b745b01dac1cab1034c7))
- **time-picker:** forward aria naming to the TimePickerSelect select ([eee2019](https://github.com/carbon-design-system/carbon-components-svelte/commit/eee20190e22fb58d1039db974ede3fc6a33bc24c))
- **time-picker:** give TimePickerSkeleton's parts the picker's widths ([88a150b](https://github.com/carbon-design-system/carbon-components-svelte/commit/88a150b4525f522b497f53506a64479c89b594e8))
- **time-picker:** hide the selects' labels with hideLabel in fluid ([6714c15](https://github.com/carbon-design-system/carbon-components-svelte/commit/6714c15237561c1d6c80f3b1ce5cbac92c7b852a))
- **time-picker:** keep `selectTextOnFocus` selection after a click in Safari ([ad95093](https://github.com/carbon-design-system/carbon-components-svelte/commit/ad950931e5ce4e67ae791e330bc51ca515783cf9))
- **time-picker:** lay out a fluid picker the same before hydration ([daa2204](https://github.com/carbon-design-system/carbon-components-svelte/commit/daa2204444288bfc7a11125567476320bdf6570f))
- **time-picker:** put the fluid select dividers at the inline start ([6b7d565](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b7d5659cb62f5697e5ecaedef680f2f98900c12))
- **time-picker:** show focus in fluid invalid and warning states ([bad39b2](https://github.com/carbon-design-system/carbon-components-svelte/commit/bad39b24d6ae66b5cdc1e49075cfab6329e90a78))
- **time-picker:** wrap the selects in a narrow container ([39938ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/39938add0cc86fc3d2fc7a0cce8ec58f56f4edca))
- **to-hierarchy:** nest under id 0 and leave the input untouched ([6faf382](https://github.com/carbon-design-system/carbon-components-svelte/commit/6faf382ebd3daab63434fb075d9c502e0b62ca16))
- **toast-notification:** keep a timeout from pulling focus back ([fc7216b](https://github.com/carbon-design-system/carbon-components-svelte/commit/fc7216b6b30bf0daf7de955d2184005f69f2758e))
- **toast-notification:** omit the title heading when there is no title ([e46d721](https://github.com/carbon-design-system/carbon-components-svelte/commit/e46d721155e35dbf8c7d6d92f81b2aeb4da6a3be))
- **toggle-button-group:** grow segments for wrapped labels ([15b7b86](https://github.com/carbon-design-system/carbon-components-svelte/commit/15b7b86f35a2b41ad8e3b022d6256d8e78d9e999))
- **toggle-button-group:** keep a tab stop when its button is disabled ([5fef109](https://github.com/carbon-design-system/carbon-components-svelte/commit/5fef1099a03b882f4b8dd441c7452816466f42fc))
- **toggle-button-group:** leave modified arrow keys to the browser ([f4a1239](https://github.com/carbon-design-system/carbon-components-svelte/commit/f4a12392fd03c1f0692cf8050ebc72dfbc916eca))
- **toggle-button-group:** render the roving tab stop on the server ([16e19c0](https://github.com/carbon-design-system/carbon-components-svelte/commit/16e19c04d8641bba381d4401a74d49d438e218b5))
- **toggle-button-group:** show the pressed state in forced colors ([b55cd46](https://github.com/carbon-design-system/carbon-components-svelte/commit/b55cd46c2041a1c3bf54844751a7d73afbd2fb7f))
- **toggle-button-group:** stop arrow keys from scrolling the page ([1831528](https://github.com/carbon-design-system/carbon-components-svelte/commit/183152863fa27097a91308539ed6fad5a83f807b))
- **toggle:** announce the invalid message as an alert ([777af56](https://github.com/carbon-design-system/carbon-components-svelte/commit/777af569e81c55cd9da26daeb087f3b5f118aecb))
- **toggle:** follow a disabled fieldset ([0e073d3](https://github.com/carbon-design-system/carbon-components-svelte/commit/0e073d30899e06b2c331ec1168ff68402efecd98))
- **toggle:** forward aria naming to the switch ([243ec87](https://github.com/carbon-design-system/carbon-components-svelte/commit/243ec87a111cf3e8530307b24802bb25fd754402))
- **toggle:** forward aria-label to the switch ([aba69a2](https://github.com/carbon-design-system/carbon-components-svelte/commit/aba69a2fd94993cf74374fd75c93f5b39f45a8f5))
- **toggle:** hold the knob still under reduced motion ([d5fb54c](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5fb54cc256a6733be5754a4bfb4c0847e98c428))
- **toggle:** honor form on the checkbox input ([b22243c](https://github.com/carbon-design-system/carbon-components-svelte/commit/b22243cc0f179afe9070cc26a04eb7c5698bc065))
- **toggle:** include the state text in the toggle's box ([3bfa0bf](https://github.com/carbon-design-system/carbon-components-svelte/commit/3bfa0bf8d0cd1987f5d5dde46b5a18d5635e5170))
- **toggle:** lay out the switch and its state text in RTL ([2c69850](https://github.com/carbon-design-system/carbon-components-svelte/commit/2c6985087dac825b7ceb20f0788942c461ec57a9))
- **toggle:** name a switch labeled only by its slot ([eb8d4d6](https://github.com/carbon-design-system/carbon-components-svelte/commit/eb8d4d67664948030def6a294b2b7a44d97e8b59))
- **toggle:** show the focus ring in forced colors ([83ca23b](https://github.com/carbon-design-system/carbon-components-svelte/commit/83ca23bda4f6fabb8fd8a2b5c375dbe4219f199e))
- **toggle:** snap the focus ring ([c82e786](https://github.com/carbon-design-system/carbon-components-svelte/commit/c82e786016256d0ae0d7695ffc92866728eef062))
- **toggle:** toggle once while Enter is held down ([b0a0667](https://github.com/carbon-design-system/carbon-components-svelte/commit/b0a06670daa01eb3206d61221467f12537650aba))
- **toggletip:** close on Escape after a mouse click opens it ([c17d9b5](https://github.com/carbon-design-system/carbon-components-svelte/commit/c17d9b510afd3c19a00913b168c402f410b4726d))
- **toggletip:** close when focus leaves portalled content ([f9ba0b5](https://github.com/carbon-design-system/carbon-components-svelte/commit/f9ba0b58335d7b0b24669fdac909f1ef829bd77a))
- **toggletip:** color links through v11's link hooks ([9507f92](https://github.com/carbon-design-system/carbon-components-svelte/commit/9507f924867ae490d6605ee4e9919f46f3f3a98e))
- **toggletip:** forward aria naming to the trigger button ([1125d29](https://github.com/carbon-design-system/carbon-components-svelte/commit/1125d293e9c68deb184b7eb099a4b45f45315937))
- **toggletip:** keep a bare paragraph in the content's type style ([4752929](https://github.com/carbon-design-system/carbon-components-svelte/commit/4752929becb70e05212de302bf04973f2b93e3be))
- **toggletip:** keep link colors while pressed, as in v11 ([99ecba3](https://github.com/carbon-design-system/carbon-components-svelte/commit/99ecba3ffb753c212c055772d788f9d3a71056cb))
- **toggletip:** leave aria-controls off while the content is closed ([fc2d2fa](https://github.com/carbon-design-system/carbon-components-svelte/commit/fc2d2fadd473a746d2625facbf56ab25dfc62912))
- **toggletip:** point the caret at the button and flip an overflowing popover ([ab3cfc5](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab3cfc5506fbb36d3b26be0e7122a4f48b1351a8))
- **toolbar-batch-actions:** announce the first and last selection count ([1a1703c](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a1703c4339faac476b693df6f47ee9a9a0af893))
- **toolbar-batch-actions:** don't override focus an action handler moved ([2d0577f](https://github.com/carbon-design-system/carbon-components-svelte/commit/2d0577fba28625cdc8a3e1c775207db0ae74cbe8))
- **toolbar-search:** do not throw outside a `DataTable` ([cfce9d1](https://github.com/carbon-design-system/carbon-components-svelte/commit/cfce9d1c29e9cdddd4c9b876989406384c20ddf2))
- **toolbar-search:** filter a starting value without debounce wait ([11b0694](https://github.com/carbon-design-system/carbon-components-svelte/commit/11b069401f8dff69dfa165361912a47ccb27a17e))
- **tooltip-definition:** anchor the inline tooltip to its term ([d3a48db](https://github.com/carbon-design-system/carbon-components-svelte/commit/d3a48db5ee316e669007dc33971e9d2016e0eda0))
- **tooltip-definition:** apply tabindex to the trigger button ([7b6db67](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b6db67b26ca1945bab58ba27f2eddd44c465993))
- **tooltip-definition:** describe the trigger only by a rendered tooltip ([db36c00](https://github.com/carbon-design-system/carbon-components-svelte/commit/db36c00543a3063c1425527b6e2565d1057cbcbf))
- **tooltip-definition:** forward aria naming to the button ([630d140](https://github.com/carbon-design-system/carbon-components-svelte/commit/630d140856539703dded6c68c035fe42f75e517d))
- **tooltip-definition:** forward blur from the trigger ([495be40](https://github.com/carbon-design-system/carbon-components-svelte/commit/495be40c3c6bbdd849c6371486e4a7e41d0a2395))
- **tooltip-definition:** hide on Escape before a parent Modal closes ([6a8d26a](https://github.com/carbon-design-system/carbon-components-svelte/commit/6a8d26a1899ffba5ed0d935f3e5be419391fc65e))
- **tooltip-definition:** inherit the surrounding font and set aria-expanded ([8d65ca3](https://github.com/carbon-design-system/carbon-components-svelte/commit/8d65ca3323a44751130d4cd9ca69c42fc6979d5b))
- **tooltip-definition:** keep the caret visible while the tooltip shows ([630a6f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/630a6f092564acb7a45987f08071face14080f59))
- **tooltip-definition:** keep the inline tooltip open under the pointer ([05dfb64](https://github.com/carbon-design-system/carbon-components-svelte/commit/05dfb64d205a06b43b5ef8201b51283fb26dedae))
- **tooltip-definition:** restore the trigger text color ([8144ec8](https://github.com/carbon-design-system/carbon-components-svelte/commit/8144ec8246f970b8cb4459e5e0c768ad238807a8))
- **tooltip-icon:** dispatch open and close from the portalled tooltip ([ea5512f](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea5512f0c8afb44468c4eac2e4535ea58a664036))
- **tooltip-icon:** name and dismiss the portalled tooltip ([f6a78a3](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6a78a382379e7369cc05a6ac6a181413edd50b0))
- **tooltip-icon:** stop server renders leaking open state ([18510be](https://github.com/carbon-design-system/carbon-components-svelte/commit/18510be12836f5a121ecc205d29b4d6e34a26d1f))
- **tooltip:** center TooltipDefinition and TooltipIcon tooltips in stretching layouts ([9ddfad5](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ddfad531037a03d4e76da304b378b04252b179c))
- **tooltip:** close a clicked icon tooltip when the pointer leaves ([4b03dd4](https://github.com/carbon-design-system/carbon-components-svelte/commit/4b03dd4f08496a0b90649c71120cd22b3749831b))
- **tooltip:** close a hover-opened tooltip on Escape from anywhere ([0f3e96a](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f3e96a6c6bdd121944cf7a8e59fffbd664a9819))
- **tooltip:** forward aria naming to the trigger ([f602e84](https://github.com/carbon-design-system/carbon-components-svelte/commit/f602e8429889521ea8f78af5918973584a6af1cf))
- **tooltip:** keep hidden icon tooltips out of the scroll area ([c3b8080](https://github.com/carbon-design-system/carbon-components-svelte/commit/c3b8080c0b3e61a1c802d350640cc5c4528d6880))
- **tooltip:** keep portalled icon tooltips inside the window ([5b87652](https://github.com/carbon-design-system/carbon-components-svelte/commit/5b876525e599a33fd92d1ab744d52188b649e17a))
- **tooltip:** keep the tooltip inside the window ([ebbfe4f](https://github.com/carbon-design-system/carbon-components-svelte/commit/ebbfe4f8b77482c599e82ac9404522969c1bc482))
- **tooltip:** leave a tooltip that's open off-screen on its side ([dabad54](https://github.com/carbon-design-system/carbon-components-svelte/commit/dabad54aca23674f6b7f5676fac8b6677c59da4d))
- **tooltip:** let Escape reach a parent Modal when the tooltip is closed ([af6a10b](https://github.com/carbon-design-system/carbon-components-svelte/commit/af6a10bbd56ee0539fa72a4252d06d330ddbdeaa))
- **tooltip:** name the portalled tooltip dialog by its trigger ([7cabd3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/7cabd3c0c70d7a67b35bf0b1a6f4e1c3bdebfebd))
- **tooltip:** point a start or end side tooltip's caret at its trigger ([105cc0e](https://github.com/carbon-design-system/carbon-components-svelte/commit/105cc0e1c0fee6c0c838cd588fdb1f484401429a))
- **tooltip:** portal a tooltip that a box around it would cut off ([4fdff94](https://github.com/carbon-design-system/carbon-components-svelte/commit/4fdff944d67c149a3b30e09c3e4fe2735da85329))
- **tooltip:** return focus to the trigger on Escape with `hideIcon` ([a2d1a0b](https://github.com/carbon-design-system/carbon-components-svelte/commit/a2d1a0b75e592293bd9ec3d8f284dffc40f31f72))
- **tooltip:** set `aria-describedby` only while the tooltip is open ([143848e](https://github.com/carbon-design-system/carbon-components-svelte/commit/143848ecc020bbb8dc39ced2ca5f9ce3da4c080d))
- **tooltip:** slide a portalled side tooltip inside the window ([f68e7e4](https://github.com/carbon-design-system/carbon-components-svelte/commit/f68e7e4ef23f8df54bb1f74d6578394049d7471b))
- **trap-focus:** continue from a focus that is not a tab stop ([41f19ac](https://github.com/carbon-design-system/carbon-components-svelte/commit/41f19ac51363c670929c32fb2cef894e56b52c72))
- **tree-view:** center the expand caret in its row ([5257bf6](https://github.com/carbon-design-system/carbon-components-svelte/commit/5257bf6bf832447bff0163c119d1020b03036c33))
- **tree-view:** end a name too long for its row in an ellipsis ([250357a](https://github.com/carbon-design-system/carbon-components-svelte/commit/250357a2cd0d46c6c93d0aed813ba4b0332a8d23))
- **tree-view:** keep saved checks on nodes not loaded yet ([cc8811c](https://github.com/carbon-design-system/carbon-components-svelte/commit/cc8811c5dd64db9ce38f2074bb6a58f3026ac64e))
- **tree-view:** mirror rows and selection bars in RTL ([74e938f](https://github.com/carbon-design-system/carbon-components-svelte/commit/74e938f79d9ac9a882e1609683b998e79cd6f430))
- **tree-view:** read the focused node from the event in its key handlers ([6bdd829](https://github.com/carbon-design-system/carbon-components-svelte/commit/6bdd82961ecbdb2437721712eaaf91dee0bb046f))
- **tree-view:** scope row ids to the tree ([a1f90e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/a1f90e2f07f7b253215f35c6e23c152f3ebe3605))
- **tree-view:** show selected and disabled nodes in forced colors ([a7f578b](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7f578b0ad24c57ff85172e2d5b5b28367e3bc0e))
- **tree-view:** swap Left and Right and point the caret left in RTL ([c7c6172](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7c617243650f4fcb1006aea3437fa0f4da1ab26))
- **tree-view:** treat Cmd as Ctrl for select-all and range-extend ([94e43ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/94e43edb6b281b34d916b86b5235800889f9f436))
- **truncate:** keep a leading slash in place on a front clamp ([7f12573](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f1257318195e29513f6f633671abcb81735f26c))
- **type:** give success text AA contrast with --ccs-text-success ([8a56616](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a566164d102505821325917991fd30eea829ffa))
- **typeahead:** keep the current item while typing more of its name ([b79576b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b79576b45c1c1c1f8fa1e66ae72862aa0f94bd2a))
- **types:** accept `undefined` on props that default to it ([a7610a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7610a046e1dcb4976d0e2a80f92135a4184e05c))
- **types:** add `hasChildren` to TreeViewNodeList's node type ([3dc75db](https://github.com/carbon-design-system/carbon-components-svelte/commit/3dc75dbe330e8c1162cca53363a5f52295d8b545))
- **types:** clear sveld's remaining diagnostics and build docs with `strict` ([da82b8f](https://github.com/carbon-design-system/carbon-components-svelte/commit/da82b8f35061c97eb43014c8358df942290d4660))
- **types:** constrain icon generics to components ([991e5fb](https://github.com/carbon-design-system/carbon-components-svelte/commit/991e5fb2f693328b9bfc4a024696fd5f83572bd1))
- **types:** declare each bound ref's element type in JSDoc ([1dacedf](https://github.com/carbon-design-system/carbon-components-svelte/commit/1dacedfb0548c84d402dd75f601909f0db5299cd))
- **types:** declare the exports two hand-written .d.ts files missed ([d79b8af](https://github.com/carbon-design-system/carbon-components-svelte/commit/d79b8af3dbd3735bbe16cff07b257acfc31ef5ad))
- **types:** guard the values a few more components read ([647fe88](https://github.com/carbon-design-system/carbon-components-svelte/commit/647fe8843ded1c1e9b2beaf0efd48910a2d19c89))
- **types:** make CheckboxGroup and ToggleButtonGroup generic over values ([fa6ec76](https://github.com/carbon-design-system/carbon-components-svelte/commit/fa6ec76043c6517b1e4110e1758658a9b4811853))
- **types:** narrow the values a few components' markup reads ([c9c8256](https://github.com/carbon-design-system/carbon-components-svelte/commit/c9c8256e11bd030e89ec360c3e4a2807d76a0f40))
- **types:** pass tabindex props to elements through a typed helper ([d1439f2](https://github.com/carbon-design-system/carbon-components-svelte/commit/d1439f259d26c56979ae3932a962cd7ad49c130b))
- **types:** type a secondary button's `kind` as Button's kinds ([1f6ba50](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f6ba50eb12ef93038262bbc928092b93c35f8a5))
- **types:** type a TagSet item's `type` as Tag's types ([fd4e74e](https://github.com/carbon-design-system/carbon-components-svelte/commit/fd4e74e6d159c85ab121cbd3135b5fb796b65dc2))
- **types:** type context stores and methods ([a854559](https://github.com/carbon-design-system/carbon-components-svelte/commit/a854559164393c44dc9faf4c41d4374bb12e8662))
- **types:** type DataTable's decorator and header slots by the row ([dba972a](https://github.com/carbon-design-system/carbon-components-svelte/commit/dba972a8e3e819ff5576d8fe7f8957063aa7e1f6))
- **types:** type exported methods that return nothing as `void` ([1136b90](https://github.com/carbon-design-system/carbon-components-svelte/commit/1136b901a5a7ea9664a809dbcf0f963123bf5286))
- **types:** type group contexts as the undefined they can hold ([47ba526](https://github.com/carbon-design-system/carbon-components-svelte/commit/47ba52637ffc225b209c668b76b68227401f52cc))
- **types:** type layout rest props from the `tag` they render ([d96909a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d96909a518e221835736aabe4069e375ab4115e3))
- **types:** type props sveld can't infer ([39cd357](https://github.com/carbon-design-system/carbon-components-svelte/commit/39cd357f2ee4ba42cd8d226a4c02ef914ea5297e))
- **types:** type props that default to undefined as possibly undefined ([16ad499](https://github.com/carbon-design-system/carbon-components-svelte/commit/16ad49919d829ef73c72033ca2acc711e21169a1))
- **types:** type TableHeader's `scope` as the attribute's values ([25ae04a](https://github.com/carbon-design-system/carbon-components-svelte/commit/25ae04a22d155208bf2a9c5bc010370006fe2d0a))
- **types:** type the empty values Select and LinkDownload pass on ([e506bb4](https://github.com/carbon-design-system/carbon-components-svelte/commit/e506bb4d6c9fec06d25d04dbf4f2ab26df0f71c3))
- **types:** type the four remaining `any` contexts ([518ba1d](https://github.com/carbon-design-system/carbon-components-svelte/commit/518ba1d777c0449455c9ec5bee5410b88af7aacf))
- **types:** type the interstitial view store fallback ([e890d41](https://github.com/carbon-design-system/carbon-components-svelte/commit/e890d41736fe0d57d401524c6454e7e9a71fbbf1))
- **types:** type the size `UserAvatarGroupOverflow` shares through context ([551b9ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/551b9eade8d604648be0cd40a4de781dac2cf522))
- **ui-shell:** align the `HeaderPanelLink` icon with the label's first line ([0caa496](https://github.com/carbon-design-system/carbon-components-svelte/commit/0caa496cfc08faf64856711cf404c6b28d65ced9))
- **ui-shell:** apply SideNavMenu large to its own row only ([fa7228f](https://github.com/carbon-design-system/carbon-components-svelte/commit/fa7228f510f8526a161b7a564e4627945185d1cd)), closes [#4126](https://github.com/carbon-design-system/carbon-components-svelte/issues/4126)
- **ui-shell:** clear the HeaderNavMenu current marker when its item unmounts ([c6b44cc](https://github.com/carbon-design-system/carbon-components-svelte/commit/c6b44cc2686f9956eb2b647db7f064c66a4b2909))
- **ui-shell:** close an open header panel when another one opens ([b382401](https://github.com/carbon-design-system/carbon-components-svelte/commit/b382401168011300c24041b0283dc86cac519113))
- **ui-shell:** close header panels at once when transition is off ([6c334cd](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c334cd38986e428260bd9e44de6d79495c4603f))
- **ui-shell:** close HeaderNavMenu when Enter activates an item ([03c9449](https://github.com/carbon-design-system/carbon-components-svelte/commit/03c9449152791cb7a2b9fce4a55c4db02369d169))
- **ui-shell:** close HeaderSearch when Tab moves focus out of it ([717ffa1](https://github.com/carbon-design-system/carbon-components-svelte/commit/717ffa1f6730b609376e91253ad1d56a713cf0c4))
- **ui-shell:** close the side nav with Escape at every width ([c8048cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8048cfddbacbed59ffb61d90495faeac068cfb3))
- **ui-shell:** collapse side nav menus with Escape ([211be59](https://github.com/carbon-design-system/carbon-components-svelte/commit/211be599e50570e11674d0c50eeb0c2b5812b921))
- **ui-shell:** default rel on SideNavMenuItem and Header new-tab links ([aef9b9a](https://github.com/carbon-design-system/carbon-components-svelte/commit/aef9b9a7d4b959245b3f17895bb21e50cdeef0ba))
- **ui-shell:** drop the second focus ring on HeaderAction icons ([8c31955](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c3195562885753a7110803d9cc1587009affdc1))
- **ui-shell:** drop the trailing margin on a `Tag` in a `HeaderNavMenu` trigger ([8217c3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/8217c3c2c214ab41f36b196bd4bd6f537682a428))
- **ui-shell:** focus ProfileMenu and HeaderSwitcher items when opened by keyboard ([06ed0fd](https://github.com/carbon-design-system/carbon-components-svelte/commit/06ed0fd68f2525b604fde3ba46b57e897ed04e90))
- **ui-shell:** forward aria labels on header panel links ([b79aa38](https://github.com/carbon-design-system/carbon-components-svelte/commit/b79aa385902ecfbeaf17bb81e92a81b6155f0e64))
- **ui-shell:** forward rest props from HeaderUtilities ([8d0d75b](https://github.com/carbon-design-system/carbon-components-svelte/commit/8d0d75bf9dba1f6f1c960a22cc27c43fa70e0f18))
- **ui-shell:** give HeaderSideNavItems a menubar role ([69105d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/69105d58772b6b49acd2d7b0c2250b91369bcbbe))
- **ui-shell:** guard the refs and widths the shell's markup reads ([31ef06c](https://github.com/carbon-design-system/carbon-components-svelte/commit/31ef06c7a1a6c82e52a9305a70fc91aaac649257))
- **ui-shell:** keep `Content` margin for rail `SideNav` on mobile (#4250) ([5491c47](https://github.com/carbon-design-system/carbon-components-svelte/commit/5491c477cdf4fef771420de3339b2cdf45bcefb1))
- **ui-shell:** keep `HeaderNavMenu` inside the viewport near the right edge ([0f35fd5](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f35fd58091e3a4f45a02c22aea7c8c984b5186f))
- **ui-shell:** keep `HeaderPanelLinks` navigation on the rendered link ([41f3c9b](https://github.com/carbon-design-system/carbon-components-svelte/commit/41f3c9b50c8a168d8621e0027814dc33ac49eb6d))
- **ui-shell:** keep a closed rail SideNav in the accessibility tree ([9ed390c](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ed390c2d2450b25088731ca50c75880228bc409))
- **ui-shell:** keep a visible rail SideNav in the accessibility tree ([72ddb0c](https://github.com/carbon-design-system/carbon-components-svelte/commit/72ddb0c718145cb1ff54021ca4612cd071599517))
- **ui-shell:** keep header icons and tooltips legible on a light page ([bab5dd2](https://github.com/carbon-design-system/carbon-components-svelte/commit/bab5dd26405b7f986a23539ad031a7537f704cea))
- **ui-shell:** keep header panels open on an IME Escape ([357f205](https://github.com/carbon-design-system/carbon-components-svelte/commit/357f20538214277df3dedfa95cb464853ebf4278))
- **ui-shell:** keep ProfileMenu and SideNav clear of a classic scrollbar ([56926cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/56926cfe0493e49d56fc7cf8ff2df163a613aae8))
- **ui-shell:** keep text HeaderAction width stable on focus ([9098479](https://github.com/carbon-design-system/carbon-components-svelte/commit/909847958869115645d96e4369be810dedec7b24))
- **ui-shell:** keep the HeaderSearch selection within shorter results ([8543fd7](https://github.com/carbon-design-system/carbon-components-svelte/commit/8543fd7e012479bf4031bf4ab9854e5e87d8a244))
- **ui-shell:** keep the skip link first when SideNav scrolls ([284a528](https://github.com/carbon-design-system/carbon-components-svelte/commit/284a5286bb0dcc45bb74ef07de276fc9b1d41e13))
- **ui-shell:** lay out server-rendered content where hydration puts it ([19e5b41](https://github.com/carbon-design-system/carbon-components-svelte/commit/19e5b4119f85770a9749fb1663e50c255f3b86ab))
- **ui-shell:** let `HeaderNavItem` labels wrap inside `HeaderNavMenu` ([9c4be4b](https://github.com/carbon-design-system/carbon-components-svelte/commit/9c4be4bf24c8722a0070f4338db817168fe1648c))
- **ui-shell:** let an explicit Header label win over the company name ([67bfccb](https://github.com/carbon-design-system/carbon-components-svelte/commit/67bfccb5603d335de12394565a4eb70ae9de01b4))
- **ui-shell:** match header global action focus ring to action link ([65491a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/65491a045e298ca46a2af1f1562905335eac0290))
- **ui-shell:** name the `HeaderNavMenu` menu from its trigger ([b0e91ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/b0e91eadddf3c225e69b0c65dba65a44a1d42d10))
- **ui-shell:** open the adjacent `HeaderNavMenu` when arrowing along the menubar from an open one ([af7903b](https://github.com/carbon-design-system/carbon-components-svelte/commit/af7903bbe8c9606fa978bca39b6a2ce63d144766))
- **ui-shell:** place a `SideNavMenu` badge at the end of the row ([84fcd46](https://github.com/carbon-design-system/carbon-components-svelte/commit/84fcd468e3d61ba977ce0116d6ea87f39ab3560f))
- **ui-shell:** refocus the hamburger when the SideNav overlay is clicked ([9d0ff20](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d0ff20158185ff2b11b04e3cf1f03f08a884788))
- **ui-shell:** render `HeaderPanelLink` as a button when `href` is omitted ([ba3a7eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba3a7eba9c98b5bbb7bbb76925573daaa08f8981))
- **ui-shell:** render `SideNavDivider` as a list item wrapping an `hr` ([9b981d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b981d2167807fb5a513d1008fe64c7ae95de3a8))
- **ui-shell:** reset shared nav state when Header or SideNav unmounts ([1bcb692](https://github.com/carbon-design-system/carbon-components-svelte/commit/1bcb692fbc5cdad01020b8b9a26379a4fe7df992))
- **ui-shell:** restore `HeaderPanelLink` rest prop types ([669ad4b](https://github.com/carbon-design-system/carbon-components-svelte/commit/669ad4b171c41da31827b6d3c6aa3a5956e8e946))
- **ui-shell:** return focus to the trigger when a header panel closes on it ([fa4fd21](https://github.com/carbon-design-system/carbon-components-svelte/commit/fa4fd212c51e644ffa430b8e6decfb10d8a86fc1))
- **ui-shell:** show header nav focus and selection in forced colors ([94de480](https://github.com/carbon-design-system/carbon-components-svelte/commit/94de480c418574a156946a8aec5a0c289d5215ce))
- **ui-shell:** show one HeaderAction tooltip at a time ([9e885c5](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e885c5fbc5d0b22d1109374a77e2bf893c8f5ed))
- **ui-shell:** snap the side nav focus ring ([4e388b8](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e388b824de5e867e1f1769686527c9e0daa00d5))
- **ui-shell:** stop header panel triggers announcing a menu ([8e8fb2f](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e8fb2ffa7e697ac25a484dcbacdf09030bd914f))
- **ui-shell:** stop HeaderNavMenu pulling focus back on blur ([09105ec](https://github.com/carbon-design-system/carbon-components-svelte/commit/09105eca4fb2769367c767fbadaf06e56fcffd0f))
- **ui-shell:** stop lowercasing `HeaderSearch` result descriptions ([ae13be2](https://github.com/carbon-design-system/carbon-components-svelte/commit/ae13be2f53549f81c0b2d5b31562486fd1f5114c))
- **ui-shell:** style a current `HeaderNavItem` in the side nav like `SideNavLink` ([80f41b8](https://github.com/carbon-design-system/carbon-components-svelte/commit/80f41b8e1987efdbca0766a5e27c3f073253e3b9))
- **ui-shell:** submit the HeaderSearch query on Enter when no result is selected ([15d2751](https://github.com/carbon-design-system/carbon-components-svelte/commit/15d2751e056e9b9ddbe0f4e5abc2e18610780f2c))
- **ui-shell:** truncate a header menu title in the collapsed rail ([c3be74c](https://github.com/carbon-design-system/carbon-components-svelte/commit/c3be74c5c3ad608cbc89a2353d95e24adee6f9f0))
- **ui-shell:** wrap HeaderSideNavItems in a list item ([b15f68c](https://github.com/carbon-design-system/carbon-components-svelte/commit/b15f68c4d7045904b1f466900903e1d6dcebe19f))
- **ui-shell:** wrap long `HeaderNavMenu` item labels ([b1d3b44](https://github.com/carbon-design-system/carbon-components-svelte/commit/b1d3b440f46236e1f56ad3544e21207e58e8e405))
- **ui-shell:** wrap long `HeaderPanelLink` labels instead of overflowing ([64890d4](https://github.com/carbon-design-system/carbon-components-svelte/commit/64890d402c5d0c5ce27e3908bb8aae30e5730399))
- **user-avatar-group:** hide the overflow and show "+N" before hydration ([9cd105d](https://github.com/carbon-design-system/carbon-components-svelte/commit/9cd105d0162836d15a66f65e703bdad4cfc3ac34))
- **user-avatar-group:** track avatars whose root element is replaced ([21b724d](https://github.com/carbon-design-system/carbon-components-svelte/commit/21b724d4ecc4df71ab9c1757361c51840ea75297))
- **user-avatar:** forward aria naming to the tooltip button ([db65748](https://github.com/carbon-design-system/carbon-components-svelte/commit/db6574818becabb50e720b562e7b3f8dc5e229ee))
- **user-avatar:** give image avatars alt text ([a843f05](https://github.com/carbon-design-system/carbon-components-svelte/commit/a843f05af82648dae0f1b1faf89cec435571cb0b))
- **user-avatar:** match Carbon v11 sizes and dark-theme colors ([3b9ea44](https://github.com/carbon-design-system/carbon-components-svelte/commit/3b9ea444b6323dd6bb8513e73e390dbca6b389ac))
- **user-avatar:** retry an image URL that failed earlier ([13bacfb](https://github.com/carbon-design-system/carbon-components-svelte/commit/13bacfb5f9ff6a6aba8c1201028be846fe1fa006))
- **utils:** register dismiss() keyboard listeners without deferring ([1f12659](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f126592d69e686a419c35489a9a24b479ff5c58))
- **utils:** restore focus after the execCommand copy fallback ([997c476](https://github.com/carbon-design-system/carbon-components-svelte/commit/997c4763989d558f6dd17953b25ba51152943921))
- **utils:** skip links with tabindex -1 when trapping focus ([72c5043](https://github.com/carbon-design-system/carbon-components-svelte/commit/72c5043d00fbc90e58335401ed71efecc2739945))
- **utils:** treat Urdu as right to left in Safari ([85d5ae3](https://github.com/carbon-design-system/carbon-components-svelte/commit/85d5ae3d438a8442c7458227a1af9db3ae04f097))
- **utils:** type splitAriaNaming input as unknown values ([2a7415a](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a7415a1ebad260fc94e9c49ca7ebb754ec97f79))
- **virtual-list:** end a list taller than the browser scrolls ([1e73629](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e73629289cc9f65e2953ac1d71df7096efd8dc9))
- **virtual-list:** hold the reader's place while rows above are measured ([90f8a45](https://github.com/carbon-design-system/carbon-components-svelte/commit/90f8a45173cd0e9e627ec00ec17aa20b71a4df96))
- **virtual-list:** render rows in an already scrolled scroller ([3f432b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f432b60f747d1bfca152d8b21317dfbd67e2d9b))
- **virtual-list:** reset measured heights when items are replaced ([7bd152a](https://github.com/carbon-design-system/carbon-components-svelte/commit/7bd152ad1f2abe8d9afea4cf177c35904bac40b6))
- **virtual-list:** stop keeping the first items array alive ([6c2f86b](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c2f86b341da85162754acf38febe2bd5b288bde))
- align tooltips and popovers to the inline side in RTL ([6cfff1b](https://github.com/carbon-design-system/carbon-components-svelte/commit/6cfff1b3e3fe3603ce2b84458e84e74740c7e66a))
- derive notification and header menu ids from an `id` prop ([b458927](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4589272ecd801a2daa05b3712d0d4ec11bc5f16))
- dismiss the remaining icon tooltips with Escape ([df52e3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/df52e3a994e19dea2b0d65347397befaa7c3b626))
- join a consumer `aria-describedby` with built-in descriptions ([c182d68](https://github.com/carbon-design-system/carbon-components-svelte/commit/c182d6870b428a6ede813cc4f13c3d9e3b3d8361))
- keep fixed-size form controls at their own width in a flex row ([8abe655](https://github.com/carbon-design-system/carbon-components-svelte/commit/8abe6552de65b2c2160dc7712103a115364b076f))
- keep tooltips closed for focus a component moves ([270f767](https://github.com/carbon-design-system/carbon-components-svelte/commit/270f76725b7e097eeb28a6710254b303c53b4a0b))
- lay out ExpandableTile, TreeView, ContentSwitcher and OverflowMenu in the server's markup as once mounted ([34c507f](https://github.com/carbon-design-system/carbon-components-svelte/commit/34c507fb35378d00e946be12011645d5bcbd8c12))
- leave Ctrl/Cmd+Home and End to the browser in roving lists ([6c7778f](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c7778fd64f7c1be66868f20618a521a0bf7c6d5))
- leave modified arrow keys to the browser in menus ([7929c67](https://github.com/carbon-design-system/carbon-components-svelte/commit/7929c677b31aaf9daeadd0d7a4813df2bbe2be4d))
- let a consumer `aria-label` name `TreeView` and `Carousel` ([ea4a2d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea4a2d8fe46115e73e79b65a6c7bef460a136d54))
- let the pointer move onto icon tooltips ([f37f717](https://github.com/carbon-design-system/carbon-components-svelte/commit/f37f71788df4b63089f56984450e41a126acf984))
- portal icon and definition tooltips that a box would cut off ([95ef8ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/95ef8ede3f55d1ac935c85b50803a11a8f2e3287))
- resize SideNav and Splitter from the inline end in RTL ([e4be00a](https://github.com/carbon-design-system/carbon-components-svelte/commit/e4be00a529da81230f25b79706233616de8568f9))
- swap Left and Right in RTL roving lists and the header menubar ([af95f00](https://github.com/carbon-design-system/carbon-components-svelte/commit/af95f00494a649f264afea8eeb9e0cf7a488bdfa))
- write boolean ARIA states as "true" in Svelte 3 and 4 server markup ([cbf33e0](https://github.com/carbon-design-system/carbon-components-svelte/commit/cbf33e061bd73f34e779ef2e2c71a2e7882ffcfb))

### Performance

- **checkbox:** build the validation message box only when shown ([15af5ae](https://github.com/carbon-design-system/carbon-components-svelte/commit/15af5ae87be34a864849f0df1aceea5a72a8f4e9))
- **clickable-tile:** render a plain anchor instead of a Link ([3d02df9](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d02df91ecf6b0d7dce8d65537687dd3173d4ef7))
- **code-snippet:** measure multi-line snippets on the shared observer ([dc009aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/dc009aaf3d9ee724db7cf278dd6641971f99c743))
- **combo-box:** build the filtered-index map only when an option needs it ([6aac3ee](https://github.com/carbon-design-system/carbon-components-svelte/commit/6aac3ee1b51d9e5922c7d072e2b550b1ee1d053f))
- **combo-box:** reuse items instead of filtering for the default shouldFilterItem ([4ecddd5](https://github.com/carbon-design-system/carbon-components-svelte/commit/4ecddd5854f7597fab25ad7ace848bba83a34260))
- **combo-box:** skip rebuilding the option list per keystroke with the default shouldFilterItem ([0fde47c](https://github.com/carbon-design-system/carbon-components-svelte/commit/0fde47c3a4507c7a0f2ad1d19351dd2793e57984))
- **context-menu:** listen for the page's context menu in the root only ([1f48265](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f4826522582e828a399513fb4de2557955d98ca))
- **css:** drop the side-nav link text child combinator ([7c44f21](https://github.com/carbon-design-system/carbon-components-svelte/commit/7c44f21bfcebae66479389cff27f56b9b95611fc))
- **css:** write inline offsets as logical properties (-30 kB) ([aa6df37](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa6df3763d66645bfd5da2e51104f58267c76c50))
- **data-table:** render body rows as plain tr and td elements ([8a7d5db](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a7d5db86682ffaf142e1ea39d3ed40cb940ce73))
- **data-table:** render each body cell as one td ([f30f082](https://github.com/carbon-design-system/carbon-components-svelte/commit/f30f0828757fe9b0b75628ebd37049b8e51c9351))
- **data-table:** render row selection inputs as plain elements ([7845a02](https://github.com/carbon-design-system/carbon-components-svelte/commit/7845a026ea5cb0c0c8594179be68396d6e7c0d1c))
- **data-table:** sort without re-rendering every row ([d97e8bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/d97e8bd752527d37206cf3d6612b75c9508d533f))
- **date-picker:** build a popup calendar on first open ([0b0a6e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b0a6e5b88f1fb0536d8a888643bc8df4901f3e6))
- **date-picker:** build the calendar as the pointer reaches an input ([c3e3573](https://github.com/carbon-design-system/carbon-components-svelte/commit/c3e3573dda7406e30b001c729d7363d8e602392c))
- **date-picker:** don't re-apply a range the calendar just picked ([fc0ddd7](https://github.com/carbon-design-system/carbon-components-svelte/commit/fc0ddd78615076e7f74f21583919de92b9d8a41a))
- **date-picker:** jump to the range start only when it's out of view ([54a72f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/54a72f958647385a350b4bbbcb8e927c360be8c9))
- **date-picker:** redraw the calendar only for options that change it ([d619ba5](https://github.com/carbon-design-system/carbon-components-svelte/commit/d619ba533fb6921f7c42b0b8a7a2cf6b9336caac))
- **date-picker:** skip Intl when ordering month and year for English ([8c4cb1d](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c4cb1ded87bf23ffeb2c3f1bef7782dbd23e3a1))
- **date-picker:** update the days in place on a pick ([89f9a17](https://github.com/carbon-design-system/carbon-components-svelte/commit/89f9a174b98e37f05d3d9d0ae655c6f6acc955e8))
- **expandable-tile:** measure on the shared observer ([185f94f](https://github.com/carbon-design-system/carbon-components-svelte/commit/185f94fe3ca76bd47711a4e901b7497343278e78))
- **expandable-tile:** measure the fallback height once on mount ([8e791fe](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e791fec13be6c1fb8aceb63917a3345e1b96aef))
- **floating-portal:** reposition on floating content resize via the shared observer ([65a8aa0](https://github.com/carbon-design-system/carbon-components-svelte/commit/65a8aa075a62edbea486dd859f5b7c7fc5e6f6de))
- **keyboard-shortcut:** tree-shake formatShortcut's key labels ([491fbea](https://github.com/carbon-design-system/carbon-components-svelte/commit/491fbeaef613ff16d4748c704de8f882a7193f75))
- **lazy-mount:** mount idle content one idle period at a time ([12eb47d](https://github.com/carbon-design-system/carbon-components-svelte/commit/12eb47d23f5668421434e2744d2a03bf3104ef16))
- **multi-select:** render option checkboxes as plain elements ([9133250](https://github.com/carbon-design-system/carbon-components-svelte/commit/9133250b0ef8233e5d216d2543a57629ef480141))
- **progress-bar:** slide the indeterminate segment on the compositor ([4ec4290](https://github.com/carbon-design-system/carbon-components-svelte/commit/4ec42901bdafe90e2b164799e464f102c775f0d7))
- **recursive-list:** render each node as a plain li ([bc3f24d](https://github.com/carbon-design-system/carbon-components-svelte/commit/bc3f24d8051d775ab940c1d3679b66310526f475))
- **scroll-gradient:** measure scrollability on the shared observer ([3a76fb4](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a76fb4b17255a09a2085068323a6b287f7d07d2))
- **selectable-tile-group:** notify tiles once per toggle ([e49be02](https://github.com/carbon-design-system/carbon-components-svelte/commit/e49be0205f09a3ac2f57b8cf70d5b1ee134fc74d))
- **skeleton:** run the shimmer on the compositor ([8b48552](https://github.com/carbon-design-system/carbon-components-svelte/commit/8b48552ce88ba74ecc6d9221dba069b6181e642a))
- **table-of-contents:** observe the nav on the shared observer ([e204bd3](https://github.com/carbon-design-system/carbon-components-svelte/commit/e204bd3472a3dd12bb6158ef3b4aeb62241b25e5))
- **tabs:** measure overflow on the shared observer ([ea76114](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea761149ce07c24825a5a8f9c317b3d264855dff))
- **tag-set:** build the overflow popover's tags on first open ([a885295](https://github.com/carbon-design-system/carbon-components-svelte/commit/a885295059e93ba02a95883da20e6145841c9361))
- **tag-set:** measure overflow on the shared observer ([b98eb35](https://github.com/carbon-design-system/carbon-components-svelte/commit/b98eb3581ab3de721f9800502d5fe1f9caf0345b))
- **tag-set:** register tags without re-sorting the whole list ([e0d74bf](https://github.com/carbon-design-system/carbon-components-svelte/commit/e0d74bfbd736ecbf44e235bbbeda0a281160247d))
- **tag-set:** skip the empty measure on mount ([8a36e7b](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a36e7b4da02b1fa38d6cd33f15c96e961ade33b))
- **text-area:** observe width changes on the shared observer ([03a0872](https://github.com/carbon-design-system/carbon-components-svelte/commit/03a087230c4cbde6a354082b56d28c9c85c24feb))
- **text-area:** resize growing fields together in one frame ([f2b13e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2b13e5339410f0947fab38c968a1d0e07276610))
- **tree-view:** measure a relative container height on the shared observer ([be2924e](https://github.com/carbon-design-system/carbon-components-svelte/commit/be2924e88c2445fa3c191ed8f7ca24dc0648a43d))
- **ui-shell:** share the theme blocks with the classic shell ([8c4373e](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c4373eeb7665833e184ca65590ad778b1a9c6c1))
- **utils:** build the grapheme segmenter on first use ([ff121ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff121ef99dfbd6ff3016c3e96083006ca5dbaf75))
- **utils:** skip `Intl.Segmenter` for Latin initials ([adb9742](https://github.com/carbon-design-system/carbon-components-svelte/commit/adb9742b4a9f85966545b54dc93fa0c2da2adb08))

### [0.113.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.113.0...v0.113.1) (2026-10-07)

### Bug Fixes

- **tooltip-definition:** anchor the inline tooltip to its term ([e2d8c3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/e2d8c3a8f1dda3ee25bfb1269ab1b93096df123c))
- **tooltip-definition:** keep the caret visible while the tooltip shows ([b3445a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/b3445a8b2e6641d7e864d9618c48efc79ad5fe17))

### [0.113.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.112.0...v0.113.0) (2026-10-01)

### ⚠ BREAKING CHANGES

- **css:** drop `@font-face` rules for unused IBM Plex weights (#4119) ([f2ec490](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2ec490c7e9c1c300e255a7fcca33e26ef9c379e))
- **disclosure:** the toggle event's detail was a bare boolean,
unclear at the call site (e.detail vs. e.detail.open). It's now
{ open: boolean }, matching AccordionItem's new toggle event and
leaving room to add fields later without another breaking change. ([27952fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/27952fcbaa96893119228d7436e28bff8fa105bf))

### Features

- **accordion-item:** dispatch toggle when a header is clicked ([d5db48b](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5db48b9e8be151bd2419090efdb39f3cede2fee))
- **action-set:** add sticky prop ([7710613](https://github.com/carbon-design-system/carbon-components-svelte/commit/7710613c40d1f9492371966579e6a6b6f59886f1))
- **aspect-ratio:** accept an arbitrary WxH ratio ([9b638d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b638d543061106cccfa02f27707a7accfdb7b3c))
- **aspect-ratio:** add fill, align, and justify props ([aae69b2](https://github.com/carbon-design-system/carbon-components-svelte/commit/aae69b2f8a6d7f5deecccc688785847fdffeee98))
- **aspect-ratio:** add space-between, space-around, and space-evenly to justify ([9404c38](https://github.com/carbon-design-system/carbon-components-svelte/commit/9404c383df8591ad61ebf3f1b78c425aab8c96c5))
- **aspect-ratio:** add tag prop for the outer element ([8c96cbc](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c96cbcefb0c00a9367fed9d9e31ff11433b98c8))
- **big-number:** add default slot for footer content ([7e297fe](https://github.com/carbon-design-system/carbon-components-svelte/commit/7e297fec14851fceadb07242a3911bfabb89e81a))
- **big-number:** add delta, deltaPercentage, and deltaLabel props ([ac97f47](https://github.com/carbon-design-system/carbon-components-svelte/commit/ac97f47578e523a1c861ea1fbf8ed04dbe84026d))
- **big-number:** add flat trend and neutral trend color ([e4abbbc](https://github.com/carbon-design-system/carbon-components-svelte/commit/e4abbbcc116fb0347ceaad41902a149be26e5727))
- **big-number:** add formatOptions and format props ([994180b](https://github.com/carbon-design-system/carbon-components-svelte/commit/994180bcdd5eacfbf8df876000253aa65c75821e))
- **big-number:** show full value on hover when abbreviated ([ab4dd4e](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab4dd4e727a2e53b2795ea699b82f45fbfe86d25))
- **bleed:** add Bleed component ([78037fb](https://github.com/carbon-design-system/carbon-components-svelte/commit/78037fbf093259c38111b7c3df0c1763ba928f2d))
- **box, stack:** forward scroll, keyboard, and focus events ([904c6bf](https://github.com/carbon-design-system/carbon-components-svelte/commit/904c6bf3e3e49e803f5ad08f82fa1eabb59ce0c8))
- **box:** add `direction` prop ([850f6f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/850f6f8ac9cde5309ae2382944f91cee9cec8534))
- **box:** add `layer-accent` and `brand` fills ([d767fa9](https://github.com/carbon-design-system/carbon-components-svelte/commit/d767fa9f13b88bed9481cf6d65840c256b0e62c8))
- **box:** add `wrap`, `alignSelf`, and `grow` props ([e0b6a93](https://github.com/carbon-design-system/carbon-components-svelte/commit/e0b6a93bc5299ce120b012890c0302729e6510c8))
- **box:** add align and justify props ([84e0b92](https://github.com/carbon-design-system/carbon-components-svelte/commit/84e0b92647d0e3fa47f679fac44f896fbf229b61))
- **box:** add bindable `ref` prop ([6d49547](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d49547a733ffbd3ad242f567d99d8da135a7766))
- **box:** add borderSide prop ([4547701](https://github.com/carbon-design-system/carbon-components-svelte/commit/4547701423883e5050f3c26fbdef5acb5301e84f))
- **box:** add borderStyle prop for dashed borders ([9e70f2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e70f2e56222d34c578f657455e31b4efef7af92))
- **box:** add borderWidth prop ([e35894d](https://github.com/carbon-design-system/carbon-components-svelte/commit/e35894dab8436842cba03a6c6e4b983d73d439ea))
- **box:** add columns to define grid tracks ([0c29525](https://github.com/carbon-design-system/carbon-components-svelte/commit/0c29525be1ea599ba0963974483b3a94abc1e5c7))
- **box:** add display prop ([832abbf](https://github.com/carbon-design-system/carbon-components-svelte/commit/832abbfaf0b5d6a72ee1f26042b3c3e4dbb42810))
- **box:** add gap for flex and grid children ([a6ca113](https://github.com/carbon-design-system/carbon-components-svelte/commit/a6ca113d09e08d65eae5644647a301dcdb35da1a))
- **box:** add height, minHeight, maxHeight, position, top, and bottom ([14603a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/14603a08baaa0972d6bdc6dd523a71d061d09794))
- **box:** add hideBelow and hideAbove ([c0a3cea](https://github.com/carbon-design-system/carbon-components-svelte/commit/c0a3ceaa25aac5481b7c0af6730f432b53ba5860))
- **box:** add left and right position offsets ([bd87340](https://github.com/carbon-design-system/carbon-components-svelte/commit/bd87340753a49cffcede59512d2f13a385be30b8))
- **box:** add overflow prop ([bd3939e](https://github.com/carbon-design-system/carbon-components-svelte/commit/bd3939e327bd96436fda67f57304caae2330f63c))
- **box:** add overflowX and overflowY ([6664751](https://github.com/carbon-design-system/carbon-components-svelte/commit/66647516f80aebec16282aee6932549756ece76f))
- **box:** add shadow prop ([1e44701](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e44701aff424f2dafb17b8cb989232bad37d158))
- **box:** add single-side margin props ([4c0ce03](https://github.com/carbon-design-system/carbon-components-svelte/commit/4c0ce03b1f08867a523ab67101fedf9b479e81cf))
- **box:** add single-side padding props ([f004ec5](https://github.com/carbon-design-system/carbon-components-svelte/commit/f004ec5a407b48a09bbf2547d9a79a86e8809a65))
- **breadcrumb:** add `orientation` prop to pin stacked or horizontal layout ([ee4dcf5](https://github.com/carbon-design-system/carbon-components-svelte/commit/ee4dcf506a81928a2673f1726739c24871d8e099))
- **breadcrumb:** add icon prop to `BreadcrumbItem` ([f6747bf](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6747bfd5c088b347b55be24b55a73875ce65cda))
- **breadcrumb:** add separator prop for custom separator character ([61669b8](https://github.com/carbon-design-system/carbon-components-svelte/commit/61669b84c771c7a00c69b6892d995bf1649658fd))
- **breadcrumb:** allow a component reference as separator ([230537c](https://github.com/carbon-design-system/carbon-components-svelte/commit/230537cd09d95ad45e43f698906054b185c60f4e))
- **button:** add `loading` state ([d273ad1](https://github.com/carbon-design-system/carbon-components-svelte/commit/d273ad1f3de63502a78146a32fd0ba8ac89a5511))
- **button:** add fullWidth prop ([b6dd781](https://github.com/carbon-design-system/carbon-components-svelte/commit/b6dd78111d20602645cdef7375bd3306d8f0b726))
- **carousel:** add `wrap` prop ([75e3fa1](https://github.com/carbon-design-system/carbon-components-svelte/commit/75e3fa1af98533adb3626aa6df6e8c24ac395d4f))
- **carousel:** add Carousel and CarouselItem ([9f74945](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f74945fbb2e460fb240c26d785555948e4c90e1))
- **carousel:** add position counter ([1818bd4](https://github.com/carbon-design-system/carbon-components-svelte/commit/1818bd489e40d57a63da85a0e9fece3f4b4b0b6b))
- **code-snippet:** copy the rendered slot text when code is unset ([09438c2](https://github.com/carbon-design-system/carbon-components-svelte/commit/09438c24fc6c79cb268c83ea1f761a5774af5819))
- **combo-box:** add a plain ComboBoxSkeleton ([bef1d2d](https://github.com/carbon-design-system/carbon-components-svelte/commit/bef1d2df674e60d0182dd547218540c47edad9f8))
- **combo-box:** announce a cleared selection ([804ba1b](https://github.com/carbon-design-system/carbon-components-svelte/commit/804ba1bfc0e3e4e6b0c8779838f04f80e803058b))
- **combo-box:** announce filter result counts ([488b012](https://github.com/carbon-design-system/carbon-components-svelte/commit/488b0128f8755cdcacfebae6941041e35a201ddd))
- **combo-button:** add `loading` for the primary action ([5b278f5](https://github.com/carbon-design-system/carbon-components-svelte/commit/5b278f565ad90a638a7643e05eb226e03950119c))
- **composed-modal:** add alert prop for alertdialog ([1cfab0c](https://github.com/carbon-design-system/carbon-components-svelte/commit/1cfab0cdec4357eb24b0205ece22ac1cf613cae7))
- **contained-list:** add hideLabel prop ([5a144a6](https://github.com/carbon-design-system/carbon-components-svelte/commit/5a144a67371aafcee9b1b395faaa57bcaa2c30b0))
- **content-switcher:** add `SwitchPanel` ([5bf897b](https://github.com/carbon-design-system/carbon-components-svelte/commit/5bf897bcb135c0f99754d2b181049e13bbe123a4))
- **content-switcher:** expose selected on the Switch default slot ([0b5b788](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b5b7885a69350ad3e8945db96bca1970527d9f5))
- **context-menu:** move focus by typed character ([17548f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/17548f8f4cbbff7d747941afc10a5ec0df6432c7))
- **css:** apply color-scheme: dark globally for dark themes ([4fb4652](https://github.com/carbon-design-system/carbon-components-svelte/commit/4fb46524d3a1e5380fb1df68e27f07d2b2ecb16e))
- **data-table:** add allowDeselect for radio selection ([801ea03](https://github.com/carbon-design-system/carbon-components-svelte/commit/801ea03bea4a8f0386e667137af34b3c407cc0b1))
- **data-table:** add column settings helpers ([c777681](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7776812b16a77eef78faad7a36f75d983544c4e))
- **data-table:** add scrollend event for virtualized load-more ([8c0da70](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c0da701d669eea9f23eae38768a0ac3e0a5785b))
- **data-table:** add selectTextOnFocus prop to ToolbarSearch ([93d59da](https://github.com/carbon-design-system/carbon-components-svelte/commit/93d59da8eab2cfceac22998c25e798504ef2a3e6))
- **date-picker:** add "multiple" datePickerType ([764ec39](https://github.com/carbon-design-system/carbon-components-svelte/commit/764ec399a9e71956a7ab2aa691157cbef0107980))
- **date-picker:** add `disabledDates` and `enabledDates` props ([6591bc5](https://github.com/carbon-design-system/carbon-components-svelte/commit/6591bc5bcdcc437820a144b133a8011d9e67c292))
- **date-picker:** add `displayFormat` prop ([e99bf2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/e99bf2e67a1ace072a76f52b7555b5720430c895))
- **date-picker:** add `error` event for unparseable dates ([163928b](https://github.com/carbon-design-system/carbon-components-svelte/commit/163928b14fdb43d3e2f390cab20904f8c571ffef))
- **date-picker:** add `initialMonth` prop ([d86a92e](https://github.com/carbon-design-system/carbon-components-svelte/commit/d86a92e4bf6aeb740bfa1a4a454d5522cfebb6eb))
- **date-picker:** add `inline` prop ([6f70f24](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f70f241bfc71b8f4e297c4535445131dd08ec3e))
- **date-picker:** add a week date picker type ([afa1018](https://github.com/carbon-design-system/carbon-components-svelte/commit/afa1018cc100c20841d74da9dc066aa04c02e7cb))
- **date-picker:** add bindable open ([c05fce1](https://github.com/carbon-design-system/carbon-components-svelte/commit/c05fce192d8676278ec771e73409131d1e1c167e))
- **date-picker:** add bindable selectedDates ([98a8c67](https://github.com/carbon-design-system/carbon-components-svelte/commit/98a8c673f0cf4dfbbd6e7c43504c9271f98a69ec))
- **date-picker:** add clearable ([bb4821b](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb4821bc5e8e5422123dd3efc25473d58a603373))
- **date-picker:** add selectTextOnFocus prop to DatePickerInput ([6223c25](https://github.com/carbon-design-system/carbon-components-svelte/commit/6223c25557c8859e0c5cb9897140693c2f795eec))
- **date-picker:** limit range length with minRangeDays and maxRangeDays ([36b0445](https://github.com/carbon-design-system/carbon-components-svelte/commit/36b0445d8f8540d8ff1ffff4d9ca23847c14e1b4))
- **date-picker:** warn about unsupported `flatpickrProps` ([424ff42](https://github.com/carbon-design-system/carbon-components-svelte/commit/424ff426faed9a2064c834e5c1cc860ee0c39e0e))
- **description-list:** add DescriptionList and DescriptionListItem ([15616d4](https://github.com/carbon-design-system/carbon-components-svelte/commit/15616d4701bbc7b49168de2f1f3ee4316f80dfed))
- **divider:** add Divider component ([323fe80](https://github.com/carbon-design-system/carbon-components-svelte/commit/323fe80951baae2449b0087c6198540bf815dba5))
- **dropdown:** add `align` prop ([c59b2e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/c59b2e846ec6671c52f3f55f4da552ae0fef4cc9))
- **dropdown:** open the menu at the first match when typing ([4ba5016](https://github.com/carbon-design-system/carbon-components-svelte/commit/4ba5016191bcc745d6ea179d0e83dd469d09c627))
- **file-uploader:** show the file size on each row ([d02f89a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d02f89aa237fcad686fbda5b0dd263883167659f))
- **form:** forward the reset event ([2b6ab21](https://github.com/carbon-design-system/carbon-components-svelte/commit/2b6ab21d247d54a43dcc23cfaacd7545b8c053fe))
- **grid:** add align prop to Row and Column ([23d8f10](https://github.com/carbon-design-system/carbon-components-svelte/commit/23d8f109ef5d54cb4a7ee54dfa66f62bd535945f))
- **grid:** add GridOverlay, a dev-aid that draws the breakpoint grid ([937c478](https://github.com/carbon-design-system/carbon-components-svelte/commit/937c47814b167c9f942631881e74d34bc91c4848))
- **header-search:** add selectTextOnFocus prop ([c4ab92a](https://github.com/carbon-design-system/carbon-components-svelte/commit/c4ab92aab799b4ee4d1a2e37ea9e320db58cedc8))
- **heading:** add type prop for visual size ([647ca49](https://github.com/carbon-design-system/carbon-components-svelte/commit/647ca49ae9adbd2f8901363168fe288eefe5f584))
- **inline-loading:** add delay prop ([57db25d](https://github.com/carbon-design-system/carbon-components-svelte/commit/57db25d4203e19d8056a47bec8a94d5225111570))
- **list-box:** add `align` prop to ListBoxMenu ([cbcda2f](https://github.com/carbon-design-system/carbon-components-svelte/commit/cbcda2f913c6a7fd26066120ab0bbe0db8ad2f80))
- **loading:** add delay prop ([2ecf1ff](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ecf1ff6153bd52461766f5a77e0b1a0c7598477))
- **menu:** move focus by typed character ([49e0293](https://github.com/carbon-design-system/carbon-components-svelte/commit/49e02936576c2f557f2341f2578dc488dabdf3a3))
- **meter:** add `Meter` component ([1403e71](https://github.com/carbon-design-system/carbon-components-svelte/commit/1403e715d0c0ba21d9c881b343cfafb84535e502))
- **modal:** accept null for selectorPrimaryFocus ([c47d726](https://github.com/carbon-design-system/carbon-components-svelte/commit/c47d7262a8a302253ed668363d7aabc68e32b349))
- **modal:** add secondary button loading state ([b2015d6](https://github.com/carbon-design-system/carbon-components-svelte/commit/b2015d603cd7dcf9b254efd7e08dc715b9560854))
- **multi-select:** add a plain MultiSelectSkeleton ([74ff26c](https://github.com/carbon-design-system/carbon-components-svelte/commit/74ff26c94e6ab18971e4ad70b2b218d52e2f5656))
- **multi-select:** add scrollend test coverage and live load-more example ([38d13c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/38d13c3671b3eba3bd157a019da6a12d739fa27f))
- **multi-select:** add selectTextOnFocus prop ([8a40104](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a401048558d3123e7d8e6dce68ffa63835221bb))
- **multi-select:** allow `sortItem={false}` to skip sorting ([1f057a2](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f057a279e1bb58a9aa70c2aef0484a48982621a))
- **multi-select:** move the highlight by typed character ([5d6a3ee](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d6a3ee08b1f1f71fbef95f240f9743081f8b804))
- **multi-select:** select a range with Shift+Enter or Shift+Space ([2a60647](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a60647f9b7a406951433243ee5ea54490d7f686))
- **multi-select:** select all with Ctrl+A ([a300b5d](https://github.com/carbon-design-system/carbon-components-svelte/commit/a300b5d5d813c30090451f9cb097955f52181e1d))
- **multi-select:** support grouped items ([e6f7813](https://github.com/carbon-design-system/carbon-components-svelte/commit/e6f781304da56e0d5ff6f73169a405b8f2ceb3ea)), closes [#1422](https://github.com/carbon-design-system/carbon-components-svelte/issues/1422)
- **number-input:** add selectTextOnFocus prop ([d58b55c](https://github.com/carbon-design-system/carbon-components-svelte/commit/d58b55c3e17abd1122f4f1f94d8c2d6d888366a9))
- **number-input:** step by 10 on PageUp and PageDown ([65e86d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/65e86d84100b8ac3862ca432badcf78bd028c1d5))
- **overflow-menu:** move focus by typed character ([4c80fc9](https://github.com/carbon-design-system/carbon-components-svelte/commit/4c80fc96513f19ab10b0839da0305ceae5a1fe00))
- **page-header:** add PageHeader component ([60d5d71](https://github.com/carbon-design-system/carbon-components-svelte/commit/60d5d715c204c176c66b606006f5239031ef551f))
- **password-input:** add selectTextOnFocus prop ([d051a4e](https://github.com/carbon-design-system/carbon-components-svelte/commit/d051a4e7c68cb92658b1ae83c35331a2a99d4638))
- **pin-code-input:** add segmentLabelText to localize segment labels ([be62d12](https://github.com/carbon-design-system/carbon-components-svelte/commit/be62d12fcd4ca5523e1413f357b0b7abd462ae6e))
- **popover:** close on Escape with closeOnEscape ([8a005e4](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a005e49afea20b79426b7bbea4543dd046f6ecc))
- **progress-bar:** add valueText for the label and aria-valuetext ([854ac29](https://github.com/carbon-design-system/carbon-components-svelte/commit/854ac290a1c2828def92f1d0674bb8b6c43b9cc2))
- **progress-indicator:** add arrow key navigation between steps ([d6f9798](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6f979857ef1318d7e8fb41e28167acd6eeccd29))
- **radio-button-group:** add invalid and warning messages ([ce240f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/ce240f8a8af84fdfd657a3ec9637c324642f406a))
- **radio-button:** add `allowDeselect` for `RadioButtonGroup` ([e6ed7d6](https://github.com/carbon-design-system/carbon-components-svelte/commit/e6ed7d6cd5df3d0fcd2d7adc12db25fcf7f9536a))
- **radio-button:** add a standalone readonly prop ([1fb53c7](https://github.com/carbon-design-system/carbon-components-svelte/commit/1fb53c7a5a43ee7403450055c9989e43ad5781e6))
- **range-slider:** add minGap to enforce a minimum handle separation ([438278d](https://github.com/carbon-design-system/carbon-components-svelte/commit/438278d2183c65c76bc398801e6486d333be52d9))
- **range-slider:** add orientation for a vertical track ([a8cca80](https://github.com/carbon-design-system/carbon-components-svelte/commit/a8cca801bcbd2cbfaf7d451bb3aa5d847c66e8a2))
- **range-slider:** add selectTextOnFocus prop ([8dde7fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/8dde7fccccd50a4154e0045c3cef5c2c8f66b6f1))
- **relative-time:** add `RelativeTime` component ([aca8c33](https://github.com/carbon-design-system/carbon-components-svelte/commit/aca8c333532dc3afd40a45ac803f8e76233f5d6e))
- **scroll-gradient:** accept fill token names for `color` and `background` ([069e899](https://github.com/carbon-design-system/carbon-components-svelte/commit/069e8993f34c843b7452c9c3e54a18ee8a6b9d96))
- **scroll-gradient:** add `scrollElementRef` ([80d19b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/80d19b6f7d1823cbf8d0aef3d787ca76841ce019))
- **scroll-gradient:** add background prop ([faf12f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/faf12f62c8ed1c7d80e104e47da5bf0a165011b0))
- **scroll-gradient:** add height prop ([57ded65](https://github.com/carbon-design-system/carbon-components-svelte/commit/57ded65090cc60e4b4bd424cdf1d063eefca5e18))
- **search-menu:** add menuMaxHeight prop ([0885950](https://github.com/carbon-design-system/carbon-components-svelte/commit/088595088d7e231a04ab317066d894f57af8cd17))
- **search-menu:** add readonly and hideLabel ([4da9efb](https://github.com/carbon-design-system/carbon-components-svelte/commit/4da9efb7b8803fffa1af15881317ab16321495fb))
- **search-menu:** add scrollend event for load-more results ([80df63a](https://github.com/carbon-design-system/carbon-components-svelte/commit/80df63a502e327a6f63430e7149fb92ee3355052))
- **search-menu:** add selectTextOnFocus prop ([299bd15](https://github.com/carbon-design-system/carbon-components-svelte/commit/299bd150da3a5ed642cb16c14d0b960ca63cac59))
- **search-menu:** append a loading row when results are already shown ([e64a558](https://github.com/carbon-design-system/carbon-components-svelte/commit/e64a5587d73518d529941370e4cdbe816b6f76af))
- **search-menu:** debounce the search event ([5480807](https://github.com/carbon-design-system/carbon-components-svelte/commit/5480807ce0efaf131a8be367b6cfb60312b1ea6f))
- **search-menu:** show a spinner in the search input via searchLoading ([80737af](https://github.com/carbon-design-system/carbon-components-svelte/commit/80737af5e9f0b9c6bc36fb3b45c3477f7a38ae32))
- **search:** add invalid, warn, helper text, and hideLabel ([2954144](https://github.com/carbon-design-system/carbon-components-svelte/commit/29541447dfdba8ee312b1c75a3c0da0851653ff7))
- **search:** add readonly ([9fb3c59](https://github.com/carbon-design-system/carbon-components-svelte/commit/9fb3c59cf76d4fb89c64387c16dcc691bacc37ae))
- **search:** add selectTextOnFocus prop ([eef1ade](https://github.com/carbon-design-system/carbon-components-svelte/commit/eef1ade7db74e428377d46eb594e160927f1f2dc))
- **search:** debounce the search event ([145df8e](https://github.com/carbon-design-system/carbon-components-svelte/commit/145df8e1fc92c61b8ba44f0205f7f583a7f98b31))
- **search:** show a spinner while a search is in progress ([d255905](https://github.com/carbon-design-system/carbon-components-svelte/commit/d2559050d2399a16dd510c0178f734e8eb1dd4e0))
- **select:** describe read-only state for VoiceOver ([b036142](https://github.com/carbon-design-system/carbon-components-svelte/commit/b03614250bec5a7ae86d7156be2ce9d0de791027))
- **selectable-tile-group:** select a range with Shift+click ([adccd29](https://github.com/carbon-design-system/carbon-components-svelte/commit/adccd298788fad02548e99dec3b327365034b03d))
- **slider:** add helperText prop ([2d2ddea](https://github.com/carbon-design-system/carbon-components-svelte/commit/2d2ddead74aeff55b2a8aba774f051b728c1ce53))
- **slider:** add orientation for a vertical track ([6cf2a88](https://github.com/carbon-design-system/carbon-components-svelte/commit/6cf2a882035a98946a70493268cfba7ce281d783))
- **slider:** add selectTextOnFocus prop ([977b3b0](https://github.com/carbon-design-system/carbon-components-svelte/commit/977b3b02cd508761c78c72aff77dd09560ac94a5))
- **slider:** add snapToMarks for snapping to configured marks ([4e3410d](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e3410dee7f67ece748026c2a5b9d0a3bbe1852f))
- **slider:** move by a large step on PageUp and PageDown ([ee8b88d](https://github.com/carbon-design-system/carbon-components-svelte/commit/ee8b88d244fd8be51fedb937c76f541d44f4a20d))
- **stack:** add a bindable `ref` prop ([6e22e6f](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e22e6fded7f71ef85a25e66a351913eaf90abda))
- **stack:** add an `as` prop for custom elements and components ([ffd5299](https://github.com/carbon-design-system/carbon-components-svelte/commit/ffd52998f989277bd304c98747fe98a94c1b9101))
- **tabs:** add `flush` prop to TabContent ([b15959b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b15959b6ed957df12943214b828fbfb2648d303e))
- **tabs:** add size to TabsSkeleton ([acfdf9d](https://github.com/carbon-design-system/carbon-components-svelte/commit/acfdf9d3d4f56118cb24747ce8b9d7e1719b063a))
- **text-area:** add selectTextOnFocus prop ([e390550](https://github.com/carbon-design-system/carbon-components-svelte/commit/e3905500853738d80307ef4c7aff9fc9212c1c4b))
- **text-area:** grow the field with its content ([367220e](https://github.com/carbon-design-system/carbon-components-svelte/commit/367220e380fb5fc422ebae74ce35e487b163c55d))
- **text-input:** add selectTextOnFocus prop ([6f8a15d](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f8a15d6620f66e2a9bba9c99fd6edbda80dcd2d))
- **text:** add `inherit` type to opt out of the type style ([7a7ff7b](https://github.com/carbon-design-system/carbon-components-svelte/commit/7a7ff7bffc920ced237ff00424c6faed19230b96))
- **text:** add `success` and `link` colors ([095a11b](https://github.com/carbon-design-system/carbon-components-svelte/commit/095a11bde4113cef0c4dc16bf21ab4a7d607a753))
- **text:** add pretty prop to avoid orphaned words ([7183189](https://github.com/carbon-design-system/carbon-components-svelte/commit/7183189e4bd15ef8ce88e610e694901889aeb686))
- **tile:** add fullHeight prop ([7d63f4f](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d63f4f6894ba286940ff03e5f3f3ed683a848aa))
- **tile:** add noPadding prop ([9829780](https://github.com/carbon-design-system/carbon-components-svelte/commit/9829780f0645e6c7850f3131ce1e42510325d3ef))
- **time-picker:** add a plain TimePickerSkeleton ([f6f0f93](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6f0f93db72fe98616f5a0259a632f915ccbdc64))
- **time-picker:** add selectTextOnFocus prop ([6e3fe97](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e3fe971d777ca633dbc2fbc5c66f3055c2d1b68))
- **time-picker:** describe a read-only TimePickerSelect for VoiceOver ([14612f1](https://github.com/carbon-design-system/carbon-components-svelte/commit/14612f105a27abad506bde4227ca3d495834b166))
- **time-picker:** disable the selects with the time picker ([e3fc72d](https://github.com/carbon-design-system/carbon-components-svelte/commit/e3fc72d3cfedb9cf1d822e0d98ee180bd9c867ee))
- **toggle-button-group:** add `ToggleButtonGroup` and `ToggleButton` ([9dfa0bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/9dfa0bcf163c0b6b40505821939a5df32a2cc9b3))
- **toggle:** add a warn state ([fb326a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/fb326a03eea898757b52766e4ec5179f3e8b261e))
- **toggle:** add value for form submission ([2470cbf](https://github.com/carbon-design-system/carbon-components-svelte/commit/2470cbf89ec55b30769131afe5ce7db0f5b520bf))
- **toolbar-column-visibility:** add ToolbarColumnVisibility ([34618e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/34618e3a95fbbd2c3e70afafde9d5f731abc49ea))
- **toolbar-density:** add `ToolbarDensity` component ([4507f4d](https://github.com/carbon-design-system/carbon-components-svelte/commit/4507f4d5511c01786783ed9387be357157811675))
- **toolbar-search:** add debounce prop ([e541496](https://github.com/carbon-design-system/carbon-components-svelte/commit/e541496eaabcb4ffde011f06854c6373f1b709c1))
- **toolbar:** add sticky and stickyOffset props ([12f28c9](https://github.com/carbon-design-system/carbon-components-svelte/commit/12f28c9fa5d8921069aa52947294167d8fdc4250))
- **tree-view:** toggle selection with Shift+Up and Shift+Down ([0a9deae](https://github.com/carbon-design-system/carbon-components-svelte/commit/0a9deaed02779fb7c8e67fa6139025223ff06bfb))
- **ui-shell:** add `activeItemScrollBlock` prop to SideNav ([9fe8753](https://github.com/carbon-design-system/carbon-components-svelte/commit/9fe87536ad4e4508bd4da887c7839a04d17770ba))
- **ui-shell:** add `border` prop to `SideNav` ([f120299](https://github.com/carbon-design-system/carbon-components-svelte/commit/f1202999fa8aea973518a0d14dfdc06c6034a7f5))
- **ui-shell:** add badge slot to `SideNavLink` and `SideNavMenu` ([947e2c8](https://github.com/carbon-design-system/carbon-components-svelte/commit/947e2c8764fd7f12b141dbe5cce046bb84a2aa63))
- **ui-shell:** add resizable width to SideNav ([cb41cf4](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb41cf4badf0590d1daf838ae3f6977df4fdb2c5))
- **ui-shell:** debounce the HeaderSearch search event ([325cf16](https://github.com/carbon-design-system/carbon-components-svelte/commit/325cf16c0fcaddc71ab1fc7b946b605f270712d9))
- **ui-shell:** indent nested SideNavMenu by depth ([9511fb0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9511fb0249f4f30802582ef5fe1fc57d6f7bfa87))
- **user-avatar:** forward focus and keyboard events ([e9b905a](https://github.com/carbon-design-system/carbon-components-svelte/commit/e9b905a1a59511c297f1252a5898d50e639237b2))
- **utils:** add `queryParam` store synced to the URL ([303d3f4](https://github.com/carbon-design-system/carbon-components-svelte/commit/303d3f4255c57ac62d912753dc2f65c21ff47a0e))
- **utils:** add getInitials util ([2869335](https://github.com/carbon-design-system/carbon-components-svelte/commit/28693351e73ce7e77553a947b27a3f36fe470b9d))
- **utils:** export getAvatarBackgroundColor from barrel ([8079a01](https://github.com/carbon-design-system/carbon-components-svelte/commit/8079a01a42df499e64448ee783bd62bb02111acc))
- **virtual-list:** add VirtualList component ([4b6f9e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/4b6f9e8f12ec3307b9cc05ca4d4c11cbe411b438))

### Bug Fixes

- **accordion-item:** close a disabled item ([70545b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/70545b4aee63d95bcb9e479eddf82851addb4fc8))
- **accordion-item:** forward focus and blur from the heading button ([672c1d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/672c1d22278088c3486ea3c4c5a9232fa0a7341e))
- **accordion-item:** name the open panel as a region ([f781ee5](https://github.com/carbon-design-system/carbon-components-svelte/commit/f781ee5d2fda3a6f298bb58912bb7904a8b648ce))
- **accordion:** keep a single open panel when type is single ([b62a592](https://github.com/carbon-design-system/carbon-components-svelte/commit/b62a592cb79d92bdf600336db0950501cf890711))
- **badge-indicator:** stop mixing logical and physical offsets ([5993a2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/5993a2ed463e8f028a572b1e0716e8a7b982b9b0))
- **big-number:** announce trend and fraction to assistive tech ([89abc57](https://github.com/carbon-design-system/carbon-components-svelte/commit/89abc5732aece13c633c48f87ad06c2c316d1911))
- **big-number:** show denominator when value exceeds total ([a946694](https://github.com/carbon-design-system/carbon-components-svelte/commit/a946694a805d1ea3733b44223c615121dba9c18c))
- **box:** forward click and hover events to the rendered element ([d45530a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d45530a0b6ff53495761b61ba4c7034e526490c0))
- **box:** let axis spacing override a custom all-sides value ([6bb5ca6](https://github.com/carbon-design-system/carbon-components-svelte/commit/6bb5ca60620410adeb03933089852058c5059583))
- **box:** resolve 0 to an inline style instead of dropping it ([d999868](https://github.com/carbon-design-system/carbon-components-svelte/commit/d99986837ba68837818b8702bba6a08fac11e7cb))
- **button-set:** let buttons shrink inside narrow containers ([1f9248f](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f9248f45bf839e9b770b6dd060009cf329e3fc4))
- **checkbox-group:** describe read-only state for screen readers ([9e2b118](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e2b11853c0b9fedfe845c901ca81dd8bfab0eb6))
- **checkbox:** describe read-only state for screen readers ([573dadf](https://github.com/carbon-design-system/carbon-components-svelte/commit/573dadf5f1059c7646dbe670a635c8c3fae2eaad))
- **checkbox:** submit "on" when no value is set ([18a2f3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/18a2f3aac67ba669c377ddcccdd89e9f20bea9fd))
- **checkbox:** sync checked after the form resets ([977ce9d](https://github.com/carbon-design-system/carbon-components-svelte/commit/977ce9d0196d730239170adfb62c39dff59c9bd0))
- **checkbox:** take the new state from the input on change ([33ada13](https://github.com/carbon-design-system/carbon-components-svelte/commit/33ada1354fc7c1040f6d5498facfde146cebd925))
- **code-snippet:** don't copy "undefined" from a slot-only inline snippet ([95039f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/95039f05a5dbeed9be4be48194e54798c0537a37))
- **code-snippet:** expose inline snippet code to assistive tech ([115c52c](https://github.com/carbon-design-system/carbon-components-svelte/commit/115c52c115e1a8d3c7388aa690c6d1256ca11b70))
- **code-snippet:** fade scroll edges only where content continues ([3325812](https://github.com/carbon-design-system/carbon-components-svelte/commit/332581270d8776a16bd1dd41db801fcd89ae09a3))
- **code-snippet:** keep a rest aria-label off the root element ([d4de629](https://github.com/carbon-design-system/carbon-components-svelte/commit/d4de6299221d8eec2c2a0352fe0dbd73d23bc307))
- **combo-box:** filter typeahead matches by the displayed label ([58a3aed](https://github.com/carbon-design-system/carbon-components-svelte/commit/58a3aedd7b99d870eb748c78f5e90797ed0b0874))
- **combo-box:** match typed text against the displayed label ([79ef55b](https://github.com/carbon-design-system/carbon-components-svelte/commit/79ef55b0019f87de888b3408967c2162cebf69a8))
- **combo-box:** resync selectedId and value after the form resets ([3fffee8](https://github.com/carbon-design-system/carbon-components-svelte/commit/3fffee88fc5e9f991f20ffa78940d5027de0bc85))
- **combo-box:** skip selectTextOnFocus when disabled ([2ad76a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ad76a12f2fa3a01b940422eb2a4916f79b00c83))
- **combo-box:** stop announcing read-only as disabled ([350bbf5](https://github.com/carbon-design-system/carbon-components-svelte/commit/350bbf5fa12fb5c76d6fc50f277d9d9cc299b18b))
- **composed-modal:** keep a rest aria-label off the presentation root ([b0b8284](https://github.com/carbon-design-system/carbon-components-svelte/commit/b0b8284b481f130984a04af0b236c64ed20a3d8c))
- **composed-modal:** move focus in when the modal opens ([beef888](https://github.com/carbon-design-system/carbon-components-svelte/commit/beef888a4be96e9ea096e12d735abfcc5213691c))
- **composed-modal:** remove dead buttonRef/declareRef wiring ([db2a6f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/db2a6f62dd59e61dcb3a12f6642d14bd53a41a0c))
- **composed-modal:** set tabindex=-1 on the dialog ([6cec0ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/6cec0edc9cf383454dc07df9b93c69f1212962ad))
- **contained-list:** remove the native underline on link items ([e1f85b8](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1f85b88750dad99e742275b52e69cde5f01452d))
- **content-switcher:** clamp an out-of-range selectedIndex ([6a17e5f](https://github.com/carbon-design-system/carbon-components-svelte/commit/6a17e5f82120c931e3a423bad2d2056f9be74e11))
- **content-switcher:** don't dispatch change when a selected Switch mounts ([4e59692](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e59692719dbb89a9fe533ad58f0169b1c7f65d3))
- **content-switcher:** keep a tab stop when the selected switch is disabled ([a03d66d](https://github.com/carbon-design-system/carbon-components-svelte/commit/a03d66d66199dd2767022c52b645243487afcd50))
- **content-switcher:** keep selectedIndex on the selected switch after a removal ([213f69f](https://github.com/carbon-design-system/carbon-components-svelte/commit/213f69f481308a4256f57c5375fe78036994675b))
- **content-switcher:** select a switch when its selected prop turns true ([171486a](https://github.com/carbon-design-system/carbon-components-svelte/commit/171486aee6d0b969f2eba177647d2a5d6fa3d2ad))
- **context-menu:** block ArrowLeft, ArrowRight, PageUp, and PageDown ([9b15288](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b15288a8fbad4b793f86b1c774f6a88e372e13d))
- **context-menu:** close on Tab instead of swallowing it ([fecfd3f](https://github.com/carbon-design-system/carbon-components-svelte/commit/fecfd3fb515c551b1bc63a55ee88929c9d24584d))
- **context-menu:** remove dead menuOffsetX tracking ([dab8aeb](https://github.com/carbon-design-system/carbon-components-svelte/commit/dab8aebe5dc4863f70c57adbfadbe43cde98fcba))
- **context-menu:** return focus when the menu closes ([140371e](https://github.com/carbon-design-system/carbon-components-svelte/commit/140371ea1e98e0ed63b33399745a33a340ec36d6))
- **context-menu:** skip disabled options with the arrow keys ([71b78fb](https://github.com/carbon-design-system/carbon-components-svelte/commit/71b78fb08405d6b69c0bd5d79d9493b3e8854b00))
- **copy-input:** default tooltip alignment to end ([39f7026](https://github.com/carbon-design-system/carbon-components-svelte/commit/39f70263a8798b8e8f07289b6536cc92e153157f))
- **css:** color plain links with the link token ([dcf1427](https://github.com/carbon-design-system/carbon-components-svelte/commit/dcf142781c0e09963c89827e2cd0af2e6dfcd5f0))
- **css:** guard hand-authored hover rules with any-hover ([655f665](https://github.com/carbon-design-system/carbon-components-svelte/commit/655f665ce3c4729857f3141718f5f66d13f2dfcd))
- **css:** guard selectable tag hover rules with any-hover ([54fb649](https://github.com/carbon-design-system/carbon-components-svelte/commit/54fb649ab2bd8e185cc64023f2f3fca48bddbf60))
- **css:** guard Tabs hover rules against touch devices ([89b8a03](https://github.com/carbon-design-system/carbon-components-svelte/commit/89b8a03b99bb90631ba2f12696e08755e4d4550e))
- **css:** make focus rings appear instantly, not fade in ([7e358a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/7e358a1ed6cf193d2752734e7ebd8445d3a13ee5))
- **css:** remove content switcher selected-fill wipe animation ([f34366d](https://github.com/carbon-design-system/carbon-components-svelte/commit/f34366d30802aadd580fb4d5a0ab2ebe87a04346))
- **css:** stop content switcher label shifting on select ([76506a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/76506a85d95b07c34b356fc53487f10afb9b9d1d))
- **data-table-skeleton:** contain table in scrollable wrapper ([d2ff1d0](https://github.com/carbon-design-system/carbon-components-svelte/commit/d2ff1d0cc77ea37ca288eb75a332280f9a3b2129))
- **data-table:** align footer cells with their column ([685f9eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/685f9ebda99f9704aa5fe4b744d9a7dbe48c281b))
- **data-table:** derive batch expansion state from the expandable rows ([f7378a9](https://github.com/carbon-design-system/carbon-components-svelte/commit/f7378a93e938dfc7effb4ca95936c7010b22c565))
- **data-table:** do not force fixed table layout when a header sets width ([85e4334](https://github.com/carbon-design-system/carbon-components-svelte/commit/85e43342428862c0e626fc8651d7317852389cae))
- **data-table:** inset nested content in expanded rows ([d85129a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d85129ad9e5a9eacad53e8282547d8046a5f68ea))
- **data-table:** keep table layout for sticky headers ([5a8faab](https://github.com/carbon-design-system/carbon-components-svelte/commit/5a8faab971f3c3d5f6775263c15b405e70e55575))
- **data-table:** keep the hidden batch actions bar from widening the page ([710b76e](https://github.com/carbon-design-system/carbon-components-svelte/commit/710b76ef3a6071ce117c7a9357689d9730197463))
- **data-table:** keep the selection header cell for radio batch tables ([0cecb2f](https://github.com/carbon-design-system/carbon-components-svelte/commit/0cecb2fcd7f44fb7c22e038a5e40f6dd1ad82c94))
- **data-table:** scope select all to the rows matching the filter ([fdad53e](https://github.com/carbon-design-system/carbon-components-svelte/commit/fdad53e2909bb991815c3740b010bfbc7b834bd3))
- **data-table:** size the virtual window from stickyHeaderMaxHeight ([25af189](https://github.com/carbon-design-system/carbon-components-svelte/commit/25af189714079ef9b52dd866a692662ea37eba2b))
- **data-table:** skip hidden columns in the footer row ([ce1eca1](https://github.com/carbon-design-system/carbon-components-svelte/commit/ce1eca188783bfbea3c436d96d8fb45b5d487d32))
- **data-table:** skip hidden columns in toCsv ([f8aee5c](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8aee5c64dd23d0509139827fe008ba9737b8ef3))
- **data-table:** skip hidden rows in shift-click range selection ([d410c99](https://github.com/carbon-design-system/carbon-components-svelte/commit/d410c994f7b7d35d70e8b2958a8e491d242d7435))
- **data-table:** target the scrolling table, not its wrapper, for virtualized sticky headers ([394ea5f](https://github.com/carbon-design-system/carbon-components-svelte/commit/394ea5f64f5ee315105ec241e0c9372d83e28c39))
- **date-picker:** block an inline calendar while read-only or disabled ([d77decd](https://github.com/carbon-design-system/carbon-components-svelte/commit/d77decda2c948e688543878fc16c193f7590f365))
- **date-picker:** create the flatpickr instance only once ([b7cf76e](https://github.com/carbon-design-system/carbon-components-svelte/commit/b7cf76ed0ba4a3e33abacf4aa6436f22610ec9bf))
- **date-picker:** declare the `open` event ([d8314fb](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8314fbcdf847bf46f1948590062c8ed5196b8a5))
- **date-picker:** disable calendar open/close animation by default ([61137e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/61137e20865ac3f635fca681799f1a79745e7140))
- **date-picker:** dispatch `change` once per calendar selection ([fa68ac1](https://github.com/carbon-design-system/carbon-components-svelte/commit/fa68ac1a3be126d8cbc8ecb739b407a6fd84db8b))
- **date-picker:** honor flatpickr `ignoredFocusElements` ([ad0bbc1](https://github.com/carbon-design-system/carbon-components-svelte/commit/ad0bbc1b2b2ac15590fbaaf46b06dbad057a994f))
- **date-picker:** honor flatpickr `shorthandCurrentMonth` ([17da936](https://github.com/carbon-design-system/carbon-components-svelte/commit/17da936b917446f58270bffef56b874f99083803))
- **date-picker:** ignore ArrowDown when there is no calendar ([01ab552](https://github.com/carbon-design-system/carbon-components-svelte/commit/01ab552522879a7c3752e56e436f94e1be79294e))
- **date-picker:** ignore unsupported `wrap` flatpickr option ([624ddc0](https://github.com/carbon-design-system/carbon-components-svelte/commit/624ddc04a084eb25c58ad6a8ae75752ad5eec563))
- **date-picker:** keep consumer `allowInput` and `clickOpens` ([9f405e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f405e51bd32965c068a407a94d26bada9123de6))
- **date-picker:** keep focus in the calendar after selecting a day with Enter ([1a924a6](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a924a693125d65d98a56c821278d8a3a3a9149f))
- **date-picker:** keep selection with a custom `formatDate` ([326b87c](https://github.com/carbon-design-system/carbon-components-svelte/commit/326b87c563a2c744a0b4d5f79a602e18a299c366))
- **date-picker:** label the visible flatpickr `altInput` ([5f2d0e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/5f2d0e78552c22c67ad939dfb30aaadceedd2b7f))
- **date-picker:** lay out flatpickr `weekNumbers` column ([cacd93e](https://github.com/carbon-design-system/carbon-components-svelte/commit/cacd93e894cb6744a409045982e760816ba948db))
- **date-picker:** lay out multiple months side by side ([6ff765b](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ff765b3d00e62c6a479605f00f90f8bc665191a))
- **date-picker:** let simple-variant labels overflow past the input ([08be3b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/08be3b61cbd508cdccad8993e25bdee476525942))
- **date-picker:** list multiple among the types that bind calendar ([94f9120](https://github.com/carbon-design-system/carbon-components-svelte/commit/94f91204c2d39d674a1e9922c2abf3cb6cdc5f80))
- **date-picker:** mark out-of-range years as aria-disabled ([2366a23](https://github.com/carbon-design-system/carbon-components-svelte/commit/2366a232cb621ce0e02bfd617106a8660e6cca2a))
- **date-picker:** merge consumer flatpickr hooks with Carbon's ([b338dad](https://github.com/carbon-design-system/carbon-components-svelte/commit/b338dadd4a565f2b7ad5abc6ccfd5ca192c05691))
- **date-picker:** mirror input state onto flatpickr `altInput` ([4d82e21](https://github.com/carbon-design-system/carbon-components-svelte/commit/4d82e211915fd2dc8b8e49effb38a3cb52fc23bc))
- **date-picker:** move focus into the calendar when today is not focusable ([c6c209a](https://github.com/carbon-design-system/carbon-components-svelte/commit/c6c209a1ffa4d3dfe3c314254e735dcd12d307cc))
- **date-picker:** omit `mode` and `wrap` from `flatpickrProps` type ([7d64925](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d64925f78fd47957c44edac5231ce270fe87339))
- **date-picker:** prevent page scroll on ArrowDown into calendar ([9f985dd](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f985dd03153b087bd116e1a4eb46554d776d6d4))
- **date-picker:** rebuild the calendar when `datePickerType` changes ([f49e562](https://github.com/carbon-design-system/carbon-components-svelte/commit/f49e5625d5af33fed8aae7c77921b21f8de5b4da))
- **date-picker:** reopen calendar on ArrowDown after Escape closed it ([9db2f11](https://github.com/carbon-design-system/carbon-components-svelte/commit/9db2f11627cf04b1e26262e1e4373fccfeb2ea5f))
- **date-picker:** report escape-key when Escape closes the calendar grid ([f58fd9b](https://github.com/carbon-design-system/carbon-components-svelte/commit/f58fd9b43d7ff4363b36bcaaaf7908b025deb7c8))
- **date-picker:** respect `flatpickrProps.defaultDate` ([2988dd8](https://github.com/carbon-design-system/carbon-components-svelte/commit/2988dd8991095f1b592350f52c12246f384d7140))
- **date-picker:** stop calendar shadow and overlap from hiding range borders ([42c5105](https://github.com/carbon-design-system/carbon-components-svelte/commit/42c510529066c7a3c188fd79b5a910573377324a))
- **date-picker:** stop flatpickr day focus outline from animating ([8cab44f](https://github.com/carbon-design-system/carbon-components-svelte/commit/8cab44fb64bb19c496a9e22e1ec172443e96bc46))
- **date-picker:** stop flatpickr day focus ring flashing on click ([77f340b](https://github.com/carbon-design-system/carbon-components-svelte/commit/77f340b8b229d7219f185dcd1b07a25fc0c4a143))
- **date-picker:** style out-of-range months as disabled ([b3d5656](https://github.com/carbon-design-system/carbon-components-svelte/commit/b3d56560d5e7151d0dc09cddec73401934ac1dfb))
- **date-picker:** style the flatpickr `inline` calendar ([abd6a9d](https://github.com/carbon-design-system/carbon-components-svelte/commit/abd6a9d4a6f9ec00dc317ce97287ae7eaa27caad))
- **date-picker:** sync the bound value after the form resets ([ad212ec](https://github.com/carbon-design-system/carbon-components-svelte/commit/ad212ecb87941cd1bb8066a8d180bd6b5d67811a))
- **date-picker:** sync the hidden displayFormat field after the form resets ([8a9be86](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a9be8650a858b33feed2b19ed2f22cfee59e129))
- **date-picker:** tear down an inline calendar safely ([6456dba](https://github.com/carbon-design-system/carbon-components-svelte/commit/6456dba152ad6f18c0b94144e1c15e92bfaec9e7))
- **date-picker:** treat a failed flatpickr init as no calendar ([0c9fee8](https://github.com/carbon-design-system/carbon-components-svelte/commit/0c9fee8f3099e3d71f88db4cae4babfadd345e46))
- **disclosure:** dispatch toggle with an { open } object ([27952fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/27952fcbaa96893119228d7436e28bff8fa105bf))
- **dropdown:** dispatch close when Tab dismisses the menu ([d355f19](https://github.com/carbon-design-system/carbon-components-svelte/commit/d355f193fd0859cfe4f0ddce93f141f29711d5c6))
- **dropdown:** don't dispatch select when re-clicking the selected item ([32b88fd](https://github.com/carbon-design-system/carbon-components-svelte/commit/32b88fd4ec9c27bffc51c08cf8ed81e0852cd6fd))
- **dropdown:** drop aria-disabled and describe readonly for VoiceOver ([52c1037](https://github.com/carbon-design-system/carbon-components-svelte/commit/52c10373010b893e74a2f22202b12396e8eaafae))
- **dropdown:** keep inline menu width when portaled ([6824d41](https://github.com/carbon-design-system/carbon-components-svelte/commit/6824d41b1dc439deeb0a8345ad52f65829e3d973))
- **dropdown:** let Home and End win over the selection when opening ([2429d71](https://github.com/carbon-design-system/carbon-components-svelte/commit/2429d71dfd4fe7c7ef798bb6046d5c58c281a79e))
- **dropdown:** name the combobox with `aria-label` ([0a81cc4](https://github.com/carbon-design-system/carbon-components-svelte/commit/0a81cc4a9a3526fa0cc2e3d156598b52b6f858a7))
- **dropdown:** omit a disabled dropdown from form submission ([d6900e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6900e2f166ca8f29f3676e4857cf4b61f23a4b7))
- **file-uploader-button:** keep the native input's files after a dismissed picker ([3fd0262](https://github.com/carbon-design-system/carbon-components-svelte/commit/3fd0262c207f33c29f06880355b706edb9824580))
- **file-uploader-drop-container:** keep the native input's files after a dismissed picker ([49d5bbf](https://github.com/carbon-design-system/carbon-components-svelte/commit/49d5bbf5991f357bf0887ac78f9aba2d3d94259c))
- **file-uploader-drop-container:** keep the native input's files equal to files ([9b6f8e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b6f8e78fdb7ac02db7b4ea11357ff3edc789c28))
- **file-uploader:** keep the drop highlight while the pointer is inside ([f4be37c](https://github.com/carbon-design-system/carbon-components-svelte/commit/f4be37cb37ccc57b09602ab492ac5f62bc984021))
- **form-group:** style the message and invalid state ([e39a076](https://github.com/carbon-design-system/carbon-components-svelte/commit/e39a076db24c7fe4ec380d857684d1ca83787389))
- **grid:** mark Column's per-breakpoint offset optional ([226f73d](https://github.com/carbon-design-system/carbon-components-svelte/commit/226f73dc5e6e11ed2b01388222b17ae23c5d89fe))
- **grid:** remove Column's stale, contradicting second @slot doc block ([a01e2da](https://github.com/carbon-design-system/carbon-components-svelte/commit/a01e2dab3ee9bbcd99c3881de7ac1aba7dbc1291))
- **grid:** widen Column's aspectRatio type to the ratios the CSS ships ([9d5719a](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d5719a84ae801f35683e294d12b0aef15f1c4a8))
- **header-switcher:** restore the focus ring color on the trigger ([0420411](https://github.com/carbon-design-system/carbon-components-svelte/commit/0420411bbfb33b0c80a7a091fee999b86932cd84))
- **inline-loading:** map status to live region roles ([e2e5536](https://github.com/carbon-design-system/carbon-components-svelte/commit/e2e5536d352f702e0edd5c5558c40ecf0e74892a))
- **inline-loading:** use 14px text to match v11 ([44db65e](https://github.com/carbon-design-system/carbon-components-svelte/commit/44db65e7734bc5d555ea11a84a3075104709d116))
- **interstitial-screen:** render on the server ([fda7ce5](https://github.com/carbon-design-system/carbon-components-svelte/commit/fda7ce570783665b98edc653b3229a2d6f0aafc4))
- **list-box:** drop aria-label from the role-less wrapper ([2ad02ff](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ad02ff7782ddaa3282ffc214711fed5c8909dbd))
- **list-box:** keep portaled menu static when a style is passed ([785839f](https://github.com/carbon-design-system/carbon-components-svelte/commit/785839ff959af6beb116ff9f5a925b406df00b68))
- **menu:** compile `Menu` for server rendering ([ae4e5f5](https://github.com/carbon-design-system/carbon-components-svelte/commit/ae4e5f53559cf36bad418d5babf9afa2a9d621d2))
- **menu:** skip the open focus task during server rendering ([7c5ee12](https://github.com/carbon-design-system/carbon-components-svelte/commit/7c5ee1251f532ae56b1729d393b3253a73f66358))
- **meter:** announce warning and error when the status changes ([0388df7](https://github.com/carbon-design-system/carbon-components-svelte/commit/0388df7cf4cc02101bb07679fe37138bad1fc41a))
- **meter:** clamp aria-valuenow to zero ([4fc56d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/4fc56d2c89d1e452e5a72a03ce88269066b9ec5b))
- **meter:** describe over-capacity and warning or error status ([8c56963](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c56963ca103b86aea0df1f379ea6afd6f3bb575))
- **meter:** describe warning and error thresholds ([9046fa2](https://github.com/carbon-design-system/carbon-components-svelte/commit/9046fa257f1921588b081bef6e208e4a895a7ded))
- **meter:** render an empty bar for a non-finite value ([ae40139](https://github.com/carbon-design-system/carbon-components-svelte/commit/ae40139026f5fbc3340327839981150d52838010))
- **modal:** don't submit on Enter from a link or tab ([1c32a8a](https://github.com/carbon-design-system/carbon-components-svelte/commit/1c32a8a221a8c5ca8d4927e10767019453186e23))
- **modal:** don't submit on the Enter that commits an IME composition ([a67e1b5](https://github.com/carbon-design-system/carbon-components-svelte/commit/a67e1b5038ccccf2c6c3b251f805e9079bc812e3))
- **modal:** keep a rest aria-label off the presentation root ([fb12ba8](https://github.com/carbon-design-system/carbon-components-svelte/commit/fb12ba89ecac0bf10994cbe4b2b1e50b57e3a9ce))
- **modal:** render an open modal on the server ([2713d1d](https://github.com/carbon-design-system/carbon-components-svelte/commit/2713d1d52507d4316778c00c8a941b9dc4ab21d2))
- **multi-select:** describe the default filterItem accurately ([a2e3d32](https://github.com/carbon-design-system/carbon-components-svelte/commit/a2e3d326dd24e40afb484dc0da7668edb8009b6b))
- **multi-select:** dispatch close when Tab dismisses the menu ([aa71e2b](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa71e2bfd767fa69cf132ace47de4c474bcb50ce))
- **multi-select:** don't dispatch select for programmatic selectedIds ([13221c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/13221c3e55f93be8e25cf00fb355cf64da10d7b4))
- **multi-select:** ignore keys on a disabled field ([7a48a9e](https://github.com/carbon-design-system/carbon-components-svelte/commit/7a48a9e6e9e434ced0fb60f977d645c6ae41812c))
- **multi-select:** omit a disabled multi-select from form submission ([3586d9c](https://github.com/carbon-design-system/carbon-components-svelte/commit/3586d9cc8e2a3d12a9d6f29d9970c1509a831ac0))
- **multi-select:** open the menu on Enter ([1986ccf](https://github.com/carbon-design-system/carbon-components-svelte/commit/1986ccf34be339874e5c745485d674a7311bbe28))
- **multi-select:** show external selectedIds in fixed and open menus ([17defaf](https://github.com/carbon-design-system/carbon-components-svelte/commit/17defaf88dc8b99a3add2a494e178cd9e084c008))
- **multi-select:** submit item ids under a shared name ([7c06bd0](https://github.com/carbon-design-system/carbon-components-svelte/commit/7c06bd09e419f4fb09db1dfd3d6757a18cfe7c7e))
- **multi-select:** type the clear event detail as the DOM event ([16621a3](https://github.com/carbon-design-system/carbon-components-svelte/commit/16621a3eaae49a9b13025e4d4060cd60f98de5d1))
- **notification:** document the queue fields the toast already accepts ([7bc0ba9](https://github.com/carbon-design-system/carbon-components-svelte/commit/7bc0ba93f3bb8cc992136dc44ca376d4acc5cfe4))
- **notification:** pause auto-dismiss while the tab is hidden ([bf29a12](https://github.com/carbon-design-system/carbon-components-svelte/commit/bf29a1281665822c3b09f7eecc6f1aa71dd2a9db))
- **notification:** pause the timeout while focus is inside ([7396598](https://github.com/carbon-design-system/carbon-components-svelte/commit/73965986d9cad63955640074cd93d8742a343d42))
- **number-input:** don't block form submission for decimal or formatted values ([09b3af1](https://github.com/carbon-design-system/carbon-components-svelte/commit/09b3af196978731f4b210dd89b07acf991932042))
- **number-input:** submit the numeric value in locale and decimal modes ([ba18784](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba18784917c4cb98f325f25ad91637d009f6f42a))
- **number-input:** sync the value after the form resets ([6aca7ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/6aca7ef32b19d83c6b8b183031611ac49850ccb0))
- **number-input:** use aria-errormessage for invalid state ([215ed74](https://github.com/carbon-design-system/carbon-components-svelte/commit/215ed74deec19e2f7922a2a37119a6b56a2c831a))
- **number-input:** use sans 400 type to match v11 ([b44839b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b44839b6aa15db21197d26803447af28f830d385))
- **overflow-menu:** size a custom `menu` slot trigger to its content ([30b78d7](https://github.com/carbon-design-system/carbon-components-svelte/commit/30b78d711b9ce1e4d2555ea3e45c404eea19ae88))
- **package:** stop publishing sveld's parse cache ([92f634f](https://github.com/carbon-design-system/carbon-components-svelte/commit/92f634fa91a6dfb83160073eae34d92e09757816))
- **pagination:** keep the same items visible when the page size changes ([0e0fce4](https://github.com/carbon-design-system/carbon-components-svelte/commit/0e0fce43cd790249a667ccc9fda29efc87f43efe))
- **pagination:** show "0 items" when nothing is in the list ([da09c2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/da09c2ed04105484f3307eee05ab73ece618d200))
- **password-input:** add readonly wrapper class and EditOff icon ([2f56ddd](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f56dddb04adcb74fae97df11b6711a440df4865))
- **password-input:** prevent the hidden tooltip from causing horizontal overflow ([ae5b6c0](https://github.com/carbon-design-system/carbon-components-svelte/commit/ae5b6c030451a8afe7d8bd9dc45296dc898a164d))
- **password-input:** sync the bound value after the form resets ([2383e39](https://github.com/carbon-design-system/carbon-components-svelte/commit/2383e394ab97fcf86fc7b5c404e0d5a57ca956ac))
- **pin-code-input:** announce alphanumeric segments as characters ([05faa3d](https://github.com/carbon-design-system/carbon-components-svelte/commit/05faa3dc46c50325afc4c49a9e8b836a71a47d2e))
- **pin-code-input:** keep required on the segments when name is set ([b0bc4b5](https://github.com/carbon-design-system/carbon-components-svelte/commit/b0bc4b56e500c8744cccaa5f59562f909a93cd7a))
- **pin-code-input:** replace a filled segment's character when typing ([d155513](https://github.com/carbon-design-system/carbon-components-svelte/commit/d1555132747f3aac37da3e199e735904ac550f55))
- **pin-code-input:** skip change when Delete hits an empty segment ([123bcae](https://github.com/carbon-design-system/carbon-components-svelte/commit/123bcae36b3b58f0aa2d25ee33ae4ae5397c6634))
- **pin-code-input:** skip the legend tab stop when hidden or disabled ([6d9d7cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d9d7cf7bb315f2eb06e0c8c5f89063256225a26))
- **pin-code-input:** sync the code after the form resets ([052c65c](https://github.com/carbon-design-system/carbon-components-svelte/commit/052c65c215d8d89806061ed74aa9446580ac7826))
- **pin-code-input:** use aria-errormessage for invalid state ([c8ac884](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8ac884346c3164f44865ce7521bef8c5efdbcc3))
- **pin-code-input:** use sans for fields ([81a3eff](https://github.com/carbon-design-system/carbon-components-svelte/commit/81a3eff6e6b7490db1febe96dd7f52f6909ccea5))
- **popover:** offset right-top through --cds-popover-offset ([a0ef003](https://github.com/carbon-design-system/carbon-components-svelte/commit/a0ef0036e15dda74db0f1cf3f601c594ebc416d7))
- **portal:** render an open `FloatingPortal` on the server ([b49437a](https://github.com/carbon-design-system/carbon-components-svelte/commit/b49437a68ac466605e2ad4ab2708ab63cc5e4bed))
- **progress-bar:** announce error and complete when the status changes ([5f3e161](https://github.com/carbon-design-system/carbon-components-svelte/commit/5f3e1617bb34df8a3f4b5570dc24de6a9df39abf))
- **progress-bar:** avoid scaleX(NaN) when max is 0 ([6b402f3](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b402f3a8819c9ef6aaa100b187a9862bf1c792d))
- **progress-bar:** report the real value when status is error ([d1d51e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/d1d51e7034e521f9b5fc54972a9117e6539646dd))
- **progress-step:** mark incomplete steps unclickable ([407b8b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/407b8b62e18002e9ef317e13eba0356b3757c1cd))
- **radio-button-group:** describe read-only state for screen readers ([ffd29c7](https://github.com/carbon-design-system/carbon-components-svelte/commit/ffd29c74fa855d10ff72d0dcf5fc4f38917c4e09))
- **radio-button-group:** expose orientation on the radiogroup ([da51586](https://github.com/carbon-design-system/carbon-components-svelte/commit/da515860d6583c1832734417e59da0dd1e3e3aae))
- **radio-button-group:** follow the checked radio after the form resets ([4f41a7e](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f41a7e012722406842f480b19b860a55949b65a))
- **radio-button-group:** keep the buttons' own name when the group has none ([e1157fe](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1157fea4aca054cb40b17f6e97affc4c53d2850))
- **radio-button-group:** set aria-readonly on the radiogroup when read-only ([a2d58bf](https://github.com/carbon-design-system/carbon-components-svelte/commit/a2d58bf68ba0894a9241d85c9254baa852c26d87))
- **radio-button-group:** share a generated name when name is omitted ([9c41492](https://github.com/carbon-design-system/carbon-components-svelte/commit/9c41492774d2d7ca03df218e4e483bb097abf902))
- **radio-button:** apply aria-label to the input ([60bb40b](https://github.com/carbon-design-system/carbon-components-svelte/commit/60bb40ba1fa7704f353ebd4a7633595caef4d167))
- **radio-button:** sync a standalone button after the form resets ([bb9242e](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb9242e5badde7ded4362ae61621e056bebdd4ff))
- **range-slider:** dispatch focus and blur with handle ([8747183](https://github.com/carbon-design-system/carbon-components-svelte/commit/8747183b328cbd4a54a30057032538fbc538add8))
- **range-slider:** hide invalid and warn states when disabled or readonly ([7c10744](https://github.com/carbon-design-system/carbon-components-svelte/commit/7c107446fe0b48035aaacca6e531ab9e7d0132f9))
- **range-slider:** keep a grabbed handle under the pointer ([3c90af1](https://github.com/carbon-design-system/carbon-components-svelte/commit/3c90af19a89c4f089a28332e77184fe2b3324d1d))
- **range-slider:** keep both bounds when the form resets ([44415a2](https://github.com/carbon-design-system/carbon-components-svelte/commit/44415a2b11c90af67688d8d30641a09f042121fc))
- **relative-time:** resync shared tick timer on visibilitychange ([6ef59b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ef59b6f3d2f4b517595114c18c76e96e5ff13f1))
- **scripts:** make release-changelog idempotent on unstaged reruns (#3823) ([1546a67](https://github.com/carbon-design-system/carbon-components-svelte/commit/1546a67353383b433a2f319bb0e08fcf64ee1f07))
- **search-menu:** clear hover highlight when mouse leaves item ([016316d](https://github.com/carbon-design-system/carbon-components-svelte/commit/016316de8f0f6003e31848b61944667f4fe63f77))
- **search-menu:** scroll the highlighted item within the menu ([9f4ee2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f4ee2a44df618a932008a8b318bade7a89521b6))
- **search-menu:** tighten group header bottom padding ([3c92bfe](https://github.com/carbon-design-system/carbon-components-svelte/commit/3c92bfe49e8392bb4c7cfb624d414f7f3a58a817))
- **search:** collapse the expandable field on a second Escape ([8e9c4e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e9c4e9e5faa45b098ca9858cae364b6286ff6cb))
- **search:** open the expandable field from the keyboard ([444224d](https://github.com/carbon-design-system/carbon-components-svelte/commit/444224dd43154405b0b3aec85ce2593da73bf598))
- **search:** resync value after the form resets ([01c2b28](https://github.com/carbon-design-system/carbon-components-svelte/commit/01c2b284f53ad5f12165ba8440404672ce0888f7))
- **select:** block typeahead on a read-only select ([4ec0ffc](https://github.com/carbon-design-system/carbon-components-svelte/commit/4ec0ffcbf988651149b4d373bc735f932fd48dce))
- **select:** compile `SelectItem` for server rendering ([baf041f](https://github.com/carbon-design-system/carbon-components-svelte/commit/baf041fecdab81fb3d6d098199a72fad5b445aec))
- **select:** keep the selection when the form resets ([bc650c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/bc650c34c8ef3b7e783f178b8bbd9e2ec74235ca))
- **slider:** announce read-only state to screen readers ([fe16429](https://github.com/carbon-design-system/carbon-components-svelte/commit/fe1642984c735e49c0cccb11ebf88e0dcfe6f5cb))
- **slider:** forward focus and blur events from the number input ([947b230](https://github.com/carbon-design-system/carbon-components-svelte/commit/947b2303f5374961b7e032c9415dbf4a07e9f432))
- **slider:** keep the value when the form resets ([298bdf9](https://github.com/carbon-design-system/carbon-components-svelte/commit/298bdf961cbae0843f77b7e18298c09c3ac671aa))
- **slider:** show numeric min/max as range labels by default (#3909) ([a3308d4](https://github.com/carbon-design-system/carbon-components-svelte/commit/a3308d46f2f95055255942f7b83e4ea1515f653a))
- **slider:** use sans for range labels to match v11 ([350e009](https://github.com/carbon-design-system/carbon-components-svelte/commit/350e0098c12d4bdf29eca88f141b3008bb958eb0))
- **stack:** describe wrap for vertical stacks too ([497cde7](https://github.com/carbon-design-system/carbon-components-svelte/commit/497cde768559093d4fa6da4e6928cf938708cdac))
- **structured-list:** apply selected when the parent changes it (#3978) ([a2a2f07](https://github.com/carbon-design-system/carbon-components-svelte/commit/a2a2f071802a74b3d59158d2550796f6179a0336))
- **structured-list:** drop aria-sort when the cell is not a column header (#3979) ([212a791](https://github.com/carbon-design-system/carbon-components-svelte/commit/212a791fe713eaf6e11ecf8de0e55d04e6c98c02))
- **structured-list:** group single-select rows under one name ([da126ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/da126eae4d6d76ec8d7f042a5dacee23204be552))
- **structured-list:** react to multiple, selection, and icon (#3986) ([0198a85](https://github.com/carbon-design-system/carbon-components-svelte/commit/0198a858db47a181ee4b1313d5b28985711ee50f))
- **table-container:** render the description without a title ([8069ee0](https://github.com/carbon-design-system/carbon-components-svelte/commit/8069ee0024a14034c766d9c16066e4141f2d0f45))
- **tabs-vertical:** drop solid background from mobile nav row (#3907) ([aebd013](https://github.com/carbon-design-system/carbon-components-svelte/commit/aebd0136d872081887063d1fb3e789e977da5d7d))
- **tabs-vertical:** fix narrow column, truncation, and hover border (#3914) ([f907cb4](https://github.com/carbon-design-system/carbon-components-svelte/commit/f907cb4d9a8cedc363679bfe606c79f84eff6198))
- **tabs-vertical:** move arrow-key focus from the focused tab ([fcb5948](https://github.com/carbon-design-system/carbon-components-svelte/commit/fcb594884d0c7aae509f10b88c8050be00075f1b))
- **tabs-vertical:** reset vertical xl root height below `md` breakpoint (#3904) ([05d9d3b](https://github.com/carbon-design-system/carbon-components-svelte/commit/05d9d3bfeedeb2c80c291a9e11b261dcdbd7980b))
- **tabs:** keep focus in the tab list after a dismiss ([b42892e](https://github.com/carbon-design-system/carbon-components-svelte/commit/b42892e4bbbce3ad51e18d380b82168633213eab))
- **tabs:** keep tab registration current when props change ([b736b75](https://github.com/carbon-design-system/carbon-components-svelte/commit/b736b754f2ded79274e915b954723bb7144c61cf))
- **tabs:** make the tab list a single Tab-key stop ([4f8d946](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f8d9468d0b0bc604b9a5768a816893e4a58c95f))
- **tabs:** move arrow-key focus from the focused tab ([73ae75a](https://github.com/carbon-design-system/carbon-components-svelte/commit/73ae75a50b7055d05860f4b5790da42e5c0ce93b))
- **tabs:** reserve bold width so selecting a tab doesn't reflow siblings (#3903) ([14c3fe1](https://github.com/carbon-design-system/carbon-components-svelte/commit/14c3fe14fcd46b31cfff519447a2966d1e6cbe88))
- **tabs:** stack icon + secondary label below `md` breakpoint ([d5da2e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5da2e9ce1e6dd4ff5bcf86cc5ba1da5dd8af910))
- **tag:** expose the full label via title when truncated ([d4b2c96](https://github.com/carbon-design-system/carbon-components-svelte/commit/d4b2c962583902d9a749ba5dd65c69334d86f9b9))
- **test:** avoid any in the DataTable equal-headers sort spy ([0c7ec89](https://github.com/carbon-design-system/carbon-components-svelte/commit/0c7ec890a06874bae57d170bf18cfc77fcac8b59))
- **text-area:** describe the character counter in words ([5d91925](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d9192551b5e63100295207a67168efb9f845191))
- **text-area:** honor hideLabel in fluid mode ([814061f](https://github.com/carbon-design-system/carbon-components-svelte/commit/814061ffac7b800d67157857fe523f5c33d45bfb))
- **text-area:** keep fluid focus ring and wrapper height stable ([fd7f713](https://github.com/carbon-design-system/carbon-components-svelte/commit/fd7f7136385eab2ebb60ba7791d0bdbeacfec1cf))
- **text-area:** limit maxCount by grapheme instead of maxlength ([0f56403](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f5640333ff08061bc496a865b3ca142d4129840))
- **text-area:** mark the counter when the value is already over maxCount ([9489af3](https://github.com/carbon-design-system/carbon-components-svelte/commit/9489af3e1b2575ae56d1a013fe72e4a7bbf73fcc))
- **text-area:** show the character counter without a label ([cd21490](https://github.com/carbon-design-system/carbon-components-svelte/commit/cd21490c0b74b61383619ecec47bc156cba50a0a))
- **text-area:** sync the bound value after the form resets ([a41e906](https://github.com/carbon-design-system/carbon-components-svelte/commit/a41e9068d96c943a549eced21e75c804d688c035))
- **text-input:** sync the bound value after the form resets ([7842858](https://github.com/carbon-design-system/carbon-components-svelte/commit/7842858b4d4d0d838228e483f67113e2e5023403))
- **tile-group:** follow the checked tile after the form resets ([9341826](https://github.com/carbon-design-system/carbon-components-svelte/commit/93418262e00272cf969caa0060a5b3d510311683))
- **tile-group:** share a generated name when name is omitted ([9f1714c](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f1714ca138cc65b51047ff8b1c48d3c23a3fac7))
- **time-picker:** keep a read-only select closed on Alt+Down ([373e113](https://github.com/carbon-design-system/carbon-components-svelte/commit/373e113eb1683d7bc4e2807063a886a5e2dd7772))
- **time-picker:** keep numeric select values numeric ([42ce171](https://github.com/carbon-design-system/carbon-components-svelte/commit/42ce1711581a1fcb6c8e2be67831db2f8e0d538f))
- **time-picker:** let shortcuts through on a read-only select ([e136b79](https://github.com/carbon-design-system/carbon-components-svelte/commit/e136b79f6e01cb875606c714bb1ab87d1cb10b46))
- **time-picker:** make the selects read-only with the time picker ([a0ea973](https://github.com/carbon-design-system/carbon-components-svelte/commit/a0ea9738ac05af82765064f2fc871450da9776c5))
- **time-picker:** scope fluid rules that leaked to every TimePicker ([bb5229f](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb5229f5b17996461b793efe2ea527e878f977e6))
- **time-picker:** select the first item when a select has no value ([0e8cb71](https://github.com/carbon-design-system/carbon-components-svelte/commit/0e8cb71d3ba582d620cd4e1c527ecccab6252d2d))
- **time-picker:** sync the text input after the form resets ([b336eea](https://github.com/carbon-design-system/carbon-components-svelte/commit/b336eea6caac1992b963bf405c3dc5e47d16d529))
- **time-picker:** use aria-errormessage for invalid state ([750b667](https://github.com/carbon-design-system/carbon-components-svelte/commit/750b6674b1b8ba0f4c0e83645187f6d243b28273))
- **toggle-button:** don't throw on focus without a group ([aa8e9d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa8e9d5c77f36bb47521d13833f2c9a57eb1418b))
- **toggle:** drop aria-disabled and describe readonly for VoiceOver ([e2f475b](https://github.com/carbon-design-system/carbon-components-svelte/commit/e2f475b0460f4552298bc2e242c68a78f6632bc3))
- **toggle:** sync toggled after the form resets ([dd8dadc](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd8dadc3f32ced57d9a76866b49cb08fc71fba59))
- **toggle:** take the new state from the input on change ([b47104d](https://github.com/carbon-design-system/carbon-components-svelte/commit/b47104d3c6760f2c417b47f4e26d150143dfe20d))
- **toolbar-column-visibility:** match menu bridge to trigger width ([f997e2b](https://github.com/carbon-design-system/carbon-components-svelte/commit/f997e2b4b77b8be790e39cc5d976699dba4df75c))
- **toolbar-density:** keep the toolbar action class with a custom class ([e6e3fe6](https://github.com/carbon-design-system/carbon-components-svelte/commit/e6e3fe6b43549f0797461e70f5e7e7d29a7070a2))
- **tooltip:** theme the portalled definition tooltip shadow ([3dec376](https://github.com/carbon-design-system/carbon-components-svelte/commit/3dec3769a5d98ef58855ee4000f4c11c04f6c73c))
- **tooltip:** use body-short-01 for portal tooltip content ([f2ab60a](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2ab60a8fda6f5b44138ed91d5f7d12f09fa64ba))
- **tree-view:** follow a link node's href on Enter ([9e6fad0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e6fad03c05cd687e04a080d6125b2a735da39b4))
- **tree-view:** keep a single tab stop when nodes is reassigned (#3906) ([e5fa260](https://github.com/carbon-design-system/carbon-components-svelte/commit/e5fa260833ea65642553afd4336f5256c7712b5a))
- **tree-view:** let Ctrl+click deselect a row that is not active ([7532739](https://github.com/carbon-design-system/carbon-components-svelte/commit/7532739d575112e69689918c30c94b905500bf53))
- **tree-view:** omit aria-selected on virtualized link nodes ([18a1b06](https://github.com/carbon-design-system/carbon-components-svelte/commit/18a1b0612c985db24e377b4708b78dd36c3f8ccf))
- **tree-view:** only select all on Ctrl+A in multiselect mode ([b513dce](https://github.com/carbon-design-system/carbon-components-svelte/commit/b513dcefd9b14da16eb60fcfa4c185284ad5283b))
- **tree-view:** render a multiselect tree on the server ([00ecf4c](https://github.com/carbon-design-system/carbon-components-svelte/commit/00ecf4caf62f7dfd8575429f58c19c12a01c0d3d))
- **tree-view:** select node ids on Ctrl+Shift+Home and End ([b6a0d86](https://github.com/carbon-design-system/carbon-components-svelte/commit/b6a0d86e5ff4d0f82effb95eea46d722572ede25))
- **tree-view:** set node label type to match v11 ([017bb48](https://github.com/carbon-design-system/carbon-components-svelte/commit/017bb487482eda7a436703ba4f8d1001d37b9905))
- **truncate:** add tag prop to avoid nested paragraphs ([25636b2](https://github.com/carbon-design-system/carbon-components-svelte/commit/25636b2bace13bd8247227d477e83c44ee3b7433))
- **ui-shell:** expand rail SideNav on keyboard focus, not just hover ([ce615f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/ce615f747d22143627020ae329c8571af0a4c163))
- **ui-shell:** mark a SideNavMenu with a slotted icon as icon'd ([231b711](https://github.com/carbon-design-system/carbon-components-svelte/commit/231b711eebcefe294f265abc8a86ba1d9d370415))
- **ui-shell:** orient `SideNav` to the active item on mount ([360b953](https://github.com/carbon-design-system/carbon-components-svelte/commit/360b95392f29acd202577a7f54ccc13f4f83e3b6))
- **ui-shell:** trap focus inside the mobile SideNav overlay ([b2cb5c6](https://github.com/carbon-design-system/carbon-components-svelte/commit/b2cb5c6738c5e852e3a09c3b6b9505c6ff8dc55d))
- **utils:** compare non-plain objects by identity in `deepEqual` ([d753127](https://github.com/carbon-design-system/carbon-components-svelte/commit/d753127e66233b38e911e09c64633a44c58bd2a9))
- **utils:** listen for `visibilitychange` only while a timer runs (#3989) ([e63e0b5](https://github.com/carbon-design-system/carbon-components-svelte/commit/e63e0b54fc8b4c4ad673f95fce9b1e7260fd3b9f))
- **utils:** respect wrap:false in nextEnabledIndex ([8d71b91](https://github.com/carbon-design-system/carbon-components-svelte/commit/8d71b91c363a0cf49612b897ed9395a9534cb24b))

### Performance

- **big-number:** cache Intl.NumberFormat instances ([bd03971](https://github.com/carbon-design-system/carbon-components-svelte/commit/bd03971ce0f1284228f72adf83c910cfff4255ff))
- **css:** avoid logical insets and `:not()` lists that double rules ([0dc5098](https://github.com/carbon-design-system/carbon-components-svelte/commit/0dc5098919f9d4243685c2e2440fee906524099d))
- **css:** drop :not() guards that name unrendered classes ([aae562c](https://github.com/carbon-design-system/carbon-components-svelte/commit/aae562c40bc97195c74965963a9a06007d5d8e02))
- **css:** drop `.woff` sources from Plex `@font-face` rules ([a91a6c2](https://github.com/carbon-design-system/carbon-components-svelte/commit/a91a6c2b296d59d7888eefc8b6c3abe9d9576bf2))
- **css:** drop `@font-face` rules for unused IBM Plex weights (#4119) ([f2ec490](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2ec490c7e9c1c300e255a7fcca33e26ef9c379e))
- **css:** drop Button aliases and hooks no component renders ([4f57184](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f57184a73f2baabd0ab3cf85971e8ed7515385f))
- **css:** drop dead .bx--side-nav__header selector family ([3188956](https://github.com/carbon-design-system/carbon-components-svelte/commit/3188956e6eca3a0977445301040f4e49c3369868))
- **css:** drop dead password-visibility selector family ([1cc9c02](https://github.com/carbon-design-system/carbon-components-svelte/commit/1cc9c0222b41846685fffde5648b3e7abdbadcb8))
- **css:** drop logical declarations that duplicate their physical twin ([15f1488](https://github.com/carbon-design-system/carbon-components-svelte/commit/15f1488786edaea99e30382a1b764dbfc3a9041b))
- **css:** drop repeated --form-requirement class in fluid text-area ([e20e849](https://github.com/carbon-design-system/carbon-components-svelte/commit/e20e8492598a4afebeda15c4384c8a979d87001f))
- **css:** drop repeated --neutral class on fluid list-box hover ([b8351d1](https://github.com/carbon-design-system/carbon-components-svelte/commit/b8351d10803172dc3dffb4caea3cdc7cb34bd250))
- **css:** drop repeated --neutral class on fluid number-input hover ([f41c185](https://github.com/carbon-design-system/carbon-components-svelte/commit/f41c18590865582da3a4d728d9773fdc6d294d82))
- **css:** drop repeated --readonly-only class on fluid date-picker ([35e0d65](https://github.com/carbon-design-system/carbon-components-svelte/commit/35e0d65f599204b712d01e4b72bfa9da48a5ce56))
- **css:** drop repeated classes on profile-menu and header-panel ([569aa16](https://github.com/carbon-design-system/carbon-components-svelte/commit/569aa16f2c6792feef90fa72a9fd28e1b92b4e10))
- **css:** drop static `var()` fallbacks from `all.css` ([4eaf8b8](https://github.com/carbon-design-system/carbon-components-svelte/commit/4eaf8b8c0de1438dc0503af28e9271bfbc36d2b3))
- **css:** drop the redundant .list-box__field qualifier on --clearable ([6e65f47](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e65f479d23e875b50a97d6d1462cd6f3973a568))
- **css:** drop the redundant .popover qualifier on direction ::before ([1902749](https://github.com/carbon-design-system/carbon-components-svelte/commit/1902749fef43a344eaefe60721b431d72fc3b8d2))
- **css:** emit only differing tokens for non-default themes ([ecb7f06](https://github.com/carbon-design-system/carbon-components-svelte/commit/ecb7f06df353d4a03a9308b770a829b114cc6abc))
- **css:** emit shared CSS-only tooltip rules once per trigger ([933acfc](https://github.com/carbon-design-system/carbon-components-svelte/commit/933acfc8aa08faa738cd272ac58ad74d763b233e))
- **css:** explicit transition list on header search menu item ([33c9c16](https://github.com/carbon-design-system/carbon-components-svelte/commit/33c9c163e2b348baf52613d16ac35c20edece953))
- **css:** group scattered any-hover blocks per component ([4240c90](https://github.com/carbon-design-system/carbon-components-svelte/commit/4240c9041e7e465ea78e73171985535ece9a0bc1))
- **css:** prune unrendered bx--inline-loading__checkmark rule ([5b272cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/5b272cfa1178e975916a0fc503a57f7008c2d55a))
- **css:** prune unrendered bx--switcher wrapper rule ([83fe950](https://github.com/carbon-design-system/carbon-components-svelte/commit/83fe950a385c2f19f953b62f7946919378356055))
- **css:** prune unrendered bx--table-toolbar--sm selectors ([8cf1fdd](https://github.com/carbon-design-system/carbon-components-svelte/commit/8cf1fdd21178a270d92bdbddb52bc8120be306a3))
- **css:** prune unrendered bx--text-input--warn selectors ([47d8f59](https://github.com/carbon-design-system/carbon-components-svelte/commit/47d8f59d309c9e022cb161ce95a4ba7db9befbdf))
- **css:** prune unrendered bx--toolbar-search-container rules ([4831d4d](https://github.com/carbon-design-system/carbon-components-svelte/commit/4831d4d395502d0ffa34b976884ce125f5fb8731))
- **css:** redesign tooltip direction/alignment CSS around custom properties ([3ad21cc](https://github.com/carbon-design-system/carbon-components-svelte/commit/3ad21cca06cbea8647c5afec0942cd95a6613bb5))
- **css:** remove `will-change` hints that cannot composite ([8e4fbf9](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e4fbf9f4935c136805db229a72f55798c9ee808))
- **css:** remove 255 declarations that never win the cascade ([6cac725](https://github.com/carbon-design-system/carbon-components-svelte/commit/6cac7259655c1a95492b7b0f2592367d69072ce9))
- **css:** replace fluid DatePicker neutral :not() pair with a class ([a0527cb](https://github.com/carbon-design-system/carbon-components-svelte/commit/a0527cbe7d23b1dff1bdde703e1b6d0d111a74ee))
- **css:** replace fluid DatePicker readonly :not() chain with a class ([8040a34](https://github.com/carbon-design-system/carbon-components-svelte/commit/8040a347b4be6f040f60192d2f6ce36e566d77ab))
- **css:** replace fluid list-box hoverable :not() pair with a class ([c6a5a46](https://github.com/carbon-design-system/carbon-components-svelte/commit/c6a5a46616a691e70bdc53d8ec8a451919d6eaf6))
- **css:** replace fluid list-box neutral-state :not() chain with a class ([25a85e6](https://github.com/carbon-design-system/carbon-components-svelte/commit/25a85e67f207ce3807a1643e551bd16d2b84a189))
- **css:** replace fluid NumberInput invalid/warn :not() pair with a class ([f23bd3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/f23bd3c2720c01524d9e2b5bddfbdc95d2632f12))
- **css:** replace sized-Tabs :not() chains with --line/--default classes ([3ec5bea](https://github.com/carbon-design-system/carbon-components-svelte/commit/3ec5bea966f1668ae55a1feec2cd0611205364ac))
- **css:** set the high contrast focus outline style once on `:root` ([fdd7986](https://github.com/carbon-design-system/carbon-components-svelte/commit/fdd7986064a6cbaca170521b88391c78f1db05c2))
- **css:** stop nested-table style bleed at the source (#3839) ([660b293](https://github.com/carbon-design-system/carbon-components-svelte/commit/660b2936a2a3337653aaecc2e1b924b385ba7563))
- **data-table:** skip re-rendering rows when `rows` is unchanged ([a51ea3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/a51ea3a2d467fde349e3637ae9cb467801d8bc3e))
- **data-table:** skip re-sorting when `headers` is unchanged ([7eff86e](https://github.com/carbon-design-system/carbon-components-svelte/commit/7eff86e089e0e79446ea5f2fcb6142ba231b8143))
- **date-picker:** compare `Date` options by value ([0907453](https://github.com/carbon-design-system/carbon-components-svelte/commit/09074532dcc61a85077386ed67d2ae2a42251217))
- **date-picker:** compare options with the shared `deepEqual` ([330fe78](https://github.com/carbon-design-system/carbon-components-svelte/commit/330fe789afe7b63e774dd0567d2a400f5d55aa90))
- **date-picker:** skip re-applying unchanged array options ([0625103](https://github.com/carbon-design-system/carbon-components-svelte/commit/06251036444e5cd0073664f1a9ce80fca818da7f))
- **date-picker:** skip redundant flatpickr updates on mount ([4d07e7a](https://github.com/carbon-design-system/carbon-components-svelte/commit/4d07e7ae9b8035efe513425d8a9d19bb272618d6))
- **date-picker:** throttle and passivate top-layer reposition listeners ([f1915e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/f1915e381b5b4434c5ef5fa0bb411c3cb8015f7b))
- **expandable-tile:** measure padding on mount and resize, not afterUpdate ([a93a91b](https://github.com/carbon-design-system/carbon-components-svelte/commit/a93a91bfccb587d01b8f5af31730e1c13e27374c))
- **full-page-error:** optimize illustration SVGs (#4114) ([2b927c0](https://github.com/carbon-design-system/carbon-components-svelte/commit/2b927c00fd47e7f70c0f7fcf5f5baa69f8f7cd38))
- **multi-select:** reuse unchanged options when re-sorting ([dfdea76](https://github.com/carbon-design-system/carbon-components-svelte/commit/dfdea76ea656d5ef93db7b05be75bcabb051cde5))
- **multi-select:** skip re-sort for new-but-equal selectedIds (~15x) (#3911) ([296ec63](https://github.com/carbon-design-system/carbon-components-svelte/commit/296ec63d0305a6109f52d5ad7811c13fdad3a4e9))
- **multi-select:** skip re-sorting when `items` is unchanged ([059b9d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/059b9d59456f71819da4ccc069070f4c6ef16899))
- **multi-select:** sort once and partition by selection ([5c6fbfd](https://github.com/carbon-design-system/carbon-components-svelte/commit/5c6fbfdb829c581203272a7f7788bd6391101809))
- **number-input:** cache Intl.NumberFormat instances ([fdaff68](https://github.com/carbon-design-system/carbon-components-svelte/commit/fdaff68d16d3279a0fca896a4d103f43a3795ccd))
- **overflow-menu:** re-measure position only when its inputs change ([579f0a9](https://github.com/carbon-design-system/carbon-components-svelte/commit/579f0a9a14c628961d67afd8e747b2476d9058b7))
- **scroll-gradient:** observe content size instead of subtree mutations ([2b7a738](https://github.com/carbon-design-system/carbon-components-svelte/commit/2b7a738641ca88892810db8f4ef7dded6a129ab7))
- **tree-view:** skip re-rendering when nodes is unchanged (#3905) ([8c231c6](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c231c6be2e9d6db5867c6aad511c0fad50724a6))
- **tree-view:** skip updating when nodes is reassigned unchanged ([3dc2f9c](https://github.com/carbon-design-system/carbon-components-svelte/commit/3dc2f9c8db19aa6b86b57c5f6ecdc29125e5bbf8))
- **tree-view:** track roving tab stop instead of querying the tree ([a109435](https://github.com/carbon-design-system/carbon-components-svelte/commit/a109435506f450826ad618187775b6b3ede205c8))
- **ui-shell:** extract createDomNodeRegistry, batch menu-item registration ([6df8389](https://github.com/carbon-design-system/carbon-components-svelte/commit/6df8389549e142bf64616d498e65f3d5ea69477b))
- **utils:** batch carousel max-height measurement into write/read phases ([0209961](https://github.com/carbon-design-system/carbon-components-svelte/commit/020996148fcc82c9cffc9b5dbbbf6b25fafed43e))
- **utils:** defer overflowTitle measurement to a microtask ([3a34cd5](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a34cd51f8073708cbdbb3f1c1ba0c4eb34b3721))
- **utils:** use checkVisibility in trapFocus before computed styles ([58251e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/58251e7656357f92d52db37cf7312842128cee08))

### [0.112.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.112.1...v0.112.2) (2026-10-07)

### Bug Fixes

- **tooltip-definition:** anchor the inline tooltip to its term ([41a54b7](https://github.com/carbon-design-system/carbon-components-svelte/commit/41a54b7b83e09ca0072dced5e39c657eea7124de))

### [0.112.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.112.0...v0.112.1) (2026-09-25)

### Bug Fixes

- **package:** stop publishing sveld's parse cache ([4c1e994](https://github.com/carbon-design-system/carbon-components-svelte/commit/4c1e99413c72dd36dd859ab9120cf04901c6ddf9))

### [0.112.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.111.1...v0.112.0) (2026-09-10)

### Features

- **action-set:** add `ActionSet` component ([2900268](https://github.com/carbon-design-system/carbon-components-svelte/commit/29002682e242a9b1a270ac332bfb72f2dafbb544))
- **big-number:** add `BigNumber` ([b1ec073](https://github.com/carbon-design-system/carbon-components-svelte/commit/b1ec073e9ca5a2a90021e49bea30518d52cb7642))
- **button-set:** expose bindable ref to the outer element ([7d22fc0](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d22fc0bb88f9b30b4aecf1a626ed76917594442))
- **button:** fall back to ancestor ActionSet size ([c7145c0](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7145c0c20e2d6912e342bcc5c30926c645c90f2))
- **data-table:** allow `header.sort` to opt a column into sorting ([17ebdee](https://github.com/carbon-design-system/carbon-components-svelte/commit/17ebdee48af06ef31f5b4a4e14c348d3ed6ae105))
- **date-picker:** order month/year in the calendar header per locale ([2301b1d](https://github.com/carbon-design-system/carbon-components-svelte/commit/2301b1d67437195cf02eb3bbfc9388157ae049e7))
- **dropdown:** add openOnClear and a programmatic clear() method ([326e687](https://github.com/carbon-design-system/carbon-components-svelte/commit/326e68713a0130ce26aacfcea0e866796c240e3c))
- **file-uploader-button:** parity for `maxFileSize` and duplicate rejection (#3737) ([e93e794](https://github.com/carbon-design-system/carbon-components-svelte/commit/e93e794bef2ff29443af0fa69eec13bd1506d461))
- **full-page-error:** add `FullPageError` ([3d8769c](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d8769c9416edc5114fb8ad0ba07ee2e912a2770))
- **interstitial-screen:** add `InterstitialScreen` ([0506c23](https://github.com/carbon-design-system/carbon-components-svelte/commit/0506c23a37f412bacf1e2d45d968c73a31926d1a))
- **list-box:** add wrapOptions to Dropdown, ComboBox, and MultiSelect ([3b3565e](https://github.com/carbon-design-system/carbon-components-svelte/commit/3b3565eb236d7b42f702cedbea95d5c433b6f7e7))
- **multi-select:** add openOnClear and a programmatic clear() method ([283b702](https://github.com/carbon-design-system/carbon-components-svelte/commit/283b702f6eeef697da3ec9638e664a84dea036d6))
- **scroll-gradient:** add `ScrollGradient` ([010ae57](https://github.com/carbon-design-system/carbon-components-svelte/commit/010ae57ca445307d6475acfba962c11439b81b9c))
- **structured-list:** support `sortable` columns ([268b51d](https://github.com/carbon-design-system/carbon-components-svelte/commit/268b51d4ac719386d6b9e9176248375009b46222))
- **tabs:** add size prop for line and container tabs ([0b95249](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b952499038aaf33d5a8c8c317e5e5a7008f2522))
- **ui-shell:** add `HeaderSwitcher` for account and workspace switching ([c3fd75c](https://github.com/carbon-design-system/carbon-components-svelte/commit/c3fd75cb04c2e8f5d96894e69be8195111766c59))
- **ui-shell:** add avatar slot to `ProfileMenuItem` and truncate overflowing labels ([506d082](https://github.com/carbon-design-system/carbon-components-svelte/commit/506d08272bd492d0cfbdf13fd37637d2c316e84c))
- **ui-shell:** add large prop to `SideNavLink` and `SideNavMenu` ([f75a65b](https://github.com/carbon-design-system/carbon-components-svelte/commit/f75a65b524f4d8e4cb20cfd6b2429a2edbbe0355))
- **ui-shell:** move focus through `ProfileMenu` items with arrow keys ([cd8d2ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/cd8d2ba2df1e34eadcc6533cf76c3493feeedecb))
- **ui-shell:** skip the name link on `Header` when company and platform are unset ([757d009](https://github.com/carbon-design-system/carbon-components-svelte/commit/757d0096a07022881b8e7ca2593b93f3c40ac2cd))
- **virtualize:** derive offsets from measured row heights ([ad41ea6](https://github.com/carbon-design-system/carbon-components-svelte/commit/ad41ea6d802f7523609dc5cc3b5adc98f3047477))

### Bug Fixes

- **accordion-item:** remove Escape key handler causing controlled desync (#3755) ([83e7b65](https://github.com/carbon-design-system/carbon-components-svelte/commit/83e7b6587049254bcb71f0ac2f0bf4c422ac4aa1))
- **accordion-item:** remove hardcoded default title prop value ([9a4f5ec](https://github.com/carbon-design-system/carbon-components-svelte/commit/9a4f5ec136ce3fc12dbb3b76ed3dd108ecd50210))
- **data-table:** grow toolbar to fit lg/xl buttons instead of clipping them ([d6c505f](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6c505fe673585b439a548d64bd7a61429ceb12f))
- **data-table:** guard row hover styles with any-hover (#3760) ([129b4d7](https://github.com/carbon-design-system/carbon-components-svelte/commit/129b4d752be12544c4681abd76f69d8e1b27cdc0))
- **data-table:** guard toolbar hover styles with any-hover (#3776) ([cb9b8ac](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb9b8aca96881572aff19a60f123747084df074c))
- **data-table:** keep expand column width stable with custom header widths ([44f6f4f](https://github.com/carbon-design-system/carbon-components-svelte/commit/44f6f4f5b8a840145a22b7c299cf075fe3d6166d)), closes [#3777](https://github.com/carbon-design-system/carbon-components-svelte/issues/3777)
- **data-table:** resize every toolbar button kind at short/compact ([53ec7c8](https://github.com/carbon-design-system/carbon-components-svelte/commit/53ec7c8d6674bbc1bf7c96f9c56ef1d4c3a1d8eb)), closes [#3778](https://github.com/carbon-design-system/carbon-components-svelte/issues/3778)
- **data-table:** sync horizontal scroll with sticky header (#3759) ([708b79b](https://github.com/carbon-design-system/carbon-components-svelte/commit/708b79b455b73f42342fcd5e3b12562afe1fe71c))
- **date-picker:** drop opacity fade from calendar open animation (#3770) ([0e91d17](https://github.com/carbon-design-system/carbon-components-svelte/commit/0e91d1774d6fd0214d810376ac3e9ca287681ffa))
- **date-picker:** guard hover styles with any-hover ([b0cf354](https://github.com/carbon-design-system/carbon-components-svelte/commit/b0cf354c60227cb6923e98704441de10efcd5969))
- **dropdown:** reserve field padding for the clear button ([d7a5510](https://github.com/carbon-design-system/carbon-components-svelte/commit/d7a5510d0fb664837c50fc80206752a150f60911)), closes [#3782](https://github.com/carbon-design-system/carbon-components-svelte/issues/3782)
- **file-uploader:** guard hover styles with any-hover ([6941eea](https://github.com/carbon-design-system/carbon-components-svelte/commit/6941eea4ffdf15de38a29697f6a8da8240e8e639))
- **file-uploader:** set drop container input files when files are dropped (#3756) ([fd8e832](https://github.com/carbon-design-system/carbon-components-svelte/commit/fd8e832490cf1670181a0aca05280abc481a6f32))
- **inline-checkbox:** remove aria-label from `InlineCheckbox` label element ([032c356](https://github.com/carbon-design-system/carbon-components-svelte/commit/032c3562f674d70c3102a5f6368d66d35cfa71f8))
- **list-box:** keep a measured menu still when the reader takes over ([e87ba96](https://github.com/carbon-design-system/carbon-components-svelte/commit/e87ba96241de5d8946f0d26045ba3cc4c7e6b90d))
- **list-box:** keep measurements when the option list is rebuilt unchanged ([ffcf0ee](https://github.com/carbon-design-system/carbon-components-svelte/commit/ffcf0eeb057bb7e28880cb41da684dcdf217d596))
- **list-box:** stop stale DOM read from stranding the highlight class ([f4d0048](https://github.com/carbon-design-system/carbon-components-svelte/commit/f4d00482814a6ea0bbb06ce08dbe6ef1a2649bcb))
- **overflow-menu:** guard hover styles with any-hover ([b6b4659](https://github.com/carbon-design-system/carbon-components-svelte/commit/b6b4659a78d417cfffa9fd552b91bb5eaa722198))
- **pagination-nav:** guard hover styles with any-hover ([3f168b9](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f168b96f68d15a6cebc76b4cfef562202eb4420))
- **search:** prevent disabled expandable search from expanding (#3775) ([614c0d9](https://github.com/carbon-design-system/carbon-components-svelte/commit/614c0d9ec1947f0e3043a6c0622f6b2fabff730b))
- **selectable-tile:** remove hardcoded default title prop value ([0afc37a](https://github.com/carbon-design-system/carbon-components-svelte/commit/0afc37ac0808d9c3143a2b55275422d3aa187a10))
- **slider:** guard hover styles with any-hover ([573ee96](https://github.com/carbon-design-system/carbon-components-svelte/commit/573ee963e46843c75780f7a7dd6df7e6c26b4447))
- **structured-list-input:** remove hardcoded default title prop value ([3dec412](https://github.com/carbon-design-system/carbon-components-svelte/commit/3dec412979d5af0ab10f40c8aada63e2af21d5a0))
- **structured-list:** fill sortable button height under condensed ([894227a](https://github.com/carbon-design-system/carbon-components-svelte/commit/894227a8d177b5f333a39fdec1c3e7a8180edc4b))
- **structured-list:** guard hover styles with any-hover ([d686c1a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d686c1ae308df6f2512db45936a9e8a9f5ebd000))
- **tag:** guard hover styles with any-hover ([4c31b5c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4c31b5cb2e796c10d3e6cee4a464a7bbbb165cb2))
- **text-input:** guard hover styles with any-hover ([9f32d03](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f32d0343cb8e27fd9e8c0d0bfbade6f4b50770a))
- **tree-view:** guard hover styles with any-hover ([40e5d80](https://github.com/carbon-design-system/carbon-components-svelte/commit/40e5d800249f5371e5f2162e7a62e3668aeafc33))
- **ui-shell:** add bottom padding to side-nav items list (#3742) ([846dc2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/846dc2e06c0fe0a5ef929342361cbf0d5e82b8bf))
- **ui-shell:** guard hover styles with any-hover ([4db286e](https://github.com/carbon-design-system/carbon-components-svelte/commit/4db286e13fe4eaae1998410ebb01a9b04afdada1))

### Performance

- **css:** drop the vendored data-table's tr/th/td qualifiers ([7fd7246](https://github.com/carbon-design-system/carbon-components-svelte/commit/7fd724685d21a9cb028d532a020d027ae396e03d))
- **css:** drop the vendored UI Shell's a. qualifiers ([3bb14a6](https://github.com/carbon-design-system/carbon-components-svelte/commit/3bb14a60f11c2db9301e55b283e9a3fae177e395))
- **css:** flatten the remaining single-tag qualifiers and structured-list's block restatements ([e39b821](https://github.com/carbon-design-system/carbon-components-svelte/commit/e39b8211142e09ce8e5d3a101596f5f58d4f4675))
- **css:** flatten the vendored button's icon-only tooltip trigger compounds ([ee361d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/ee361d560c4217df42862495503afd5e0821fc3b))
- **css:** flatten the vendored link's inline and visited compounds ([4c81023](https://github.com/carbon-design-system/carbon-components-svelte/commit/4c810234c5f3dc1b32a6df2f836d09ecc7e0c9c6))
- **css:** fold twenty override partials into vendored Carbon ([34b4ef8](https://github.com/carbon-design-system/carbon-components-svelte/commit/34b4ef86582daea6c0492da48c02c62332247b8c))
- **css:** rewrite vendored tabs desktop-only, fold css/_tabs.scss in ([5cbb1a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/5cbb1a02185ef8114380aba422fd5e4c013d3228))
- **css:** theme vendored UI Shell in place, fold css/_ui-shell.scss in ([17ea554](https://github.com/carbon-design-system/carbon-components-svelte/commit/17ea55411cf66b23d228bcabddad31e487c7fcc0))

### [0.111.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.111.2...v0.111.3) (2026-10-07)

### Bug Fixes

- **tooltip-definition:** anchor the inline tooltip to its term ([13f493a](https://github.com/carbon-design-system/carbon-components-svelte/commit/13f493a57d7d7ea403cb1f412b61321a633308ab))

### [0.111.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.111.1...v0.111.2) (2026-09-25)

### Bug Fixes

- **package:** stop publishing sveld's parse cache ([3a60c5c](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a60c5ce786a5b30e64d4e8980515dbdd7322b48))

### [0.111.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.111.0...v0.111.1) (2026-08-23)

### Bug Fixes

- **checkbox:** propagate CheckboxGroup invalid/warn to child checkboxes ([dc2a8e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/dc2a8e8a7e3c7503623718e8bf236479fe2edc84))
- **clickable-tile:** fire click handler on Space, not just Enter ([4bbdd44](https://github.com/carbon-design-system/carbon-components-svelte/commit/4bbdd4468479117dc3fefe99cb85992c73669d23))
- **code-snippet:** respect disabled on the inline variant ([e56a53d](https://github.com/carbon-design-system/carbon-components-svelte/commit/e56a53d89d82b0f0f9f4de4782178b78c87db44a))
- **combo-box:** add role=alert to invalid state error message ([ada99eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/ada99eb81b71288487098767cc1233a091213ed2))
- **combo-box:** commit a keyboard-highlighted item on Tab ([ebfa579](https://github.com/carbon-design-system/carbon-components-svelte/commit/ebfa57970f8b1467cd3e99bf20dc4672d08dc8cf))
- **combo-box:** restore controlled selection label on non-matching blur ([dd4d89e](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd4d89eac1df5ab4767f9f68948ea9f2fd89fa01))
- **combo-box:** skip disabled items in typeahead suggestions ([5859ef7](https://github.com/carbon-design-system/carbon-components-svelte/commit/5859ef72fe37c88e12dd717c649e956b230d5605))
- **combo-box:** use aria-errormessage for invalid state ([7b85d67](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b85d67eeef910cdb67becb81030a39b4b2004f0))
- **composed-modal:** don't dismiss on a native select's orphaned mouseup (#3710) ([a1dec4c](https://github.com/carbon-design-system/carbon-components-svelte/commit/a1dec4c59113f0ceb3ccc604b953b0229cbb7f3c))
- **composed-modal:** scroll a newly-focused element out from under the scroll gradient ([a2d3ab1](https://github.com/carbon-design-system/carbon-components-svelte/commit/a2d3ab1b215fdd9c438f897e83adbe6ee0cf6275))
- **data-table-skeleton:** add missing medium size class (#3684) ([91008fa](https://github.com/carbon-design-system/carbon-components-svelte/commit/91008fa43d444ff450d263b3611127f7ecc1fb48))
- **data-table:** add horizontal scroll wrapper for wide tables ([6460d97](https://github.com/carbon-design-system/carbon-components-svelte/commit/6460d97bf0081999e23012500ac1c49e17ac9d2d))
- **data-table:** align expanded row content with checkbox/radio columns ([89cb52a](https://github.com/carbon-design-system/carbon-components-svelte/commit/89cb52afcf31b7ff5e343ac40e2011c49971edb6))
- **date-picker:** add role=alert to invalid state error message ([28b647a](https://github.com/carbon-design-system/carbon-components-svelte/commit/28b647a13cdfd6414c76b4b67fb7136c8c5dd4b9))
- **date-picker:** include weekday in calendar day aria-labels ([519d3b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/519d3b1e28f202482b8b3cffb896ded9da628f33))
- **date-picker:** link invalid/warn/helper text via aria-describedby ([ca236b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca236b65bf7aa354b2d2fc9a85adac559e0641ef))
- **date-picker:** use aria-errormessage for invalid state ([db1391a](https://github.com/carbon-design-system/carbon-components-svelte/commit/db1391a0ff0172c478596539c2882b571216f72a))
- **dropdown:** serialize selectedId via a hidden input ([05bf2a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/05bf2a885b8d2941575eac20e734fe28f2993b68))
- **file-uploader:** space the invalid icon from the close button (#3716) ([ac91fb1](https://github.com/carbon-design-system/carbon-components-svelte/commit/ac91fb101587754a782a7fcfb9a346abebf94035))
- **link:** make the visited prop force visited styling (#3688) ([107c3ac](https://github.com/carbon-design-system/carbon-components-svelte/commit/107c3ac7462f19a79644aa800b9c87a3e12fd309))
- **link:** use span for icon wrapper, block disabled clicks ([10362a9](https://github.com/carbon-design-system/carbon-components-svelte/commit/10362a967e3a996f1e04027b818d2adc2cdeea70))
- **list-box:** use singular clear label for exactly one selection ([6d51a3d](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d51a3dec0cb825295f7837595e1e08c8e21b068))
- **menu:** apply indented-content modifier to selectable/radio menu items ([b9d9aaa](https://github.com/carbon-design-system/carbon-components-svelte/commit/b9d9aaa1e6d40ce34a4b8426cbddf3236dafc78b))
- **menu:** close and return focus to the anchor on Tab, same as Escape (#3676) ([0ffd19a](https://github.com/carbon-design-system/carbon-components-svelte/commit/0ffd19a1aef12b06a910a0900ce85351d1e102f1))
- **menu:** give the checkmark its own column, separate from the icon ([d6aade3](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6aade3daf6d7242897615f71d49a6e7b415ec41))
- **menu:** indent every item's label when any sibling is selectable/radio ([2a9c7aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a9c7aa1aac373b1ae3bbe8a063f316cb5d65693))
- **menu:** move item title tooltip to the interactive element (#3677) ([62a30b9](https://github.com/carbon-design-system/carbon-components-svelte/commit/62a30b90cb7e685c7f6fb13cae5b14ca1e90bae5))
- **menu:** prevent mouse focus on disabled MenuItem ([caddb21](https://github.com/carbon-design-system/carbon-components-svelte/commit/caddb210aca226c076b730d9387840440f898377))
- **modal:** `hasScrollingContent` has bottom overflow gradient ([3b67d47](https://github.com/carbon-design-system/carbon-components-svelte/commit/3b67d47a9593ba56141518a83f1f6b6b009d5436))
- **modal:** close only the topmost stacked modal on Escape ([c0a2656](https://github.com/carbon-design-system/carbon-components-svelte/commit/c0a2656ed9006adfd412832e715bd09f52a51dc1))
- **modal:** don't dismiss on a native select's orphaned mouseup (#3710) ([b1f95aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/b1f95aae429b75c90245914d8d7e52aa28e50af5))
- **modal:** scroll a newly-focused element out from under the scroll gradient ([7ab7cb8](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ab7cb8579d2e73b16a92082f86b8b4d5f94f29a))
- **multi-select:** forward input event when filter is cleared via button ([f7f4dc6](https://github.com/carbon-design-system/carbon-components-svelte/commit/f7f4dc634170eadf44e472294bf2f0deccd71723))
- **multi-select:** forward rest props to the non-filterable trigger (#3700) ([0398cc1](https://github.com/carbon-design-system/carbon-components-svelte/commit/0398cc1ffa8411aa94b0ef68fbd6228801f78787))
- **multi-select:** scope select-all to the currently filtered items ([14a3adb](https://github.com/carbon-design-system/carbon-components-svelte/commit/14a3adb0cacadd269dbdf5ecdbf859b9a35a60eb))
- **multi-select:** serialize selection via hidden inputs, not the menu ([f3474ae](https://github.com/carbon-design-system/carbon-components-svelte/commit/f3474ae9fb8760949afa47fe22de6c4fa5628d07))
- **number-input:** block arrow-key value changes when readonly ([57c4de8](https://github.com/carbon-design-system/carbon-components-svelte/commit/57c4de8d3f261093b32b4c394d5dbc89acb736cd))
- **number-input:** default inputmode to decimal for type=number ([ed0ce12](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed0ce12032e56474a53b25152f4bd89257e15095))
- **number-input:** normalize non-Western digit glyphs before parsing ([5c9bcac](https://github.com/carbon-design-system/carbon-components-svelte/commit/5c9bcace3e78b283e0b0d4effc38247cdac0cfc2))
- **pagination:** add `pageSelectLabelText` prop (#3704) ([71f1695](https://github.com/carbon-design-system/carbon-components-svelte/commit/71f1695f07db132a86fcc2266694bc961c8ff1d6))
- **pagination:** add backward/forwardTextTooltipPosition props (#3705) ([9f0e168](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f0e168c0a4558fd4ab00f68275ce0571f0304fe))
- **pagination:** add pageSelect slot for custom page-selection UI ([f0db699](https://github.com/carbon-design-system/carbon-components-svelte/commit/f0db69990aae10207bdf3b2f4a037e831e2870f1))
- **pagination:** forward disabled to the page-size and page-number selects ([d81ec68](https://github.com/carbon-design-system/carbon-components-svelte/commit/d81ec68d042cb21ae0b3c0b547561b03107b0016))
- **pagination:** refocus the sibling nav button when one becomes disabled (#3669) ([6f95024](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f950246e1a04865a20ed7f711803df0d2adc243))
- **pagination:** show item count and nav buttons below md (#3719) ([0703214](https://github.com/carbon-design-system/carbon-components-svelte/commit/0703214cff0fd2d52938fc13874ab45db26055ff))
- **pagination:** sync pageSize when pageSizes drops the current value ([36b1936](https://github.com/carbon-design-system/carbon-components-svelte/commit/36b193694b8184af5af08bfc53e84eb448a14a94))
- **password-input:** add role=alert to invalid state error message ([bcc6787](https://github.com/carbon-design-system/carbon-components-svelte/commit/bcc6787967b04b70bbe4f2d748cef0cf1a97f837))
- **password-input:** use aria-errormessage for invalid state ([173f47d](https://github.com/carbon-design-system/carbon-components-svelte/commit/173f47d3b64fb4b84e1799fdecb3234dee5c5756))
- **popover:** ignore clicks on a portaled DatePicker calendar ([eb45645](https://github.com/carbon-design-system/carbon-components-svelte/commit/eb4564571bc73f983437ce96c01463a4a80b51e8))
- **progress-bar:** apply label-text class for truncation (#3717) ([9498eae](https://github.com/carbon-design-system/carbon-components-svelte/commit/9498eaec6150f88bc68dc565ac938ba3f400df18))
- **progress-indicator:** keep steps tabbable, use spans in buttons ([c954af2](https://github.com/carbon-design-system/carbon-components-svelte/commit/c954af232d79510a5ee0993e5a02fff2bf328a9d))
- **radio-button:** apply label-text class in readonly mode (#3718) ([fae44ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/fae44ede29f5bda5f837a6796b8589061f80d663))
- **search-menu:** prevent native Escape-clear from reopening the menu ([c21f105](https://github.com/carbon-design-system/carbon-components-svelte/commit/c21f105f2e2ef692c5c1d9fc85b58b9f6c18ea8f))
- **search:** hide collapsed expandable input from assistive tech ([ed88865](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed8886592fb53ac4d633e797bd003b6a4144d65d))
- **search:** use native type=search input ([0037688](https://github.com/carbon-design-system/carbon-components-svelte/commit/0037688fc33354e0f544c27b2f6f80d810150b67))
- **side-nav:** apply the fixed class so rail stops expanding on hover ([369b513](https://github.com/carbon-design-system/carbon-components-svelte/commit/369b513576e269bc40d9325703fd09f6f848fe44))
- **structured-list:** suppress hover highlight on selected row ([5664dd0](https://github.com/carbon-design-system/carbon-components-svelte/commit/5664dd03042ce727deda2dbbe95b738f97da2225))
- **tabs:** require >1px overflow before showing scroll buttons ([e143200](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1432005401e04e2ecd0330e0350b6b0065706fe))
- **text-area:** add role=alert to invalid state error message ([7ef1967](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ef1967e17f19631c9e7bbd636cd6e56fca753c2))
- **text-area:** use aria-errormessage for invalid state ([67baa5c](https://github.com/carbon-design-system/carbon-components-svelte/commit/67baa5c2da80e9a6523fcd3d42f197a3909cbaa3))
- **text-input:** position the fluid maxCount counter opposite the label (#3699) ([6726370](https://github.com/carbon-design-system/carbon-components-svelte/commit/67263708eb6f01537ad0ee2a759e7dcde7f9a422))
- **text-input:** use aria-errormessage for invalid state ([5863c62](https://github.com/carbon-design-system/carbon-components-svelte/commit/5863c629f32e735d0cc42609f91ca59a2b36e3e2))
- **time-picker:** suppress invalid/warn when disabled or readonly (#3670) ([0647694](https://github.com/carbon-design-system/carbon-components-svelte/commit/0647694068677ff7a7bcdb04e36a2a76cd6a0249))
- **toggle-tip:** resolve outside-click through shadow DOM boundaries ([23f0267](https://github.com/carbon-design-system/carbon-components-svelte/commit/23f0267457226f7b1c382029f4ffab524dc5772d))
- **toggletip:** stop closing on browser window blur ([f07217c](https://github.com/carbon-design-system/carbon-components-svelte/commit/f07217c93cfe00637090d430f036ec997ab873c3))
- **tooltip:** stop tooltip stacking and off-center caret (#3660) ([38fe5d4](https://github.com/carbon-design-system/carbon-components-svelte/commit/38fe5d4dd97ea76afadb43a23c836382f21c0a90))
- **ui-shell:** `HeaderPanelLink` supports `isSelected` prop ([966a6e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/966a6e9c5c53309ad29eb1bbb4a613863be5c69f))
- **ui-shell:** apply the current-page styling class on nav items (#3678) ([6b4fa5d](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b4fa5ded67466a1004c6eacc0c3e8e75fa2f134))
- **ui-shell:** wrap HeaderPanelDivider's hr in an li for valid list semantics ([afbbabc](https://github.com/carbon-design-system/carbon-components-svelte/commit/afbbabc2bf00c5beacf861a23e49b24aa5509edf))
- **utils:** keep outsideDismiss pressed state until an explicit outside press ([1f7b599](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f7b599d45010fe04e5ea89d2868cd21c1067849))

### Performance

- **combo-box:** add filterMode hide vs remove ([20084a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/20084a8755f69f758b87f2d28963e84933cd6abe))
- **combo-box:** apply highlight as a two-node class cursor ([c063b23](https://github.com/carbon-design-system/carbon-components-svelte/commit/c063b23b1d9a419787ab3582fddd3cdd031fe259))
- **content-switcher:** batch switch registration into a single store flush ([fc67705](https://github.com/carbon-design-system/carbon-components-svelte/commit/fc67705e1017957d81dfb7d81582f5700a70278b))
- **css:** prune selectors for classes the library never renders (#3715) ([315748a](https://github.com/carbon-design-system/carbon-components-svelte/commit/315748acf66abda1234164e0392ae29aac76ef5e))
- **data-table:** build cell records for the painted window only ([88bfddc](https://github.com/carbon-design-system/carbon-components-svelte/commit/88bfddcda417a10f87efe090698c641eed785c98))
- **data-table:** cache Intl.Collator for string column sorting ([89cbc1c](https://github.com/carbon-design-system/carbon-components-svelte/commit/89cbc1c0b23cb03bfd57fdf80f2d6683caaa8171))
- **dropdown:** apply highlight as a two-node class cursor ([74a1fce](https://github.com/carbon-design-system/carbon-components-svelte/commit/74a1fcec99b1a5fef9c2dc8442b48404bc232157))
- **list-box:** apply highlight as a two-node class cursor ([e372b9f](https://github.com/carbon-design-system/carbon-components-svelte/commit/e372b9f3973ea5a74e7374ed7e664a9337e0f1e2))
- **multi-select:** apply highlight as a two-node class cursor ([54fefdb](https://github.com/carbon-design-system/carbon-components-svelte/commit/54fefdb89d906fe864f69efff4df16c47476061d))
- **multi-select:** cache Intl.Collator for default item sorting ([2e790e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/2e790e8d3983dfceda1c8a725f4bfc1da6312168))
- **multi-select:** unmount the menu while closed ([e2bf986](https://github.com/carbon-design-system/carbon-components-svelte/commit/e2bf9869b4168ea50cf7c13104e283cda32b1854))
- **overflow-menu:** batch item registration into a single store flush ([9942c96](https://github.com/carbon-design-system/carbon-components-svelte/commit/9942c96359b87d8e0579e1c0cd0d0015418bd105))
- **pagination:** render page numbers as native options ([7ea9799](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ea97997bb57dd11c1f1383cb2063879cb80e264))
- **progress-indicator:** batch step registration into a single store flush ([fc737f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/fc737f8255470e7d283bcc9a294cbb385d15e533))
- **search-menu:** keep unmatched items mounted and hidden ([f5cddbd](https://github.com/carbon-design-system/carbon-components-svelte/commit/f5cddbd11ba6b9a70535d51c3b5dcbe00c76ec6e))
- **tabs-vertical:** batch tab/content registration into a single store flush ([d7aa2be](https://github.com/carbon-design-system/carbon-components-svelte/commit/d7aa2be033dc4696cdf1f8ee06e3c6c02d26e968))
- **tabs:** batch tab/content registration into a single store flush ([5428ecb](https://github.com/carbon-design-system/carbon-components-svelte/commit/5428ecb5e7563cdb652927db6e057434cc978856))
- **tag-set:** batch tag registration into a single store flush ([bac4024](https://github.com/carbon-design-system/carbon-components-svelte/commit/bac4024d1825cd1da2ff250aae308c8c6536c167))
- **tree-view:** mount collapsed subtrees lazily on first expansion ([eabe9c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/eabe9c3dcf22cdca70f53e4c212884bd1c962b95))
- **user-avatar-group:** batch avatar registration into a single store flush ([7f69d28](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f69d28cdad76ad8d239f8113ece09e8426960e7))

### [0.111.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.110.2...v0.111.0) (2026-08-14)

### ⚠ BREAKING CHANGES

- **context-menu-option:** a selectable or radio-group option no longer overwrites
`icon`/`indented` on the exported props; the checkmark and indentation
are now purely presentational and computed internally. ([7310270](https://github.com/carbon-design-system/carbon-components-svelte/commit/73102709cd256171e4f2633c086bd83fb45ff03c))
- **css:** The npm package no longer includes `css/**/*.scss` or
the vendored Carbon SCSS under `css/vendor/`. Import themes from
`carbon-components-svelte/css/*.css`. SCSS sources stay in the repo for
`bun build:css`. ([778952c](https://github.com/carbon-design-system/carbon-components-svelte/commit/778952c6a1f9b9d59ab8abb8626ec703ce779545))
- **data-table:** `bind:selectable` no longer flips to `true` when
`radio` or `batchSelection` is set; read `radio`/`batchSelection`
directly if you need that signal. ([b1f00c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/b1f00c434384433745dd57cefc723c4363715575))
- **multi-select:** name the non-filterable trigger by its field label (#3548) ([b8d626d](https://github.com/carbon-design-system/carbon-components-svelte/commit/b8d626dc719cd93c2deaf2a5642122a901b60f4e))
- **tag:** remove forwarded `on:click` event from non-interactive tags (#3540) ([64a2812](https://github.com/carbon-design-system/carbon-components-svelte/commit/64a281296ad859ccf3cbe5d0dc98f7b4ff37559a))

### Features

- **accordion-item:** add lazy prop to defer panel content mounting ([cb063d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb063d55c78d407d3e053c945aea4194cdfb066a))
- **accordion:** add `flush` alignment prop ([d47c174](https://github.com/carbon-design-system/carbon-components-svelte/commit/d47c174416edf02a0d8b2995d12a68e34f68cb9e)), closes [#1600](https://github.com/carbon-design-system/carbon-components-svelte/issues/1600)
- **accordion:** add single-open type ([f92912c](https://github.com/carbon-design-system/carbon-components-svelte/commit/f92912c62f06ba34c12c2487cf047dc21f7b6fa2))
- **checkbox:** add invalid and warn states ([6aff2c1](https://github.com/carbon-design-system/carbon-components-svelte/commit/6aff2c1c4ba3f9766c3d302fa7384bd83aff164a))
- **code-snippet:** configurable collapsed row counts ([b14d9bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/b14d9bcfb24d62bebfb6c3a00b470f469636562f))
- **code-snippet:** fall back to execCommand and surface copy errors ([7251d4e](https://github.com/carbon-design-system/carbon-components-svelte/commit/7251d4ef1206d32ba01d0679018d2e9e397a01c1))
- **combo-box:** emit scrollend near menu bottom ([92e58fe](https://github.com/carbon-design-system/carbon-components-svelte/commit/92e58fe3ef20e25f06774c25029dee4e3f551124))
- **composed-modal:** add `hideCloseButton` prop ([b620d33](https://github.com/carbon-design-system/carbon-components-svelte/commit/b620d33e7a80f53b99b8c09a2661eb75901ec10f))
- **composed-modal:** make secondary button close cancelable ([3eedabc](https://github.com/carbon-design-system/carbon-components-svelte/commit/3eedabcae4120d8dcfd22016d9ea9ac7c26d031a))
- **contained-list:** support href on ContainedListItem ([7e96a8f](https://github.com/carbon-design-system/carbon-components-svelte/commit/7e96a8f8f596352a5cbff39a238c5dcd8846f5e8))
- **content-switcher:** add selectedId for stable selection ([ac10989](https://github.com/carbon-design-system/carbon-components-svelte/commit/ac10989dd77e51c50e9df9eb108d3d0d993dfe4d))
- **copy-button:** fall back to execCommand and surface copy errors ([9aeb1e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/9aeb1e98b0ff4feda79433aa7d1d3b22fd8f1340))
- **copy-input:** fall back to execCommand and surface copy errors ([7a5dd9b](https://github.com/carbon-design-system/carbon-components-svelte/commit/7a5dd9b060b7c8c514fe7c87f7273897cdd94091))
- **data-table:** add `footerCell` slot and `TableFoot` ([8075a8a](https://github.com/carbon-design-system/carbon-components-svelte/commit/8075a8a7ee4e74b85bb8481d7fcfeba504577d5d))
- **data-table:** add `toCsv` utility ([f3ec6b9](https://github.com/carbon-design-system/carbon-components-svelte/commit/f3ec6b9002a6e93503ac1adfe85ada5a0af128de))
- **data-table:** support "shift+click" selection ([54aaa7d](https://github.com/carbon-design-system/carbon-components-svelte/commit/54aaa7d6d827877f7b0400728d1f698f0eacafa1))
- **data-table:** support hiding columns via `hidden` header flag ([b038bef](https://github.com/carbon-design-system/carbon-components-svelte/commit/b038bef76b7da7a294afd953c1baaadf66aa2b23))
- **data-table:** support per-column alignment ([7daa7b5](https://github.com/carbon-design-system/carbon-components-svelte/commit/7daa7b54c4238b9fa15d372faf03780dfa5a178c))
- **date-picker:** add year picker type ([4329af5](https://github.com/carbon-design-system/carbon-components-svelte/commit/4329af5dc3e5452c35d3f5ac6b5ed787738296cb))
- **dialog:** add close trigger detail and focus restore ([a342b6c](https://github.com/carbon-design-system/carbon-components-svelte/commit/a342b6ca5115378ec0e711f2279f19ff4c5fa07c))
- **dropdown:** add clearable selection ([d2885fa](https://github.com/carbon-design-system/carbon-components-svelte/commit/d2885fac8f0537519abc66fa288403c68bceb4f2))
- **dropdown:** emit scrollend near menu bottom ([57805b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/57805b14d638f07e5e94e9cb3feeea78d1abe9b1))
- **file-uploader-drop-container:** parity for size and duplicate rejection ([2b749ec](https://github.com/carbon-design-system/carbon-components-svelte/commit/2b749ec88e33cbf76404212a613263a857b06a06))
- **file-uploader:** support per-file status ([2501a37](https://github.com/carbon-design-system/carbon-components-svelte/commit/2501a3731d5aea2d51a3073cb365ff7ef246d718))
- **form:** add actions prop for use enhance ([095b5e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/095b5e5ee93a10c0ca4f2a5f8362a3e1893fd2cb))
- **form:** add disabled on FormGroup ([8adcfc0](https://github.com/carbon-design-system/carbon-components-svelte/commit/8adcfc0c6d6a52356359a24fbdb5a50037c0b7ab))
- **inline-notification:** add `pauseOnHover` ([3e027a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/3e027a144295b99c56df37bff0e24133e19cd0e7))
- **link:** add `LinkDownload` component ([22f5108](https://github.com/carbon-design-system/carbon-components-svelte/commit/22f5108647e1738e2e86c38ee8c5622338d6eb91))
- **list-box:** add scrollend near-end detection utility ([10104e6](https://github.com/carbon-design-system/carbon-components-svelte/commit/10104e6a706d956faff562ce036992f244a8ac92))
- **menu-button:** add `iconOnly` trigger variant ([96e1add](https://github.com/carbon-design-system/carbon-components-svelte/commit/96e1addab42bb075ae1bb052ca6ee503448b269c))
- **menu:** add maxHeight for scrollable menus ([046450f](https://github.com/carbon-design-system/carbon-components-svelte/commit/046450f086ba017c62c84e9c959c0889e9a21dd4))
- **menu:** add selectable and radio menu items ([5eeb0b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/5eeb0b44542ae314cef809ec7daca14aa960080f))
- **menu:** add shortcutText on MenuItem ([2257ee5](https://github.com/carbon-design-system/carbon-components-svelte/commit/2257ee520a41aa5f805b20cfbeef469bfcaf05c4))
- **modal:** add `hideCloseButton` prop ([cadab59](https://github.com/carbon-design-system/carbon-components-svelte/commit/cadab59bcc28e43ccfcafa247ad82ce8bd605f27))
- **modal:** add primaryButtonLoading for async submit ([29aa33c](https://github.com/carbon-design-system/carbon-components-svelte/commit/29aa33c2da3641e26ee68071011df93fa958468b))
- **modal:** widen `secondaryButtons` with kind and disabled ([0215a17](https://github.com/carbon-design-system/carbon-components-svelte/commit/0215a177b00ad83a94758c62543d27c7fd0bfe12))
- **multi-select:** add maxSelectedItems selection cap ([9a15ede](https://github.com/carbon-design-system/carbon-components-svelte/commit/9a15edef9bae1ea9354af751df2f63daeb7811b2))
- **multi-select:** announce filter result counts in the filterable variant (#3645) ([c780167](https://github.com/carbon-design-system/carbon-components-svelte/commit/c780167f7868c62f2e1161bcc955b52ca18ce6ad))
- **multi-select:** emit scrollend near menu bottom ([040a7d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/040a7d5e8976a7c6fea282b70b7d9945a246239e))
- **multi-select:** support shift+click range selection ([692d654](https://github.com/carbon-design-system/carbon-components-svelte/commit/692d654df2264b8bf9f94759e7f5f1a6dada1758))
- **notification-queue:** expand placements ([a46e424](https://github.com/carbon-design-system/carbon-components-svelte/commit/a46e424a2b52c0a25df3553f25e7189d57f70f24))
- **overflow-menu:** add `maxHeight` for scrollable menus ([fe6c656](https://github.com/carbon-design-system/carbon-components-svelte/commit/fe6c6565c2a52c7bc6bf864a82d7d752350c5740))
- **pagination:** add simple compact mode ([a26c414](https://github.com/carbon-design-system/carbon-components-svelte/commit/a26c414c6c5b53aa70d0f37eaa0494ad271f6d14))
- **pin-code-input:** add custom pattern ([8c97489](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c97489a9c5ee5e211dfbf1394714c61c85d69e4))
- **pin-code-input:** add name with hidden form input ([9796644](https://github.com/carbon-design-system/carbon-components-svelte/commit/9796644f8cb2e785e1bb7fe37af3507b6887a681))
- **pin-code-input:** distribute multi-char autofill input ([4d442d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/4d442d89a4211c72bc19745dcf5e46f9b6c07f9d))
- **progress-indicator:** add selectedId for stable selection ([16cbf02](https://github.com/carbon-design-system/carbon-components-svelte/commit/16cbf0239b8962ff6ee6f3dfd06de7d9c6371ad3))
- **range-slider:** add `formatValue` ([9b3b106](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b3b10610e2bf2f87a8706c5523e2cffa774f1e8))
- **range-slider:** add `marks` prop ([a1d25bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/a1d25bd5f4d9485448f8546e1dbfdc13fbbec9d2))
- **slider:** add `formatValue` ([4900126](https://github.com/carbon-design-system/carbon-components-svelte/commit/490012677dc82657e0c4e654a26c84db01dd1222))
- **slider:** add `marks` prop ([7ed9c52](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ed9c52a1521a33de79b0335e433ca23cd7503fe))
- **tabs:** add `selectedId` for stable selection ([c7223c2](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7223c264b92ed733aea2f470ef6d630af9c8aa8))
- **tabs:** add activation automatic or manual ([e1c50d0](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1c50d08ccc3f268b463aabb7f4fe50a57ad44e3))
- **tabs:** add lazy and unmountOnHide on TabContent ([035e7e6](https://github.com/carbon-design-system/carbon-components-svelte/commit/035e7e6e9909d26d538788b8901d02c1c6e76764))
- **tag:** add `maxWidth` truncation with tooltip ([e3d55fb](https://github.com/carbon-design-system/carbon-components-svelte/commit/e3d55fba58710d040a5a6af7ad1d3d566978603f))
- **tag:** support href ([1077c99](https://github.com/carbon-design-system/carbon-components-svelte/commit/1077c99bd6b0d1079c75860564d1c0fd40bf4610))
- **text-input:** add maxCount character counter ([d97bb5e](https://github.com/carbon-design-system/carbon-components-svelte/commit/d97bb5ee48710cd1ef737344cf98c365a35bb512))
- **toast-notification:** add `pauseOnHover` ([97173b8](https://github.com/carbon-design-system/carbon-components-svelte/commit/97173b89fc6a5b979c11a996d299fd8d9c4ac5c3))
- **tree-view:** add getNode/getNodes lookup accessors ([0b8a494](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b8a494e44f4c48b2ac2e87b105ad53119d7737f))
- **tree-view:** add tri-state checkbox selection mode ([dcb6b30](https://github.com/carbon-design-system/carbon-components-svelte/commit/dcb6b300e54c030bcbf8b02937b25d47682d261d)), closes [#1487](https://github.com/carbon-design-system/carbon-components-svelte/issues/1487)
- **tree-view:** add type-ahead search and aria-level/posinset/setsize (#3450) ([e24cf97](https://github.com/carbon-design-system/carbon-components-svelte/commit/e24cf97053dc9f9a92bb329441d7de6fbe1999e3))
- **tree-view:** support lazy loading via `hasChildren` + `childNodes` slot ([cbcec33](https://github.com/carbon-design-system/carbon-components-svelte/commit/cbcec33d4bc17398e4cd115c3daa8f23b26e1cf6))
- **tree-view:** support virtualization ([50261d7](https://github.com/carbon-design-system/carbon-components-svelte/commit/50261d78e3b9b29631093077daf79c586b739e20))
- **user-avatar:** add imageAttributes passthrough ([533579c](https://github.com/carbon-design-system/carbon-components-svelte/commit/533579c4bb87f6aefc9f96f23c96faa03bec4866))
- **user-avatar:** fall back when image fails to load ([c385b15](https://github.com/carbon-design-system/carbon-components-svelte/commit/c385b15eea6adb868d680111b4208da46763f61a))
- **user-avatar:** support interactive button and href ([7fae373](https://github.com/carbon-design-system/carbon-components-svelte/commit/7fae37355f77b4cc12b1958184d1f1ff0a2e0cce))

### Bug Fixes

- **accordion-item:** link header button to its content region (#3572) ([a0910af](https://github.com/carbon-design-system/carbon-components-svelte/commit/a0910af08e1fe8bdbe0cdccabd9d7e80b3a682cf))
- **accordion:** keep nested accordion items independently collapsible ([2f3c98e](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f3c98e0af74b7994133f041c2a67a4900fa4f0c)), closes [#1676](https://github.com/carbon-design-system/carbon-components-svelte/issues/1676)
- **code-snippet:** set aria-expanded on the show-more button (#3573) ([dc49776](https://github.com/carbon-design-system/carbon-components-svelte/commit/dc4977620b4aa8ac973a284e09c88f7a1b85b79c))
- **code-snippet:** update previous-state guard before dispatching ([acafcc7](https://github.com/carbon-design-system/carbon-components-svelte/commit/acafcc7c0b37e54f8de20c832f32aa4b9138bd57))
- **combo-box:** support Home/End keys in the open listbox ([9a0e78e](https://github.com/carbon-design-system/carbon-components-svelte/commit/9a0e78e7b28f1d9c2a9c50f21305ca50c33e64bc))
- **combobox:** stop option-click focus bounce, drop aria-owns ([0e4495c](https://github.com/carbon-design-system/carbon-components-svelte/commit/0e4495c9ec13287a7a8fd2d2f21c0abe316615f2))
- **composed-modal:** name the scrolling content region (#3577) ([8ad7258](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ad7258dc18756664122fcab918a18b81bb07168))
- **content-switcher:** prevent arrow keys from scrolling the page ([9f686de](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f686de932302fdd8df9ca26d35b3e171e8a5826))
- **context-menu-option:** stop clobbering the icon and indented props (#3582) ([7310270](https://github.com/carbon-design-system/carbon-components-svelte/commit/73102709cd256171e4f2633c086bd83fb45ff03c))
- **context-menu:** keep menu open on selection via preventDefault ([f1b1fd1](https://github.com/carbon-design-system/carbon-components-svelte/commit/f1b1fd11f3a432e600801db53696ec100a67f9d2))
- **context-menu:** restore focus to parent option when submenu closes (#3549) ([dc47b70](https://github.com/carbon-design-system/carbon-components-svelte/commit/dc47b70b66ce47cf117a0eddd75d2a2d7b05646c))
- **data-table:** fix tooltip link color in tables ([53e946d](https://github.com/carbon-design-system/carbon-components-svelte/commit/53e946d36560bd5f6fbb96a085b84615a783a953))
- **data-table:** label the selectable checkbox column header ([eee2a74](https://github.com/carbon-design-system/carbon-components-svelte/commit/eee2a7484be80d8909c1d3011baf02318b17d72f))
- **data-table:** label the table with its title and description (#3574) ([cbb969d](https://github.com/carbon-design-system/carbon-components-svelte/commit/cbb969d505717dee8170d34de8e2410f63070f4d))
- **data-table:** set aria-expanded on row expansion buttons (#3560) ([434f11c](https://github.com/carbon-design-system/carbon-components-svelte/commit/434f11c47889d60956ab10ef4f9cf1065f0dd4fc))
- **data-table:** stop clobbering the bound selectable prop (#3580) ([b1f00c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/b1f00c434384433745dd57cefc723c4363715575))
- **data-table:** unsubscribe toolbar search before resubscribing (#3567) ([181963d](https://github.com/carbon-design-system/carbon-components-svelte/commit/181963d372e85ad44c88294b3079d08512d1c8fb))
- **date-picker:** mark today in month view, matching day/year cells ([370f121](https://github.com/carbon-design-system/carbon-components-svelte/commit/370f12183102ef5c0a17222caf4b989a121125b8))
- **date-picker:** use layout viewport width for `portalMenu` right-align (#3644) ([bc46937](https://github.com/carbon-design-system/carbon-components-svelte/commit/bc469374fa96ac44748d623fe0c4bf74e47a3896))
- **date-picker:** use theme-aware color for current year, add aria-current ([c1cd181](https://github.com/carbon-design-system/carbon-components-svelte/commit/c1cd1817389a0488ae2df23215e5b046e7606d72))
- **dropdown,combobox:** keep disabled options in keyboard navigation (#3547) ([569ae1c](https://github.com/carbon-design-system/carbon-components-svelte/commit/569ae1ca8f0388b5b42cb0a55875dc349725b0e9))
- **dropdown,multi-select:** support Home and End keys in the open listbox ([f27c7e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/f27c7e9697e9dc3afc3456bab52e44c9e33c2f2e))
- **dropdown:** add keyboard clearing, announce cleared selection (#3643) ([c6e0fa7](https://github.com/carbon-design-system/carbon-components-svelte/commit/c6e0fa74c5c2d96032fa6dc237efe2c8ee9b07ce))
- **dropdown:** guard highlighted item lookup when items change while open (#3615) ([eb540f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/eb540f885d35707ee16a7144e64e5f8d447da6f5))
- **dropdown:** stop option-click focus bounce, add virtual aria attrs ([b8cf75c](https://github.com/carbon-design-system/carbon-components-svelte/commit/b8cf75c772fc6d885f72755b7193a2ee8004c918))
- **hamburger-menu:** set aria-expanded on the menu toggle (#3579) ([e31a1d3](https://github.com/carbon-design-system/carbon-components-svelte/commit/e31a1d37c1f11a1555ac7ba0f9f8d826665e82ce))
- **header-action:** add aria-expanded and close on Escape (#3552) ([0c7c956](https://github.com/carbon-design-system/carbon-components-svelte/commit/0c7c9564179893552405bf4be0964ea7a60260bf))
- **menu-item:** prevent ArrowLeft from scrolling the page when closing a submenu ([1c2305a](https://github.com/carbon-design-system/carbon-components-svelte/commit/1c2305a8f02c6eba7f9c4972a4a812da7853efb6))
- **menu:** keep menu open on selection via preventDefault ([0a716f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/0a716f8634160ee73080b29224b08890738dfd2e))
- **multi-select:** add keyboard clearing to the non-filterable variant, announce cleared selection (#3642) ([398bb39](https://github.com/carbon-design-system/carbon-components-svelte/commit/398bb391b2ae37d5614a615a570bafcf4841f06f))
- **multi-select:** keep disabled options in keyboard navigation (#3546) ([4a4dcbe](https://github.com/carbon-design-system/carbon-components-svelte/commit/4a4dcbe9ee8d855c88a221ab1f6507d04fcf6bf3))
- **multi-select:** make Space toggle the highlighted option, add Home/End (#3590) ([ff608c9](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff608c939de0ee071591aa010c0dec1024048a07))
- **multi-select:** name the non-filterable trigger by its field label (#3548) ([b8d626d](https://github.com/carbon-design-system/carbon-components-svelte/commit/b8d626dc719cd93c2deaf2a5642122a901b60f4e))
- **multi-select:** prevent page scroll on arrow keys in filterable read-only mode (#3641) ([473ef05](https://github.com/carbon-design-system/carbon-components-svelte/commit/473ef05082ff22f7673f3b7879bbdd4bfa731cf1))
- **multi-select:** resolve dangling `aria-describedby` for invalid and warn text (#3640) ([139abab](https://github.com/carbon-design-system/carbon-components-svelte/commit/139abab183afb1a8e73283af66354aa64cb71115))
- **multi-select:** set aria-setsize/aria-posinset on virtualized options ([56a3bfe](https://github.com/carbon-design-system/carbon-components-svelte/commit/56a3bfe3de4c7205cfc4b520a4790c95c3133a2b))
- **multi-select:** stop the option-click focus bounce, drop aria-owns ([9b7b027](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b7b027a0f82fe0eec1f268c42b93918ebe4a067))
- **pagination-nav:** emit 1-based page index from single overflow item (#3620) ([c50b9fe](https://github.com/carbon-design-system/carbon-components-svelte/commit/c50b9fe9a12ff424035350392867e5205dbd7aa1))
- **profile-menu:** align aria-haspopup with the panel's actual semantics (#3578) ([e4958e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/e4958e3fcb69cda928247f03fda903cc44379a89))
- **progress-indicator:** expose step state to assistive tech (#3569) ([1befca2](https://github.com/carbon-design-system/carbon-components-svelte/commit/1befca260e90e5335030734bd627e0b8216050e7))
- **range-slider:** prevent arrow/Home/End keys from scrolling the page ([b4679ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4679abf13c11d584c5e234498b6db0af212c3e3))
- **search:** update previous-state guard before dispatching ([d1adf09](https://github.com/carbon-design-system/carbon-components-svelte/commit/d1adf09864ce002c9f85479fc66ac8ab4dbd10a4))
- **side-nav:** close the overlay side nav on Escape (#3575) ([b7d1804](https://github.com/carbon-design-system/carbon-components-svelte/commit/b7d1804a26968d21d832a49559712cb5408719bb))
- **skeleton:** hide skeleton placeholders from assistive tech (#3576) ([d44e631](https://github.com/carbon-design-system/carbon-components-svelte/commit/d44e6316a9e7d2123bd38efb8c1ce5998cd02653))
- **slider:** guard thumb position when min equals max (#3616) ([dceae34](https://github.com/carbon-design-system/carbon-components-svelte/commit/dceae347f3fdbb5127169eaae4ff66930be5d92d))
- **slider:** prevent arrow/Home/End keys from scrolling the page ([24ee8f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/24ee8f9714c703198aa208e007adc141f848f4a6))
- **slider:** support Home and End keys (#3553) ([6ee3917](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ee39178baf8f70f4563d65c9b08ce04ed5a87f8))
- **structured-list:** scope focus style to selected row ([b2e036b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b2e036b888f9304d27cdda60efab21d59d65f147))
- **structured-list:** silence unused export warning on deprecated tabindex (#3451) ([d793ea5](https://github.com/carbon-design-system/carbon-components-svelte/commit/d793ea5ecd95b75ccd2a8250689f0c15d6039aee))
- **tabs:** link tabs to their panels with aria-controls (#3571) ([c33bdd7](https://github.com/carbon-design-system/carbon-components-svelte/commit/c33bdd7c11b8543abfa1080db6bbec555f6bc6d3))
- **tabs:** prevent arrow keys from scrolling the page ([aec04ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/aec04cacad696c783c8b44f3035c9982ab7d5666))
- **tag:** remove forwarded `on:click` event from non-interactive tags (#3540) ([64a2812](https://github.com/carbon-design-system/carbon-components-svelte/commit/64a281296ad859ccf3cbe5d0dc98f7b4ff37559a))
- **text-area:** associate helper text and character count with the textarea (#3570) ([913cd5e](https://github.com/carbon-design-system/carbon-components-svelte/commit/913cd5e010d6fc12807368118c5499fe74870c4d))
- **text-area:** count graphemes for maxCount, not UTF-16 units ([7196ba8](https://github.com/carbon-design-system/carbon-components-svelte/commit/7196ba88336729b3afeef5072b96f9f04d84f03b))
- **text-input:** count graphemes for maxCount, not UTF-16 units ([f00961a](https://github.com/carbon-design-system/carbon-components-svelte/commit/f00961a37289122825ec1ce0023ae2449fe7af7e))
- **toggletip:** update previous-state guard before dispatching ([83503f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/83503f07588a910f549747a856e9c6a69e5984cf))
- **toolbar-batch-actions:** announce selection count and manage focus on dismiss (#3563) ([051a92c](https://github.com/carbon-design-system/carbon-components-svelte/commit/051a92ca569a2731431e9ce140851f3f5bf99a9b))
- **tooltip-definition:** update previous-state guard before dispatching ([5cac056](https://github.com/carbon-design-system/carbon-components-svelte/commit/5cac05662ac0e8c2bd7ba74c3b2989c640ca1ef5))
- **tooltip-icon:** update previous-state guard before dispatching ([770833e](https://github.com/carbon-design-system/carbon-components-svelte/commit/770833e3a52e74557104f247b7b3e0cf42eb148d))
- **tooltip:** update previous-state guard before dispatching ([c7bb0e6](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7bb0e6dd3adaa72861e1d68d0eeb97cd0702af9))
- **tree-view:** dedupe `selectedIds` on Ctrl+A / range-select (#3612) ([672cc0d](https://github.com/carbon-design-system/carbon-components-svelte/commit/672cc0dc1543fa9180ed13ae5eb4e190fd71f1c0))
- **utils:** add graphemeCount for user-perceived character counts ([738743a](https://github.com/carbon-design-system/carbon-components-svelte/commit/738743af58f30dcc9a76b92579111381a8087815))
- **utils:** guard `getVisibleRange` against non-positive `itemHeight` (#3618) ([7545eb9](https://github.com/carbon-design-system/carbon-components-svelte/commit/7545eb9bce80c6d9b384aacfd1e2e067d138a590))
- **utils:** handle empty palette in `getAvatarBackgroundColor` (#3619) ([461c60f](https://github.com/carbon-design-system/carbon-components-svelte/commit/461c60f2b2c00467ba18a08d9b56c01dcbed141b))

### Performance

- **floating-portal:** pool window scroll/resize listeners ([5cd49e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/5cd49e7d0d167a75a51e307024d5cebc1a5b7e6e))
- **modal:** track open state reactively instead of `afterUpdate` (#3564) ([12d1f48](https://github.com/carbon-design-system/carbon-components-svelte/commit/12d1f4815b8777e0187503e9557f34005bf28c30))
- **multi-select:** gate filtered items on open and filterable (#3557) ([189c042](https://github.com/carbon-design-system/carbon-components-svelte/commit/189c042c6fd583ed3f2a811a54a6fe2888bc7752))
- **multi-select:** hoist regular items out of select-all map (#3565) ([660558b](https://github.com/carbon-design-system/carbon-components-svelte/commit/660558b426a91f7a4f7c405d9e409f1e8ce3558b))
- **overflow-menu:** avoid a second forced layout when positioning the menu (#3611) ([f553c04](https://github.com/carbon-design-system/carbon-components-svelte/commit/f553c046e5781e839d2eb0ca6e1085d067985ccc))
- **pagination-nav:** compute page window without full-length array (#3551) ([3d90f44](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d90f4417639529fa39dd5e58fe9d7043009415a))
- **tooltip:** reposition only when open or direction changes (#3559) ([c804864](https://github.com/carbon-design-system/carbon-components-svelte/commit/c804864587747a6709b60be7d5b804f9e48ffc17))
- **tree-view:** defer full flat index until expand APIs (#3630) ([2287bfe](https://github.com/carbon-design-system/carbon-components-svelte/commit/2287bfe19c4d0b84310dc8aab2229570966436df))
- **tree-view:** expand only expandable nodes (#3632) ([4de1562](https://github.com/carbon-design-system/carbon-components-svelte/commit/4de15625a6adddb7707bc4457b8bfc492995f482))
- **tree-view:** look up range-selected nodes via cached map (#3555) ([27c3aca](https://github.com/carbon-design-system/carbon-components-svelte/commit/27c3acad7b8c4d82195cffcba7fe8264cc15a156))
- **tree-view:** precompute sibling ids for auto-collapse (#3556) ([3b97328](https://github.com/carbon-design-system/carbon-components-svelte/commit/3b97328f64dfdba212bf7878bc8469485cbdf515))
- **tree-view:** resolve select-all nodes in one DOM query (#3554) ([8803ec1](https://github.com/carbon-design-system/carbon-components-svelte/commit/8803ec1d03d59b639dbcb65e3ea779af8be81f9c))
- **tree-view:** use set for selected lookup in dispatch payload (#3562) ([8b65ffc](https://github.com/carbon-design-system/carbon-components-svelte/commit/8b65ffced1abca8afcd057f7fe944094bb5a61dd))
- **utils:** avoid `getComputedStyle` per candidate in `trapFocus` (#3561) ([7d61466](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d614668ebc6af075d6e171ec8b9332b79b96586))



### [0.110.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.110.2...v0.110.3) (2026-09-25)

### Bug Fixes

- **package:** stop publishing sveld's parse cache ([6ce8ca3](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ce8ca312c03ac4da4c35717fcc2beaedf29307d))

### [0.110.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.110.1...v0.110.2) (2026-07-31)

### Bug Fixes

- **date-picker:** keep calendar portalled after reactive re-run (#3445) ([2b220ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/2b220baa4c2c107745cd4f09ae5719000aca2560)), closes [#3444](https://github.com/carbon-design-system/carbon-components-svelte/issues/3444)
- **date-picker:** resync flatpickr `allowInput` on readonly toggle (#3447) ([abb6297](https://github.com/carbon-design-system/carbon-components-svelte/commit/abb62972e77dde1b27245a536ecc1bfb118d127d))
- **multi-select:** prevent page scroll on Space in filterable read-only mode (#3438) ([2997fb1](https://github.com/carbon-design-system/carbon-components-svelte/commit/2997fb1e0b659b8d2aa1e31aa5be037a2beac62d))

### [0.110.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.110.0...v0.110.1) (2026-07-17)

### Bug Fixes

- **composed-modal:** fall back to title for the dialog's accessible name (#3428) ([636098d](https://github.com/carbon-design-system/carbon-components-svelte/commit/636098dccd96410bd062fdb8986e5e068fe5f1c0))
- **data-table:** label row checkboxes and fix expand column headers (#3424) ([1e9d588](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e9d58844c74004d9886971d3da3f08941c94635))
- **date-picker:** mark out-of-range calendar days as aria-disabled (#3425) ([814400a](https://github.com/carbon-design-system/carbon-components-svelte/commit/814400aecdd75e1e0ef7d156a2e8f87ba3ff1cd0))
- **multi-select:** hide decorative option checkbox via CSS (#3430) ([56df9fe](https://github.com/carbon-design-system/carbon-components-svelte/commit/56df9fe205b78654ad8ea3e530ecbdbc0b034cac))
- **multi-select:** stop option checkboxes from being independently focusable (#3421) ([113ed03](https://github.com/carbon-design-system/carbon-components-svelte/commit/113ed03cd7e16fe3d06222b63fc28909b973e66f))
- **select:** restore placeholder when options change with nothing selected (#3437) ([926dc15](https://github.com/carbon-design-system/carbon-components-svelte/commit/926dc159a0568afce11853863d5e9bff9e61164b))
- **selectable-tile:** `SelectableTile` does not use incorrect `role="checkbox"` (#3427) ([e5a9c2c](https://github.com/carbon-design-system/carbon-components-svelte/commit/e5a9c2c9e54059e4d1bd68e8191e3ff82eebc34b))
- **structured-list:** import inline `CheckmarkFilled` icon ([f285ce1](https://github.com/carbon-design-system/carbon-components-svelte/commit/f285ce13bc94ef20cbacec4a5ba148ab46fbe8cf)), closes [#3434](https://github.com/carbon-design-system/carbon-components-svelte/issues/3434)
- **structured-list:** move radio/checkbox role off selectable row (#3431) ([cfb019c](https://github.com/carbon-design-system/carbon-components-svelte/commit/cfb019c461d1ccc6e97a1b8b830ff2a6095f39aa))
- **structured-list:** stop mixing table and radio/checkbox ARIA roles (#3420) ([881d19d](https://github.com/carbon-design-system/carbon-components-svelte/commit/881d19dbe6589ce1e6b6d9c2296db50c96b29b4c))
- **tabs:** remove tabindex from the presentational `<li>` wrapper (#3422) ([3f93599](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f935997c392dbc303493a1563ffc755a1dc8509))
- **tooltip:** default `iconDescription` is "Show information" (#3423) ([1941df8](https://github.com/carbon-design-system/carbon-components-svelte/commit/1941df8f49aa1bd840558b1b50165796ab6b0c1f))
- **ui-shell:** stop `HeaderSearch` referencing non-existent menu id (#3426) ([a523ed3](https://github.com/carbon-design-system/carbon-components-svelte/commit/a523ed3b95526ea9e9f775e7e743fc006f673b92))

### [0.110.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.109.0...v0.110.0) (2026-07-10)

### ⚠ BREAKING CHANGES

- **code-snippet:** CodeSnippet now renders the "Copied!" feedback in a
body-level portal by default instead of the inline `.bx--copy-btn__feedback`
caret. Pass `portalTooltip={false}` to restore the previous inline markup. ([51f3d6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/51f3d6a8d99e0585d1cf3802338c977c293c4100))
- **copy-button:** CopyButton/CopyInput now render the "Copied!" feedback in
a body-level portal by default instead of the inline `.bx--copy-btn__feedback`
caret. Pass `portalTooltip={false}` to restore the previous inline markup. ([27e2ef9](https://github.com/carbon-design-system/carbon-components-svelte/commit/27e2ef922ce99898e4e6259bcb09350f680914db))
- **floating-portal:** change `lockDirection` to enum ([787404b](https://github.com/carbon-design-system/carbon-components-svelte/commit/787404bd5c7c93ded41a01060eb0c20566074db5))
- **structured-list:** selection rows now render the icon column automatically;
remove any manually placed checkmark cell to avoid a duplicate. ([9785256](https://github.com/carbon-design-system/carbon-components-svelte/commit/9785256010e7ffc55903f33154fb3c50435d5df6))
- **tabs:** replace mobile dropdown with scrollable overflow tabs ([17c6c59](https://github.com/carbon-design-system/carbon-components-svelte/commit/17c6c59c4d79660039fca0ccec54d19e001eb54f)), closes [#3325](https://github.com/carbon-design-system/carbon-components-svelte/issues/3325)
- **ui-shell:** do not animate `HeaderAction` panel by default ([64a584f](https://github.com/carbon-design-system/carbon-components-svelte/commit/64a584f2977efe6fb17f3c7ae13ba576d450682b))

### Features

- **breakpoint:** add hideAtBreakpoint action ([3bbcff2](https://github.com/carbon-design-system/carbon-components-svelte/commit/3bbcff2986147824ac9bc886c733fe7d63fb89cb))
- **button:** forward on:mousedown, skip tooltip when iconDescription is empty ([5d35cdc](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d35cdc2474c147ff5a5dfb18b11bb5f05690084))
- **code-snippet:** add mask gradient for single/multi-line variants (#3343) ([22ec08b](https://github.com/carbon-design-system/carbon-components-svelte/commit/22ec08babbb0bebd5f6a9df28934c336b35e537e))
- **code-snippet:** portal the feedback tooltip by default ([51f3d6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/51f3d6a8d99e0585d1cf3802338c977c293c4100))
- **code-snippet:** support tooltipPosition and tooltipAlignment ([35ccb7f](https://github.com/carbon-design-system/carbon-components-svelte/commit/35ccb7f031ee17c02eccb9fe3ecc5580ab950bd0))
- **combo-box:** accept inline typeahead suggestion in place on Right/End ([9492ff9](https://github.com/carbon-design-system/carbon-components-svelte/commit/9492ff93c639fb4fe08b72b71b7c3e01bbf0666c))
- **combo-box:** accept typeahead suggestion on focus out ([67cf88c](https://github.com/carbon-design-system/carbon-components-svelte/commit/67cf88c5267374a8c9fb272f7e2c3fb331653310))
- **combo-box:** add xs size ([3bddd31](https://github.com/carbon-design-system/carbon-components-svelte/commit/3bddd313860b47601e9aeb94e437544fb6b7314c))
- **combo-button:** add `ComboButton` component ([66334af](https://github.com/carbon-design-system/carbon-components-svelte/commit/66334af68050da9fd25894ad3a962a3209a7f301)), closes [#2488](https://github.com/carbon-design-system/carbon-components-svelte/issues/2488)
- **copy-button:** add ghost kind, sizes, and a hover tooltip ([b3c30a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/b3c30a85c6663e8153a71ae4794fef6a0d8d99d5))
- **copy-button:** portal the feedback tooltip by default ([27e2ef9](https://github.com/carbon-design-system/carbon-components-svelte/commit/27e2ef922ce99898e4e6259bcb09350f680914db))
- **copy-input:** add tooltip position and alignment ([f057186](https://github.com/carbon-design-system/carbon-components-svelte/commit/f057186285d28f5a75bfe11e67dfe4ae54eb0646))
- **date-picker:** add "month" type ([9f833b2](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f833b2b86ec21fa8814af2b3200235b6d44e699)), closes [#976](https://github.com/carbon-design-system/carbon-components-svelte/issues/976)
- **dialog:** add `Dialog` component ([56cba4d](https://github.com/carbon-design-system/carbon-components-svelte/commit/56cba4d4bb445b9ce9224c4fccdab029e91ef510))
- **disclosure:** add `Disclosure` component ([f8ebc2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8ebc2a9e8fb4233e7191f4879017e7bd2da7be4))
- **dropdown:** add xs size ([7841161](https://github.com/carbon-design-system/carbon-components-svelte/commit/78411618b9b7ff27ae0cfa32723139bb090373c4))
- **header-search:** support closeButtonLabelText prop ([98582a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/98582a89d1f49cb0b48b2ee1d88742263b2189a6))
- **header-search:** support icon prop override ([31eaee4](https://github.com/carbon-design-system/carbon-components-svelte/commit/31eaee44ff9c69201b41d8e491b5629d2fd5b377))
- **header-search:** support labelText prop ([c69776c](https://github.com/carbon-design-system/carbon-components-svelte/commit/c69776cd26824e30541475f9679e48c1c593d9fc))
- **header-search:** support placeholder prop ([745e7df](https://github.com/carbon-design-system/carbon-components-svelte/commit/745e7df67bce24e202ec89abad765af4a5bc45fd))
- **icon-indicator:** add `IconIndicator` component ([514a18f](https://github.com/carbon-design-system/carbon-components-svelte/commit/514a18f3676bd3502f877c192a3bcead3c40cc71))
- **link:** add muted variant that inherits text color ([c540235](https://github.com/carbon-design-system/carbon-components-svelte/commit/c5402355d27a942b3aa7fca49bf8141858f955b0))
- **link:** make medium size explicit ("md") ([8332ba2](https://github.com/carbon-design-system/carbon-components-svelte/commit/8332ba20b83f15c02dcf9baabd5b50165b6e154c))
- **link:** scale icon and tighten gap to match link size ([6d53da4](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d53da4dcff96d7c94b2757c72f6f1c30a6418fe))
- **list-box:** add xs size ([9cd97eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/9cd97eb1709819ccfa35d2ee2ad458600757c403))
- **menu-button:** add MenuButton component ([a23150a](https://github.com/carbon-design-system/carbon-components-svelte/commit/a23150a3593bc8f9ec927f06f91e3d9f115413be)), closes [#2489](https://github.com/carbon-design-system/carbon-components-svelte/issues/2489)
- **menu:** add `Menu` and `MenuItem` primitives ([d845af4](https://github.com/carbon-design-system/carbon-components-svelte/commit/d845af4d57b6570e69d4d44719f030f10bf2b20e))
- **multi-select:** add xs size ([a59624e](https://github.com/carbon-design-system/carbon-components-svelte/commit/a59624ea4fb312f92d46e8b8f783755e34172e62))
- **search-menu:** add `SearchMenu` ([577bca5](https://github.com/carbon-design-system/carbon-components-svelte/commit/577bca5fa6d1f76712298baf1183eadbec0bcf73))
- **shape-indicator:** add `ShapeIndicator` component ([682b512](https://github.com/carbon-design-system/carbon-components-svelte/commit/682b51207725d33b1ebf36c9cd063adf16e4975a))
- **tabs-vertical:** add `TabsVertical` component ([02bbd96](https://github.com/carbon-design-system/carbon-components-svelte/commit/02bbd96f3ee7a99b27e068b350868b17c3bc8ec4)), closes [#2726](https://github.com/carbon-design-system/carbon-components-svelte/issues/2726)
- **tabs-vertical:** add `TabsVerticalSkeleton` ([c6a1082](https://github.com/carbon-design-system/carbon-components-svelte/commit/c6a1082193c9edf0c209a54d2eb83f600fc0d22b))
- **tabs:** `TabsVertical` supports sm/md/lg sizes ([77edafd](https://github.com/carbon-design-system/carbon-components-svelte/commit/77edafdae1b38e48386ebf5c5a01b36b64b5550d))
- **tag-set:** add `TagSet` component ([c59fe9f](https://github.com/carbon-design-system/carbon-components-svelte/commit/c59fe9f62b206f217af6346ecb6e33724a3bdc1e))
- **toggletip:** add `Toggletip` ([146fa3e](https://github.com/carbon-design-system/carbon-components-svelte/commit/146fa3e6fe55489af339548a69478200afebcc29)), closes [#3371](https://github.com/carbon-design-system/carbon-components-svelte/issues/3371)
- **tree-view:** add `select:change` aggregate selection event ([cc4a813](https://github.com/carbon-design-system/carbon-components-svelte/commit/cc4a81307f16f36dfee3e61dbb5960c17451886b))
- **tree-view:** add `toggle:change` aggregate expansion event ([f5c665b](https://github.com/carbon-design-system/carbon-components-svelte/commit/f5c665bf0c7c38a7076d7d102e743ca1b569b917))
- **ui-shell:** `HeaderNavItem` supports icon ([5f0e93f](https://github.com/carbon-design-system/carbon-components-svelte/commit/5f0e93f1b0a0cde3ad45917da4941c4efaad818b))
- **ui-shell:** `HeaderSearch` supports `SearchMenu` composition ([c061221](https://github.com/carbon-design-system/carbon-components-svelte/commit/c0612210ff427f0e78b48b16fcf74eadbda2413e))
- **ui-shell:** add `ProfileMenu` ([2552a6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/2552a6a1ae2b475346a3b1891b0db729dc28b670))
- **user-avatar-group:** add `UserAvatarGroup` ([b61c7c7](https://github.com/carbon-design-system/carbon-components-svelte/commit/b61c7c7862ad3ee006ba661dc97bd5e72c2d03bf))
- **user-avatar:** add `UserAvatar` ([61c6de5](https://github.com/carbon-design-system/carbon-components-svelte/commit/61c6de541a4207a4e784a951d50f86c2e8a2bf6a))
- **user-avatar:** add auto background color ([95c0390](https://github.com/carbon-design-system/carbon-components-svelte/commit/95c03904b103ac1c3a7ef820f463e8d9a1bcd1c1))

### Bug Fixes

- **code-snippet:** multi-line variant dynamically shows expand button based on content height ([0f0dce8](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f0dce82dd38886ec5be05b7ec9d9a1c43c946c8))
- **combo-box:** decouple hover highlight from Enter selection ([c3ec9a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/c3ec9a0d4233a398fc0c88658b363229d90bca74))
- **combo-box:** only inline-complete typeahead on a prefix match ([7345732](https://github.com/carbon-design-system/carbon-components-svelte/commit/73457328abb7772670831bc944f975b4b2b91ddc))
- **combo-box:** preserve displayed selection across async items changes ([701382e](https://github.com/carbon-design-system/carbon-components-svelte/commit/701382eee7a6932652cad74df08e95e03d67c361))
- **combo-box:** set aria-autocomplete to "both" with typeahead ([0b99228](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b99228a2efa18ed29861c42d20e062a5e6e5d55))
- **dropdown:** decouple hover highlight from Enter selection ([47665df](https://github.com/carbon-design-system/carbon-components-svelte/commit/47665dfc74dccefcab8298d771e91f0b242a8b12))
- **dropdown:** prevent page scroll when opening menu with Space (#3346) ([00f87c7](https://github.com/carbon-design-system/carbon-components-svelte/commit/00f87c7c848807bbeb142d115904154feb8b00d2))
- **floating-portal:** change `lockDirection` to enum ([787404b](https://github.com/carbon-design-system/carbon-components-svelte/commit/787404bd5c7c93ded41a01060eb0c20566074db5))
- **floating-portal:** keep a flipped tooltip side stable across content resize ([f108385](https://github.com/carbon-design-system/carbon-components-svelte/commit/f108385277c0b7fa979cdc67143cec93b53d69bb))
- **floating-portal:** keep the tooltip caret on the anchor when content resizes ([a11d65c](https://github.com/carbon-design-system/carbon-components-svelte/commit/a11d65ca2ce00466e7ff3b220d1468aee93fa98d))
- **list-box:** scope highlighted-item scroll to the menu, not the page ([1f91144](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f91144eb8da5ad6a9835b098dc559280fe72fd3))
- **multi-select:** decouple hover highlight from Enter selection ([01c14e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/01c14e80cf6c1c23a0e629c81808b81baac3549f))
- **multi-select:** make read-only reviewable, drop disabled semantics (#3359) ([f7a67f5](https://github.com/carbon-design-system/carbon-components-svelte/commit/f7a67f5bc96435a25d60798debebbde0736b4804))
- **multi-select:** retain selectedIds when items list clears ([5d59f81](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d59f81daab91893087ba3f09a55800cbb3ca9e8))
- **select:** re-assert native value when an option unmounts (#3392) ([4a2c722](https://github.com/carbon-design-system/carbon-components-svelte/commit/4a2c72288d8a21e5fe489d042fc72d2ae7eb7097))
- **select:** re-assert native value when options mount async ([9e60780](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e60780fe89b51a8a13e0c041e5cb886418cfca2))
- **tooltip:** give the interactive tooltip dialog an accessible name ([647e7c7](https://github.com/carbon-design-system/carbon-components-svelte/commit/647e7c73825fd2d2412cb3b505f45ba194208fee))
- **tooltip:** keep mouse hover from stealing focus into TooltipFooter ([ee54b73](https://github.com/carbon-design-system/carbon-components-svelte/commit/ee54b734fb0b24f5b0ed62173bc3e6e06a6b8252))
- **tree-view:** dispatch select/toggle/focus with correct state ([187c9d0](https://github.com/carbon-design-system/carbon-components-svelte/commit/187c9d08f666614b5d09a2facdee4bfe0758d7db))
- **ui-shell:** do not animate `HeaderAction` panel by default ([64a584f](https://github.com/carbon-design-system/carbon-components-svelte/commit/64a584f2977efe6fb17f3c7ae13ba576d450682b))
- **utils:** defer dismiss() window listener registration past the enabling click ([f411e26](https://github.com/carbon-design-system/carbon-components-svelte/commit/f411e26b56d25ecdecb3d2fcd77ed9229fa9cb6c))

### Performance

- **data-table:** use Set for O(1) lookups for expanded rows (#3352) ([5be5d13](https://github.com/carbon-design-system/carbon-components-svelte/commit/5be5d13e98b8e5b2c0db8c7ba58707d87720e672))

### [0.109.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.108.0...v0.109.0) (2026-06-15)

### ⚠ BREAKING CHANGES

- **accordion-item:** rename `iconDescription` to `ariaLabel` for heading button ([72431ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/72431ea3d8e09ee1d1193d9fdc9866354daf724b))
- **css:** drop older browser support (match Svelte 5 baseline) for ~7% size decrease (#3235) ([3f9e29b](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f9e29bf051c582ededbb418bad050697ab8ed6d))

### Features

- **badge-indicator:** add `BadgeIndicator` ([f5959b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/f5959b600d6a6e6a8a444b5c7b2c820c50bcfb30))
- **box:** add Box component and utility container classes ([8e15cc9](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e15cc92b4bf47741dbfc02e38b3c0f6e328f75f))
- **button:** add `badge` slot to compose `BadgeIndicator` with icon-only button ([7df0a82](https://github.com/carbon-design-system/carbon-components-svelte/commit/7df0a82d46c3f2001764109aa59d9ae9c6ac536e))
- **button:** support `portalTooltip` ([df3454c](https://github.com/carbon-design-system/carbon-components-svelte/commit/df3454c2303043169e802e1db0553098e8d66166))
- **code-button:** add `ref` prop for button reference ([0ae19ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/0ae19ad1e15a42dc8bae0b9f2bb44df7fa029985))
- **code-snippet:** add `codeLabel` prop for container aria-label (#3188) ([b242f5b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b242f5b362d7e8f7b0a070b32be38cda34f5394c))
- **code-snippet:** add `copyRef` prop for copy button reference ([fbf202a](https://github.com/carbon-design-system/carbon-components-svelte/commit/fbf202a0c7497f0c49e9ab356e279f4611ef1106))
- **combo-box:** add `fluid` prop for fluid form support ([6b883af](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b883af8e1d5b77c85a232dc511218fb5a81d92b))
- **combo-box:** add `icon` and `iconRight` ([25493ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/25493ca1e9342403f7fd11ac6552035376b377b4))
- **combo-box:** add FluidComboBoxSkeleton component ([5d8bd6f](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d8bd6f123657b9143c2fb0a76e2963962a6b846))
- **combo-box:** dispatch `close` event with dismissal `trigger` (#3313) ([9c10f17](https://github.com/carbon-design-system/carbon-components-svelte/commit/9c10f1707da3468010dc6d4b5a390eff5a220637))
- **combo-box:** pass `selected` and `highlighted` to default slot ([8e5068f](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e5068f7f53f0ed2afbecae6138ef11d78f17341))
- **composed-modal:** add "programmatic" close trigger ([4a8cc29](https://github.com/carbon-design-system/carbon-components-svelte/commit/4a8cc290fae6152884c1d42488bb532c3895b5a7))
- **composed-modal:** add `fullWidth` prop ([b07213a](https://github.com/carbon-design-system/carbon-components-svelte/commit/b07213af1f5ee47ac0d267180fafb4a626c1f7b8))
- **content-switcher:** `Switch` supports icon-only variant ([91458e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/91458e83c9457a9bb0bb0aed9abe5e55cf4a8840)), closes [#2758](https://github.com/carbon-design-system/carbon-components-svelte/issues/2758)
- **content-switcher:** support icon-only, low contrast variant ([4bbe2e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/4bbe2e3de9c8ec10289f9f2712e5de39ed3a9196))
- **content-switcher:** support low contrast variant ([c0f3fec](https://github.com/carbon-design-system/carbon-components-svelte/commit/c0f3fec599994693ed56f0736f21672f0c0e851b)), closes [#2759](https://github.com/carbon-design-system/carbon-components-svelte/issues/2759)
- **context-menu:** `close` event surfaces dismissal `trigger` (#3309) ([51e05bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/51e05bc626c87d50cb201d0e7878c3330b283de3))
- **copy-input:** add `CopyInput` ([3cda4e1](https://github.com/carbon-design-system/carbon-components-svelte/commit/3cda4e1d090bb86ec9bd02e67f59e3566091bde4))
- **copy-input:** add `fluid` prop for fluid form support ([1a3da64](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a3da6420e4aabbc302f87873d6850f6f1940f05))
- **copy-input:** add FluidCopyInputSkeleton component ([9288ab0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9288ab0b6f4b10631d81937c48b6c87215798281))
- **data-table:** add `highlightedRowIds` ([ec97d3b](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec97d3bb744850d021323122c66a04c7d2b45b07))
- **data-table:** add `stickyHeaderMaxHeight` prop for sticky header ([cfd5447](https://github.com/carbon-design-system/carbon-components-svelte/commit/cfd54471e638b697316549f15b81fe415d56f1e9)), closes [#1697](https://github.com/carbon-design-system/carbon-components-svelte/issues/1697)
- **data-table:** add filterMode="hide" to preserve row state while filtering ([a81d64e](https://github.com/carbon-design-system/carbon-components-svelte/commit/a81d64ec9fe73c73ebc6ec31aaa7ab1ee3b5fde0))
- **data-table:** add refreshRow/refreshCells to re-derive cells after in-place edits ([0b7e503](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b7e50376de8dabbead271a84f208f49694b734f))
- **data-table:** inherit `Toolbar` size from parent `DataTable` ([5edbc03](https://github.com/carbon-design-system/carbon-components-svelte/commit/5edbc03eb82c6346c75d1818e1a2382a97017863))
- **date-picker:** `close` event surfaces dismissal `trigger` ([e1a876b](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1a876b28162b23bc9ebc1bee1c56c9b61dc8817))
- **date-picker:** add `fluid` prop for fluid form support ([e088bed](https://github.com/carbon-design-system/carbon-components-svelte/commit/e088bed0b5047ed9b534f59e9fe810992c1739e0))
- **date-picker:** add FluidDatePickerSkeleton component ([ac7eede](https://github.com/carbon-design-system/carbon-components-svelte/commit/ac7eede840b85fea0445cac2edacd974a140ee77))
- **dropdown:** add `fluid` prop for fluid form support ([d8c85eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8c85eb00015fbb18b0ddb7c5598d8bf236c3722))
- **dropdown:** add `icon` and `iconRight` ([8b32baf](https://github.com/carbon-design-system/carbon-components-svelte/commit/8b32bafebac23f67761a1cf0a7266b1ab8276171))
- **dropdown:** add FluidDropdownSkeleton component ([3d84cfd](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d84cfde4c604b829599fdd9f2680a8764912bc7))
- **dropdown:** dispatch `close` event with dismissal `trigger` (#3312) ([47798ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/47798ba9ebc7899b83c292485a5bac8a3a48223e))
- **dropdown:** pass `selected` and `highlighted` to default slot ([11bd316](https://github.com/carbon-design-system/carbon-components-svelte/commit/11bd316a2d8f4d51822246a19f44b176baecc4f7))
- **expandable-tile:** forward focus/blur events (#3174) ([a2f2cd0](https://github.com/carbon-design-system/carbon-components-svelte/commit/a2f2cd0a9c9dcce993a7d1612ddc6581e3828982))
- **file-uploader-drop-container:** dispatch `rejected` event (#3187) ([ec7a0eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec7a0ebc21d952287789b0df3f917662fb3566dd))
- **file-uploader-skeleton:** add `hideLabelTitle` and `hideLabelDescription` props ([9dc56d3](https://github.com/carbon-design-system/carbon-components-svelte/commit/9dc56d3d7df2295a73cc177c765fd2c8d69f9948))
- **header-search:** pass `selected` to result slot ([41bcab1](https://github.com/carbon-design-system/carbon-components-svelte/commit/41bcab1f3cd738394f6a2a058b1c57450ccc0a76))
- **local-storage:** add `sync` prop to opt out of storage event sync ([303b193](https://github.com/carbon-design-system/carbon-components-svelte/commit/303b193ff9f74e853600afa71ac664d967272143))
- **modal:** add "programmatic" close trigger ([e85b563](https://github.com/carbon-design-system/carbon-components-svelte/commit/e85b5636989c20a8f41fc23b7f1ceda9a57a43c7))
- **modal:** add `fullWidth` prop ([16fce32](https://github.com/carbon-design-system/carbon-components-svelte/commit/16fce32aa7f23c036d636018293d7e5622da6c6a))
- **multi-select:** add `fluid` prop for fluid form support ([d84c56e](https://github.com/carbon-design-system/carbon-components-svelte/commit/d84c56eb24d2892c276cda69f60a204aba77d64e))
- **multi-select:** add FluidMultiSelectSkeleton component ([22eba4c](https://github.com/carbon-design-system/carbon-components-svelte/commit/22eba4c91582ba622960324fe772a1c650ac2e5a))
- **multi-select:** dispatch `close` event with dismissal `trigger` (#3314) ([789ee5f](https://github.com/carbon-design-system/carbon-components-svelte/commit/789ee5fbf7edace42ffcaa34bca1b0455ce278a2))
- **multi-select:** pass `selected` and `highlighted` to default slot ([6da1395](https://github.com/carbon-design-system/carbon-components-svelte/commit/6da139548ccd94df063dab22d12b84d7458e7e27))
- **number-input:** add `fluid` prop for fluid form support ([afff038](https://github.com/carbon-design-system/carbon-components-svelte/commit/afff038f451116c0750964021ccdb48377542f02))
- **number-input:** add FluidNumberInputSkeleton component ([0f3031b](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f3031ba2e4b82a7a95540e0e2ff66cf2d3f0bdc))
- **overflow-menu-item:** support `icon` and `iconRight` ([a3e794e](https://github.com/carbon-design-system/carbon-components-svelte/commit/a3e794e0261ab259875f6d9a02fe9e4772e79bff))
- **overflow-menu:** `close` event surfaces dismissal `trigger` (#3311) ([b5852d6](https://github.com/carbon-design-system/carbon-components-svelte/commit/b5852d68449744131bbbdeefd7267505ddb122e6))
- **overflow-menu:** support `xs` size ([5c7f382](https://github.com/carbon-design-system/carbon-components-svelte/commit/5c7f3821fe6e835865f6dfc1a5b28173f2da8884))
- **pagination-skeleton:** add `size` prop ([516f2bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/516f2bd0c17a6d18c98024681a2410fe6488beff))
- **pagination:** add `size` prop ([c7c7149](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7c71491a21b9988f342e5788f537f419a822942))
- **pagination:** add `xs` size ([2fd445f](https://github.com/carbon-design-system/carbon-components-svelte/commit/2fd445fa73ffcdfba8084ba3b572272926e44a35))
- **pagination:** add `xs` size ([a4084f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/a4084f0bca9c83ec40f61b395263620a886c77c7))
- **password-input:** add `PasswordInputSkeleton` ([b740a44](https://github.com/carbon-design-system/carbon-components-svelte/commit/b740a445248d8e9a44981690acec730b87487777))
- **password-input:** support `xs` size ([d70270b](https://github.com/carbon-design-system/carbon-components-svelte/commit/d70270b69a87d57060e2871ba5ad83c9e079abfa))
- **pin-code-input:** add `fluid` prop for fluid form support ([280a451](https://github.com/carbon-design-system/carbon-components-svelte/commit/280a451140b4fc28752085bccafc156efb39a87b))
- **pin-code-input:** add `PinCodeInput` ([9480360](https://github.com/carbon-design-system/carbon-components-svelte/commit/948036061caa787f8b21d4fcecad729239c1f701))
- **pin-code-input:** add `PinCodeInputSkeleton` ([c6fc2eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/c6fc2eb84931d7eed6545e2e508aaa6235ed4e25))
- **pin-code-input:** add FluidPinCodeInputSkeleton component ([db3c199](https://github.com/carbon-design-system/carbon-components-svelte/commit/db3c199d7c52991a8bcfce0f708aec98af4795b0))
- **pin-code-input:** support `xs` size ([81272a7](https://github.com/carbon-design-system/carbon-components-svelte/commit/81272a7684188afd5628815a6b52981a8c7316ee))
- **popover:** dispatch `close` when `closeOnOutsideClick` auto-closes (#3319) ([9103c6f](https://github.com/carbon-design-system/carbon-components-svelte/commit/9103c6ff2e99e2dfa03f758414bb5a101e3bdb09))
- **search-skeleton:** add `hideLabel` prop ([e5f570a](https://github.com/carbon-design-system/carbon-components-svelte/commit/e5f570a208ec696a1c6abc99b055cf70aecdd76b))
- **search:** add `fluid` prop for fluid form support ([c1427b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/c1427b472ff2a8c6d26ebaffc7cf149c66b65e19))
- **search:** add FluidSearchSkeleton component ([dfda530](https://github.com/carbon-design-system/carbon-components-svelte/commit/dfda530465837d0cecfc8f24bfff434014ee5a24))
- **search:** support `xs` size ([c2780cb](https://github.com/carbon-design-system/carbon-components-svelte/commit/c2780cbcf19ed1b1f84362fc0f6821e8fd732325))
- **select:** add `fluid` prop for fluid form support ([b29cabe](https://github.com/carbon-design-system/carbon-components-svelte/commit/b29cabe89badbfd6442a1b00ac0a31de432328ad)), closes [#502](https://github.com/carbon-design-system/carbon-components-svelte/issues/502)
- **select:** add FluidSelectSkeleton component ([03796f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/03796f6766f9cf88bde21fb387ac4a4ac6270f9a))
- **select:** support `xs` size ([15b6131](https://github.com/carbon-design-system/carbon-components-svelte/commit/15b6131d61b398f84fa201a5fdeb2d072029c60f))
- **session-storage:** add `sync` prop to opt out of storage event sync ([535a999](https://github.com/carbon-design-system/carbon-components-svelte/commit/535a999489d3d8bc0d227cf867f9edce26b095c5))
- **stack:** add `wrap` prop for flex-wrap support ([d00fce6](https://github.com/carbon-design-system/carbon-components-svelte/commit/d00fce6e3bf8da010158d9ce8a10bd9900b526e6))
- **structured-list:** support `multiple` selection ([13c1cd9](https://github.com/carbon-design-system/carbon-components-svelte/commit/13c1cd987e9929238abd78323acff9bce7180cce))
- **tabs:** pass `selected` to Tab default slot ([986ca51](https://github.com/carbon-design-system/carbon-components-svelte/commit/986ca51cd94f2fa2dd73a4ed554fa4f6f85efcfc))
- **tabs:** support dismissible tabs ([a7d7bd1](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7d7bd17479bb4ffbfaaedcf41e591692c17f88b)), closes [#2727](https://github.com/carbon-design-system/carbon-components-svelte/issues/2727)
- **tabs:** support icon-only variant ([1661cb9](https://github.com/carbon-design-system/carbon-components-svelte/commit/1661cb9193b4a913530316d087f573a723c0b0f5)), closes [#2728](https://github.com/carbon-design-system/carbon-components-svelte/issues/2728)
- **tag:** add `inline` prop ([a8995f4](https://github.com/carbon-design-system/carbon-components-svelte/commit/a8995f4f2371611053cbb71e3d966a53432102fd))
- **text-area:** add `fluid` prop for fluid form support ([ee85a7a](https://github.com/carbon-design-system/carbon-components-svelte/commit/ee85a7a38f83474395addd70e53b50e846c8986a)), closes [#1598](https://github.com/carbon-design-system/carbon-components-svelte/issues/1598)
- **text-area:** add FluidTextAreaSkeleton component ([b23dfdd](https://github.com/carbon-design-system/carbon-components-svelte/commit/b23dfdd04dabfc66e8927e076c3933bf3e660dc3))
- **text-input:** add `fluid` prop for fluid form support ([ad01613](https://github.com/carbon-design-system/carbon-components-svelte/commit/ad016134a23528ea4bb72fcca041f1eed6c616a5))
- **text-input:** add FluidTextInputSkeleton component ([e7bc62d](https://github.com/carbon-design-system/carbon-components-svelte/commit/e7bc62de6e53d614eb6b4809a7755865412857b0))
- **text-input:** support `xs` size ([9367e64](https://github.com/carbon-design-system/carbon-components-svelte/commit/9367e64befbce20253d6f018a988006d0a6ec628))
- **text:** add `Text` component and utility typography classes ([e58163d](https://github.com/carbon-design-system/carbon-components-svelte/commit/e58163deb9a12afefe53d20951558c062658e026))
- **time-picker:** add `fluid` prop for fluid form support ([e69c022](https://github.com/carbon-design-system/carbon-components-svelte/commit/e69c022538cda32d780a70e0b468acbdac05d162))
- **time-picker:** add FluidTimePickerSkeleton component ([aa3c1b0](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa3c1b0e7c9c1048e245e00f987cae38c6d55122))
- **toolbar:** add "xs" size ([b24f2f2](https://github.com/carbon-design-system/carbon-components-svelte/commit/b24f2f2e8deca51fb2e51af84cd9ca768e095dcb))
- **truncation:** add `lines` prop for multi-line support ([9d89681](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d896812bf644e9abecfd6e6c3f15bc61106b6c7))
- **ui-shell:** `HeaderAction` close event surfaces dismissal `trigger` (#3310) ([ce4f3a4](https://github.com/carbon-design-system/carbon-components-svelte/commit/ce4f3a4bf142b7f07ad426cd5fe048b694a7b324))
- **ui-shell:** `HeaderGlobalAction` supports `badge` slot ([15f3914](https://github.com/carbon-design-system/carbon-components-svelte/commit/15f3914726f7894f5cab1e20e037d56452bbfc86))
- **ui-shell:** `HeaderNavMenu` dispatches `close` event (#3308) ([a6bdc58](https://github.com/carbon-design-system/carbon-components-svelte/commit/a6bdc582322229d9b7e12e6affe31eff162825ac))
- **ui-shell:** `HeaderSearch` dispatches `close` event (#3318) ([9ba56ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ba56ed28810bcca9e272866e70991a1bd95111d))
- **ui-shell:** add `HeaderSideNavItems` for responsive header navigation ([6de282a](https://github.com/carbon-design-system/carbon-components-svelte/commit/6de282a4106cce82dbf32b12425fbc7b7e0acbe4)), closes [#516](https://github.com/carbon-design-system/carbon-components-svelte/issues/516)

### Bug Fixes

- **accordion-item:** remove chevron aria-label ([69b0305](https://github.com/carbon-design-system/carbon-components-svelte/commit/69b0305ee2a3bdb5c868eb4c2fe673aa39986483))
- **accordion-item:** rename `iconDescription` to `ariaLabel` for heading button ([72431ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/72431ea3d8e09ee1d1193d9fdc9866354daf724b))
- **biome:** enforce useSvelteRequireEachKey ([57a0c4b](https://github.com/carbon-design-system/carbon-components-svelte/commit/57a0c4b5a678d9d68030fa79dabde6dc039b8039))
- **breadcrumb:** fix overflow menu carets for small sizes (#3228) ([444c96b](https://github.com/carbon-design-system/carbon-components-svelte/commit/444c96bbd5c5259eab728aaedc313592f1bb853f))
- **checkbox:** preserve consumer title and stop mutating the prop ([122cb88](https://github.com/carbon-design-system/carbon-components-svelte/commit/122cb88876aaa7e0c19c9255193c3648c63c4d5c))
- **code-snippet:** avoid overwriting consumer-controlled `showMoreLess` prop (#3191) ([23cdbf5](https://github.com/carbon-design-system/carbon-components-svelte/commit/23cdbf5227d50d09e27eae5ab88205866ed55a70))
- **code-snippet:** close portalled tooltip after feedback timeout ([bbd144a](https://github.com/carbon-design-system/carbon-components-svelte/commit/bbd144a32c9198b6fb9066981aaf0a0a4b73195f))
- **code-snippet:** suppress native copy feedback caret for portalled tooltips for inline type ([05044ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/05044ca11e6ce6fbbf98a1aea3ec645ccd182d97))
- **combo-box:** add arrow key support for opening/closing the menu (#3254) ([bb1e92d](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb1e92dfc0d9541913d10b30dbe4ec6ba6cb449d))
- **combo-box:** clear hover highlight when cursor leaves the menu ([0247728](https://github.com/carbon-design-system/carbon-components-svelte/commit/024772850cafe86682c6cda8be664de8ab64113c))
- **combo-box:** derive virtualized item height from size ([3987ef1](https://github.com/carbon-design-system/carbon-components-svelte/commit/3987ef132914f3239c7d5bd4f2181e960a2c3e97))
- **combo-box:** remove invalid listbox role from the root element (#3262) ([01ec189](https://github.com/carbon-design-system/carbon-components-svelte/commit/01ec18938de9ff6013793e0d62ff1053c91b110b))
- **combo-box:** scope option ids per instance (#3176) ([135bb17](https://github.com/carbon-design-system/carbon-components-svelte/commit/135bb17ceaaf23d7e8dc962cfd6a8f34fe9f94d6))
- **composed-modal:** add keyed each for secondary buttons ([975e7d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/975e7d55ee1f02355eeb50c4f3bead695eff012e))
- **content-switcher:** skip disabled switches during keyboard navigation (#3204) ([f0945a2](https://github.com/carbon-design-system/carbon-components-svelte/commit/f0945a28ac51a606dbb815489cbbdb74c4bff358))
- **copy-button:** close portalled tooltip after feedback timeout ([c8a9d56](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8a9d56cf67d7428a2b870c9714f16fba6f39829))
- **css:** replace `:has()` with marker classes for browser baseline (#3256) ([130be4c](https://github.com/carbon-design-system/carbon-components-svelte/commit/130be4c0b66e9da8203393d90640ba0756e904f7))
- **data-table:** associate cells with column headers (#3162) ([f8806aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8806aa570943a0894345c95fb2d8a653cc4ba2d))
- **data-table:** scope expandable row ids per instance (#3178) ([178c463](https://github.com/carbon-design-system/carbon-components-svelte/commit/178c46392069ce0c8f5d9b6f690b95bb90d41691))
- **data-table:** sticky header supports empty column and column menu (#3301) ([3a410c9](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a410c9f8ade87b28b8c161565a0e31796b0071d)), closes [#1492](https://github.com/carbon-design-system/carbon-components-svelte/issues/1492) [#440](https://github.com/carbon-design-system/carbon-components-svelte/issues/440)
- **dropdown:** add Alt+Arrow support for opening/closing the menu (#3257) ([addb4cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/addb4cf1509ec7cef78380420fd3eb31841e7ffe))
- **dropdown:** clear hover highlight when cursor leaves the menu ([01f24d3](https://github.com/carbon-design-system/carbon-components-svelte/commit/01f24d395b0ef1706f7907e113b71ce7cae9ef0f))
- **dropdown:** derive virtualized item height from size ([ff17f9c](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff17f9c4b731241eae7a07811c62a4c197a460f7))
- **dropdown:** scope option ids per instance (#3177) ([d89a7fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/d89a7fcf6879284e4db5ce03e0eb64e653764234))
- **expandable-tile:** add aria-label to chevron toggle button (#3306) ([f75073f](https://github.com/carbon-design-system/carbon-components-svelte/commit/f75073f7c8f383858fa20d875cb8f1e8aa25a5ef))
- **expandable-tile:** link `aria-controls` to below-the-fold content (#3305) ([f019d6e](https://github.com/carbon-design-system/carbon-components-svelte/commit/f019d6e7ae36088886952775fdadac08c5cd3e2a))
- **expandable-tile:** resize if bound element changes (#3180) ([53b84e6](https://github.com/carbon-design-system/carbon-components-svelte/commit/53b84e6ce95cd00fb0cf1893182670843d568de6))
- **expandable-tile:** stop measurements clobbering bound props (#3197) ([b3b8c89](https://github.com/carbon-design-system/carbon-components-svelte/commit/b3b8c896f681b00af9bec04825afa60987d55f78))
- **file-uploader-button:** join `accept` explicitly if array ([2e81e7d](https://github.com/carbon-design-system/carbon-components-svelte/commit/2e81e7d99894755743e28c45cd4283229cc59410))
- **file-uploader-drop-container:** join `accept` explicitly if array ([a7596f3](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7596f394e1c92aa604831f575aa9c6c89b58fe3))
- **file-uploader:** consolidate button role onto drop container label (#3307) ([40614ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/40614ba12711dc3ba2e3890cb8433e8ee0670493))
- **file-uploader:** expose `aria-disabled` on drop container (#3194) ([0dd9665](https://github.com/carbon-design-system/carbon-components-svelte/commit/0dd966521ea0b304dcb194da5cb16cbeb2a392ea))
- **local-storage:** persist object and array value mutations ([929590c](https://github.com/carbon-design-system/carbon-components-svelte/commit/929590c0b51724075e34e47b1e96d0c62bb1e5ea))
- **local-storage:** sync cross-tab key removal ([2681639](https://github.com/carbon-design-system/carbon-components-svelte/commit/268163934bccb45b5ff89cca248601a395754a96))
- **modal:** add keyed each for secondary buttons ([07d4cd7](https://github.com/carbon-design-system/carbon-components-svelte/commit/07d4cd74917f0f0d3a94d8e5c7f1419cc7a9c220))
- **modal:** prevent Enter on Cancel from also firing the primary action (#3279) ([eea7d45](https://github.com/carbon-design-system/carbon-components-svelte/commit/eea7d45e5e24d3a0612b757adaa1c3437d546377))
- **multi-select:** add Alt+Arrow support for opening/closing the menu (#3258) ([93dc6ce](https://github.com/carbon-design-system/carbon-components-svelte/commit/93dc6ceb1f4034a2d3031b6ea27b027f734f8c59))
- **multi-select:** clear hover highlight when cursor leaves the menu ([7545f77](https://github.com/carbon-design-system/carbon-components-svelte/commit/7545f7783cfa4c5818251d4cc2b1d768dba459cf))
- **multi-select:** derive virtualized item height from size ([9ecd4b9](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ecd4b95bc4c13d77661749bc6877905d71bb481))
- **multi-select:** fix selection if `portalMenu` is `true` (#3185) ([e391d66](https://github.com/carbon-design-system/carbon-components-svelte/commit/e391d66f26c09e996ea2cca3d8304663ac7f8c4e)), closes [#3170](https://github.com/carbon-design-system/carbon-components-svelte/issues/3170)
- **multi-select:** open menu when the field label is clicked (#3260) ([def97ce](https://github.com/carbon-design-system/carbon-components-svelte/commit/def97cef13832a9f2ff1c12f962cc79b2f86fe5b))
- **multi-select:** restore focus outline on the field (#3259) ([3f38500](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f385004bbee7f911a0f7710eca51e52b20a0d01))
- **multi-select:** scope checkbox ids per instance (#3175) ([651633c](https://github.com/carbon-design-system/carbon-components-svelte/commit/651633c4a34f70bd20f075542e0088899573e9f3))
- **multi-select:** scope option ids per instance (#3179) ([179b636](https://github.com/carbon-design-system/carbon-components-svelte/commit/179b6369a2a9d6b64b90bae446865f8aa88a331c))
- **overflow-menu:** dispatch cancelable `close` before flipping `open` ([027b979](https://github.com/carbon-design-system/carbon-components-svelte/commit/027b979a0618e48a6f8048f6ddfdb8f11bbb65ba))
- **overflow-menu:** non-portalled `ul` is a sibling of the menu button (#3189) ([1c78bea](https://github.com/carbon-design-system/carbon-components-svelte/commit/1c78bea04614c4f6f7d71ce212e9a21b77510de2))
- **overflow-menu:** prevent scroll jump when opening portalled menu (#3338) ([ca4d51e](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca4d51e795e317aab0f0d201a0ff3ec446e5746e))
- **pagination-nav:** add keyed each for overflow options ([9992b54](https://github.com/carbon-design-system/carbon-components-svelte/commit/9992b54165590646fb380ced68f6c8295d7aadf1))
- **pagination-nav:** add keyed each for page items ([be59b86](https://github.com/carbon-design-system/carbon-components-svelte/commit/be59b865f0fcd1c97b7b70b8953dfc9ed54ae35d))
- **pagination:** cap rendered page options at `pageWindow` (#3005) ([687b3dd](https://github.com/carbon-design-system/carbon-components-svelte/commit/687b3dd036a503ab8904c2fd1e35c0d6a16a0c72))
- **pagination:** make `pagesUnknown` actually navigable ([9db0432](https://github.com/carbon-design-system/carbon-components-svelte/commit/9db0432060c8f6f03204e098eca4ba8668c78939))
- **pagination:** portal next/prev button tooltips ([0104782](https://github.com/carbon-design-system/carbon-components-svelte/commit/0104782ca96bedfd126a6bc9820c5f874bb1fa1d))
- **range-slider:** dispatch `change` from commit gestures, not reactive block ([6545d39](https://github.com/carbon-design-system/carbon-components-svelte/commit/6545d392f6f61d26d0a7103101bdb622e246d758))
- **session-storage:** persist object and array value mutations ([b28b872](https://github.com/carbon-design-system/carbon-components-svelte/commit/b28b87289d93a719ccc11941298025b6aea108d6))
- **session-storage:** sync cross-tab key removal ([22fea38](https://github.com/carbon-design-system/carbon-components-svelte/commit/22fea38033a670aeb9cdf31f635383f1085d8276))
- **skeleton-text:** add keyed each for paragraph lines ([db124d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/db124d2555bd4f2ce9abdab8e3ba618850e36c90))
- **slider:** clamp keyboard value and dispatch `change` from commit gestures ([66667cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/66667cfcd10d1aa50280dad4da0548382cfd0ea5))
- **tabs:** add keyed each in TabsSkeleton ([b3721ae](https://github.com/carbon-design-system/carbon-components-svelte/commit/b3721aedf8c6d1a6e4fc5b37707b8f854d73f4b1))
- **tabs:** support Home/End keyboard shortcuts (#3208) ([3ba1c39](https://github.com/carbon-design-system/carbon-components-svelte/commit/3ba1c398c195c7867ba08b25eef247ffdf62cb97))
- **tabs:** user-provided `href` should not prevent default behavior ([12e95d1](https://github.com/carbon-design-system/carbon-components-svelte/commit/12e95d1a80120391ab61e63eb13e3e3a32a2246d)), closes [#2165](https://github.com/carbon-design-system/carbon-components-svelte/issues/2165)
- **tree-view:** prevent arrow keys from scrolling the page (#3165) ([6ff532d](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ff532de6899b77009c4c47f02947856afcbd7f5))
- **tree-view:** scope internal node ids per instance (#3209) ([2ce3564](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ce3564c57aaab6fc19b9776ada4f1b7e34e8d24))
- **utils:** apply maxItems cap in scrollHighlightedIntoView ([865a489](https://github.com/carbon-design-system/carbon-components-svelte/commit/865a489730682da51d6678998bcaf46e5a93aa00))
- **utils:** clamp virtualize `scrollTop` to the scrollable range (#3236) ([7ebe5bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ebe5bd7da91a9a0826c0ec88127a7772fbfec68))
- **utils:** render unvirtualized when itemHeight is non-positive ([ca3e2ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca3e2adcf299c95f13deeb0edfc4e3e0ddbb5e64))

### Performance

- **combo-box:** register outside-click listener only while open ([2849c2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/2849c2a58dfe29a6d2f0b32d72a68d067e7c132d))
- **context-menu:** gate outside-click and Escape listeners on open ([08d0a5e](https://github.com/carbon-design-system/carbon-components-svelte/commit/08d0a5e6f522245a201a7e44a70fcb37197f667a))
- **context-menu:** register option hover listener only while submenu open ([94b9d8f](https://github.com/carbon-design-system/carbon-components-svelte/commit/94b9d8fc491c73cb5b62e982c76b897abc5aa03d))
- **date-picker:** cache top-layer ancestor for outside-click checks ([08623ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/08623ba9cfa856216a6d5e8a94e823055c79eefe))
- **date-picker:** register outside-click listener only while calendar is open ([61dc601](https://github.com/carbon-design-system/carbon-components-svelte/commit/61dc60196aab134e803178484b2e6322cb502c0c))
- **dismiss:** pool window listeners by type, options ([356654a](https://github.com/carbon-design-system/carbon-components-svelte/commit/356654ab72dfe91a80021de23d80de97b47b61cf))
- **dropdown:** register outside-click listener only while open ([5e9bcb0](https://github.com/carbon-design-system/carbon-components-svelte/commit/5e9bcb03dfecab6c392b8c282e03fa6d0d4d2186))
- **multi-select:** register outside-interaction listeners only while open ([aabc309](https://github.com/carbon-design-system/carbon-components-svelte/commit/aabc3098b9dff18cabd8534669941cc73186465b))
- **overflow-menu:** register outside-click listener only while open ([6afb3f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/6afb3f8d38b1c0f7866995839fb277975cf985cd))
- **popover:** register outside-click listener only while open ([9494e0c](https://github.com/carbon-design-system/carbon-components-svelte/commit/9494e0cbbdd495a0d1e6546e41ad07e3c58e7ad7))
- **range-slider:** register drag listeners only while dragging ([3b63e25](https://github.com/carbon-design-system/carbon-components-svelte/commit/3b63e251fcafc0322ae78b43dfc7d98762bb431f))
- **slider:** register drag listeners only while dragging ([a626f77](https://github.com/carbon-design-system/carbon-components-svelte/commit/a626f775223af744fdc984e241cecc59066ea74c))
- **tooltip-definition:** register Escape listener only while open ([37c99af](https://github.com/carbon-design-system/carbon-components-svelte/commit/37c99af79dae1f1dfd6cc0b0597890969fc9808b))
- **tooltip-icon:** register Escape listener only while open ([3bbbf09](https://github.com/carbon-design-system/carbon-components-svelte/commit/3bbbf09e336df690ede9d1cae729101e0c1ebf82))
- **ui-shell:** register Header outside-interaction listeners only while open ([52f5222](https://github.com/carbon-design-system/carbon-components-svelte/commit/52f5222ba061acacd1bbc1af032cccc58a62f556))

### [0.108.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.108.0...v0.108.1) (2026-06-07)

### Bug Fixes

- **accordion-item:** remove chevron aria-label ([16acde3](https://github.com/carbon-design-system/carbon-components-svelte/commit/16acde3459c6287547d140ae84d7c8b03e029124))
- **code-snippet:** avoid overwriting consumer-controlled `showMoreLess` prop (#3191) ([1e32d62](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e32d62e0fb2561c794694cdb8b299012c342101))
- **code-snippet:** close portalled tooltip after feedback timeout ([41d5ca2](https://github.com/carbon-design-system/carbon-components-svelte/commit/41d5ca243b4de3c13d06221ff07bb24457a161ed))
- **code-snippet:** suppress native copy feedback caret for portalled tooltips for inline type ([bb0c534](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb0c534df460ff06a98bdbf5bf3a53a257de79f7))
- **combo-box:** scope option ids per instance (#3176) ([6f8cf7c](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f8cf7c5fcca66041b11e9f0ad9d29a42050c6cd))
- **copy-button:** close portalled tooltip after feedback timeout ([8d5ab9d](https://github.com/carbon-design-system/carbon-components-svelte/commit/8d5ab9d390cbad3563e0e0cfc06c314232252f33))
- **data-table:** associate cells with column headers (#3162) ([152c6bb](https://github.com/carbon-design-system/carbon-components-svelte/commit/152c6bb87412ebc6a91e252f4d690c984d0cc74f))
- **data-table:** scope expandable row ids per instance (#3178) ([9317243](https://github.com/carbon-design-system/carbon-components-svelte/commit/9317243b0fd504a76c3af2ee20d4127014ce503c))
- **dropdown:** scope option ids per instance (#3177) ([9d8e1e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d8e1e93753e78e960502acf41229fef2e57b91d))
- **expandable-tile:** resize if bound element changes (#3180) ([121bb13](https://github.com/carbon-design-system/carbon-components-svelte/commit/121bb13c13ab1b06804001c32b257a829a773c2b))
- **expandable-tile:** stop measurements clobbering bound props (#3197) ([d972e03](https://github.com/carbon-design-system/carbon-components-svelte/commit/d972e03dd1fd25ac1e26ad184cc6f8e04dc7cdcf))
- **file-uploader-button:** join `accept` explicitly if array ([75cc63a](https://github.com/carbon-design-system/carbon-components-svelte/commit/75cc63a3528e4804e25691eecbd7c2a4ef77c212))
- **file-uploader-drop-container:** join `accept` explicitly if array ([b298c87](https://github.com/carbon-design-system/carbon-components-svelte/commit/b298c8798f695a4a1f427d6815eeb7df3ab75ed2))
- **file-uploader:** expose `aria-disabled` on drop container (#3194) ([249d604](https://github.com/carbon-design-system/carbon-components-svelte/commit/249d604d2966a7f0246a727ea91e58895cf7cc9a))
- **multi-select:** fix selection if `portalMenu` is `true` (#3185) ([bdb4c0e](https://github.com/carbon-design-system/carbon-components-svelte/commit/bdb4c0ec0914d35f7776918a8533766c5ac76d8c)), closes [#3170](https://github.com/carbon-design-system/carbon-components-svelte/issues/3170)
- **multi-select:** scope checkbox ids per instance (#3175) ([d96e65b](https://github.com/carbon-design-system/carbon-components-svelte/commit/d96e65bab0d26d28ba2797b215dfb66517679fde))
- **multi-select:** scope option ids per instance (#3179) ([19042d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/19042d86b28300e7ac7bface5f515d84906a3e09))
- **overflow-menu:** dispatch cancelable `close` before flipping `open` ([5b3410c](https://github.com/carbon-design-system/carbon-components-svelte/commit/5b3410c5ee0e1a2829d68e9c65eb24db181ce313))
- **overflow-menu:** non-portalled `ul` is a sibling of the menu button (#3189) ([3fb0cda](https://github.com/carbon-design-system/carbon-components-svelte/commit/3fb0cdaa520a5e53c73742c5baa56bef14615973))
- **tree-view:** prevent arrow keys from scrolling the page (#3165) ([b78fd2b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b78fd2bae6d33fa39140a3bf1ff72e58ade69c55))

### [0.108.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.107.1...v0.108.0) (2026-06-05)

### ⚠ BREAKING CHANGES

- **date-picker-skeleton:** replace unused `label` with `span` (#2890) ([214e42a](https://github.com/carbon-design-system/carbon-components-svelte/commit/214e42a28d73dcc59b015443f362924547f0cd08))
- **inline-notification:** remove decorative `statusIconDescription` prop ([6595f97](https://github.com/carbon-design-system/carbon-components-svelte/commit/6595f97b60671b37fb8463852376248344187b40))
- **notification-icon:** remove decorative `iconDescription` prop ([985e97d](https://github.com/carbon-design-system/carbon-components-svelte/commit/985e97dafd642cdb7fdaf30568d4a5ab5d6229b6))
- **notification-queue:** remove decorative `statusIconDescription` prop ([6642c8e](https://github.com/carbon-design-system/carbon-components-svelte/commit/6642c8e9461fe201dffc63a1327e4ef6a571f3bb))
- **toast-notification:** remove decorative `statusIconDescription` prop ([4017539](https://github.com/carbon-design-system/carbon-components-svelte/commit/401753991f1f2c5e4dc82bea24931865b9c673e1))

### Features

- **accordion-item:** add `ref` prop for button reference (#2938) ([e63b302](https://github.com/carbon-design-system/carbon-components-svelte/commit/e63b302dc96a19017f0d1cd613bd43dfc6d5ac39))
- **breadcrumb:** add `labelText` prop for the nav `aria-label` (#2950) ([b9170cc](https://github.com/carbon-design-system/carbon-components-svelte/commit/b9170ccc4365338e439756d5e527cf8704b41ead))
- **breadcrumb:** support small size ([eaaea14](https://github.com/carbon-design-system/carbon-components-svelte/commit/eaaea14b1953579aeba9789106b06288474bf74b))
- **checkbox-group:** add `readonly` prop ([cb4aee8](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb4aee8a5b89a415ffdc69234629a1828f31d86b))
- **clickable-tile:** add `ref` prop for link reference (#2956) ([14cff9b](https://github.com/carbon-design-system/carbon-components-svelte/commit/14cff9b12f03ae8020db818030dda5e5cfcabeff))
- **code-snippet:** add `feedbackIcon` prop ([ba60010](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba6001095babee8e266b6e4793f5cb38f1c5145e))
- **code-snippet:** dispatch namespaced copy-button hover events ([72f10a3](https://github.com/carbon-design-system/carbon-components-svelte/commit/72f10a3f5ef07b2fd30cc054ea2efa24748ce539))
- **code-snippet:** forward copy:error from copy control ([c37fed7](https://github.com/carbon-design-system/carbon-components-svelte/commit/c37fed77f8860328d331e6dd7be750cf1f23af56))
- **code-snippet:** support async copy for inline variant ([848dc42](https://github.com/carbon-design-system/carbon-components-svelte/commit/848dc42a2bdaf31818131d4f2000deb15ea35f1b))
- **combo-box:** add readonly state ([9e90531](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e90531a5a3e61194fb67280e18ea291951317ae))
- **content-switcher:** add `ref` prop for tablist reference (#2980) ([449ac74](https://github.com/carbon-design-system/carbon-components-svelte/commit/449ac7425fe5c9c5500ba7ccc1bd37b43b4c586f))
- **context-menu:** add `labelText` prop ([afb62a7](https://github.com/carbon-design-system/carbon-components-svelte/commit/afb62a7768c28922e7c6615ee805082e7f178a24))
- **context-menu:** support Home/End keyboard shortcuts (#2974) ([790b4f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/790b4f628c0382eab7b681725919acdc1bb7bade))
- **copy-button:** add `feedbackIcon` prop ([722aaba](https://github.com/carbon-design-system/carbon-components-svelte/commit/722aaba38864f638ce806c3eaee409c8e54816f0))
- **copy-button:** forward more events to button ([6fa8f13](https://github.com/carbon-design-system/carbon-components-svelte/commit/6fa8f13e575fb78ca4999146d220c6fabdd864ea))
- **copy-button:** support async `copy` ([35ba6d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/35ba6d538f33b7aace30abaacff95378bf7e8453))
- **data-table:** `DataTableEmptyHeader` type uses discriminated union ([c8c77a9](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8c77a9f5ad8dc09f7ac97735c6ef88f2133a55f))
- **data-table:** `on:sort` type uses discriminated union ([25e8f15](https://github.com/carbon-design-system/carbon-components-svelte/commit/25e8f155ccf1de4507e996cb4922501f24e3b8d0))
- **date-picker-input:** support `readonly` prop ([7ba5d15](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ba5d157332ce024041d14d94c6aee7b57412723))
- **date-picker-skeleton:** add `short` prop ([4e7c55d](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e7c55d64c3cec6808cb2ed850e5d560a4bed5b4))
- **date-picker:** export `calendar` instance for programmatic control ([6fc4103](https://github.com/carbon-design-system/carbon-components-svelte/commit/6fc4103738f86d2f69c5ca2331e13349b2e91699))
- **dropdown:** add readonly state ([a4c04dc](https://github.com/carbon-design-system/carbon-components-svelte/commit/a4c04dcdd6e33679aed51e2e3eac8d80840ae7c3))
- **file-uploader-button:** add `preventDuplicate` prop ([3a9c8bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a9c8bc8c5c8b97438b9d588aba16e5b5ef9a02b))
- **file-uploader:** expose `ref` to inner input element ([914cfbf](https://github.com/carbon-design-system/carbon-components-svelte/commit/914cfbffcd8ff76cb25fae4c515faaa373048a03))
- **fluid-form:** add `ref` prop for form reference (#3056) ([582b17c](https://github.com/carbon-design-system/carbon-components-svelte/commit/582b17c884d0ced9c9422f5f85216d6ce36d93e1))
- **list-box-menu:** support `portalHostClass` prop ([a0caa3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/a0caa3a1e3347711c54ae795a6475e57982081ed))
- **list-box:** support readonly state ([2841dde](https://github.com/carbon-design-system/carbon-components-svelte/commit/2841dde8c7770a0fcdb10c330a960cc043d09fdf))
- **local-storage:** dispatch error event for write failures ([1b309c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/1b309c3485c3e6fd36d3740c13893418d4eb86b6))
- **multi-select:** add readonly state ([527c498](https://github.com/carbon-design-system/carbon-components-svelte/commit/527c4980ad6e5d2b67d398c989cb6c9f7563b1af))
- **multi-select:** expose `sortedItems` as a bindable prop ([99871e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/99871e82975b856f24af245c6ffeb57bcd4283c0))
- **notification-queue:** add `update` prop ([39c007c](https://github.com/carbon-design-system/carbon-components-svelte/commit/39c007cd3202d1ecf7c7c3a5a3f8eb12ad0fccc6))
- **outbound-link:** add `assistiveText` prop for screen readers (#3105) ([3a0b20a](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a0b20ae94015f00707d1aec86a949e86f5c0449))
- **overflow-menu:** support `disabled` button ([09c48f2](https://github.com/carbon-design-system/carbon-components-svelte/commit/09c48f23539e58a57c9c80fda29726dabf49cf62))
- **overflow-menu:** support Home/End keyboard shortcuts (#2982) ([307a2e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/307a2e9a03df7b6bf001c42e5b9792b26105f7b4))
- **progress-indicator-skeleton:** add `spaceEqually` prop ([316aa9c](https://github.com/carbon-design-system/carbon-components-svelte/commit/316aa9c867ed1c84556b6dbc5180a2f0eec4c18f))
- **progress-step:** icon is slottable ([ff55fe0](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff55fe0f2f62a65ad5bff9bb52255c85f77e4172))
- **radio-button:** add readonly state ([147f5be](https://github.com/carbon-design-system/carbon-components-svelte/commit/147f5be9f8808c4193acadfa3025649803c875bb))
- **recursive-list:** add `expressive` prop ([6c23ebe](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c23ebe227d02182339c47c9e7158998767fdc12))
- **recursive-list:** support link `target` and `rel` attributes (#3001) ([8ce5d57](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ce5d57f27ce20dca1d8145587ba960bbe267183))
- **recursive-list:** support optional `id` key ([4178e6d](https://github.com/carbon-design-system/carbon-components-svelte/commit/4178e6dd8deda8dc8fccc3ca2fa8feccafc5479a))
- **select:** support `readonly` prop ([e6b0521](https://github.com/carbon-design-system/carbon-components-svelte/commit/e6b052106a70593d8865fff321bcb18aec7c360e))
- **selectable-tile-group:** add `hideLegend` prop ([967518e](https://github.com/carbon-design-system/carbon-components-svelte/commit/967518e2a748b9f0a7092f98a3212ab3f4e447cf))
- **session-storage:** dispatch error event for write failures ([170dcd9](https://github.com/carbon-design-system/carbon-components-svelte/commit/170dcd934ab29d912876a841f9bb5673b7c1adb7))
- **slider:** add `RangeSlider` ([c9df655](https://github.com/carbon-design-system/carbon-components-svelte/commit/c9df6551bfd8ffbe492094b78f20496cdc57fe90))
- **structured-list-skeleton:** add `columns` prop ([cb87671](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb876716a8c5230ff663f71c31c09a3972d8859f))
- **text-area:** add readonly state ([69944f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/69944f7dc585ec971fc7497784131f6bccc2a43d))
- **time-picker-select:** support readonly state ([060034c](https://github.com/carbon-design-system/carbon-components-svelte/commit/060034c32bd01dc3aeb0df9591ea9b0bd03fd821))
- **time-picker:** add `helperText` prop ([fdceb23](https://github.com/carbon-design-system/carbon-components-svelte/commit/fdceb235c1c6f859fdd00ba15eea07fe3194db83))
- **time-picker:** add warning state ([96ce7a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/96ce7a17dc3913ce8cee9d1a652b5e9f5ac96624))
- **time-picker:** support readonly state ([321d571](https://github.com/carbon-design-system/carbon-components-svelte/commit/321d57140352b5827cb9c735beaf788717ecd45c))
- **toggle:** add readonly state ([3f7968c](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f7968c687c429f63f53cd9c0e019dab7dc98cd5))
- **toolbar-search:** add `clear` accessor ([e047d1b](https://github.com/carbon-design-system/carbon-components-svelte/commit/e047d1b50fcbfda2761c568db2baafa8d422ae4a))
- **toolbar:** add `ariaLabel` prop (#3027) ([58ffb05](https://github.com/carbon-design-system/carbon-components-svelte/commit/58ffb05ba2316cfbd69b6df6796300ba6170fa70))
- **ui-shell:** `HeaderSearch` supports optional `id` as key ([6ce6e72](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ce6e7200a3cd2e52fd835df77a89d5ad29fed11))

### Bug Fixes

- **breadcrumb-item:** improve description for slot usage ([da27d82](https://github.com/carbon-design-system/carbon-components-svelte/commit/da27d823e12966b3f5f7721ca8eba09c104a9060))
- **breadcrumb-item:** type `$$restProps` ([511dad9](https://github.com/carbon-design-system/carbon-components-svelte/commit/511dad977ea1d3eb9b72db7a80b68b1c2c33a189))
- **breadcrumb:** apply current class when `aria-current="page"` is set (#2953) ([811d74e](https://github.com/carbon-design-system/carbon-components-svelte/commit/811d74ec5be76b6b2c0a99b7b2bfc358751c2c9e))
- **breadcrumb:** avoid leaking `aria-current` onto `<li>` wrapper ([2ba5659](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ba5659fefcf8fd0f2b60e444de7cd5664a49ccd))
- **breadcrumb:** hide skeleton from assistive tech (#2951) ([88cdeea](https://github.com/carbon-design-system/carbon-components-svelte/commit/88cdeead7c19dcbb2026fc5daff2d616ca0f21f6))
- **breadcrumb:** set `aria-current="page"` on link when `isCurrentPage` is true (#2958) ([619a009](https://github.com/carbon-design-system/carbon-components-svelte/commit/619a009f26c13bfe9d57bb0a9abd673f4b6be703))
- **button:** dedupe size class logic (#2949) ([1152875](https://github.com/carbon-design-system/carbon-components-svelte/commit/11528752401c90e151763f89c6543c5c3526dc1b))
- **button:** omit `href` when `disabled` to avoid invalid `<button href>` (#2948) ([2accfdc](https://github.com/carbon-design-system/carbon-components-svelte/commit/2accfdc090f58a8421dc522d9e700bba4cc7b11c))
- **button:** remove redundant `aria-label` from icon (#2946) ([726fd8e](https://github.com/carbon-design-system/carbon-components-svelte/commit/726fd8e66a4474cec1c74f76030aa80c7064fe16))
- **button:** set `rel="noopener noreferrer"` on `target="_blank"` anchors (#2945) ([227b7f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/227b7f972b8b4e4fe1d965892299e78a846e00f7))
- **checkbox-group:** unsubscribe from `selectedValue` on destroy ([743f668](https://github.com/carbon-design-system/carbon-components-svelte/commit/743f668d9736373be4198d452cde7d5306ff0a27))
- **checkbox:** associate `helperText` with input via `aria-describedby` (#3078) ([dad9946](https://github.com/carbon-design-system/carbon-components-svelte/commit/dad99467aa5e5c3283378d6160548fa529b36472))
- **checkbox:** prevent forwarded `change` event when `readonly` (#3080) ([ae4ec15](https://github.com/carbon-design-system/carbon-components-svelte/commit/ae4ec15dc865ee369facaa92029f6748d6a5cd94))
- **clickable-tile:** forward keyup/focus/blur events ([1469fe8](https://github.com/carbon-design-system/carbon-components-svelte/commit/1469fe8c404e3d976de2948ceca4297e7dcb7370))
- **clickable-tile:** guard `clicked` toggle when `disabled` (#2957) ([a166dec](https://github.com/carbon-design-system/carbon-components-svelte/commit/a166dec69d61a7144ff29c350d8d127b060f4654))
- **code-snippet:** default inline copy button label to "Copy code" (#2962) ([f7ef0a5](https://github.com/carbon-design-system/carbon-components-svelte/commit/f7ef0a575ef2543c9e3c5b89fcd2801532e09e57))
- **code-snippet:** mark `textbox` container as readonly (#2964) ([f6e0b55](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6e0b55f460675aa0cf364dcab1bda0f4f0020d6))
- **code-snippet:** re-attach modal observer when `portalTooltip` toggles ([52ff178](https://github.com/carbon-design-system/carbon-components-svelte/commit/52ff17867446406dfe59dbb6dd1c670dcb3c10e9))
- **code-snippet:** remove redundant `aria-label` from expand chevron (#2963) ([d09da6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d09da6acfa93fd4ae48516ef9cc001cfa065d50e))
- **combo-box:** default `aria-activedescendant` to empty when none highlighted (#2918) ([1528a0a](https://github.com/carbon-design-system/carbon-components-svelte/commit/1528a0a2c6e82fd23d8c1a591a37561a8286b5e0))
- **combo-box:** index `aria-activedescendant` against filtered items (#2916) ([f142041](https://github.com/carbon-design-system/carbon-components-svelte/commit/f14204179a8126b28fe2fb19a8b0c5c778899935))
- **combo-box:** remove `aria-labelledby` shadowing label association (#2917) ([6dd5fb5](https://github.com/carbon-design-system/carbon-components-svelte/commit/6dd5fb5c5760486c3d81c2c6a9657c120cc1d229))
- **combo-box:** set `aria-haspopup="listbox"` on input (#2914) ([f2a38d3](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2a38d329537342791209e73f006fc91b8a64e37))
- **combo-box:** suppress invalid/warn states when disabled or read-only ([eabd15e](https://github.com/carbon-design-system/carbon-components-svelte/commit/eabd15e66ee6417970a4d488b383dea5b5536865))
- **combo-box:** wire `aria-describedby` to helper/error/warn messages ([988f688](https://github.com/carbon-design-system/carbon-components-svelte/commit/988f68814b613b8b39df6702a11ef30f71f43250))
- **contained-list:** remove redundant `role="list"` (#3041) ([7281df4](https://github.com/carbon-design-system/carbon-components-svelte/commit/7281df4999819bdc0397d471a1c756e567db6ae9))
- **content-switcher:** forward focus/blur events ([a1c1547](https://github.com/carbon-design-system/carbon-components-svelte/commit/a1c1547dc2298a2c5c5c2a42d7bb07c5fb3e796e))
- **content-switcher:** scope tab lookup to registered switches (#2970) ([ea7c038](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea7c03867b824b8af25512e80445ee7c1b50d11f))
- **content-switcher:** support Home/End keyboard shortcuts (#2968) ([c537e62](https://github.com/carbon-design-system/carbon-components-svelte/commit/c537e625711b18649611a4480c41ec73d2fa3a85))
- **content-switcher:** sync switch order to DOM on conditional render ([b549fbf](https://github.com/carbon-design-system/carbon-components-svelte/commit/b549fbfbba0791c64785df167536b45f37ce332e))
- **content-switcher:** unregister `Switch` from parent on destroy (#2969) ([6b778e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b778e7ee7ea3578fc40457eb6c6ddeac40c2257))
- **context-menu-option:** apply `aria-disabled` to submenu triggers ([9bb37d0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9bb37d05a09ee5322ad8cfaeaf8117e855c5725b))
- **context-menu-option:** disabled leaf option should not close the menu ([95f3ad0](https://github.com/carbon-design-system/carbon-components-svelte/commit/95f3ad02f5ebbacf1c479a8a724ce2485db19b7b))
- **context-menu-option:** only apply class if `disabled` (#2972) ([6b00578](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b00578d0ed3819c8b580b96680b9d8fec7c7b04))
- **context-menu:** dispatch open/close only on open-state transitions (#2975) ([acd8d99](https://github.com/carbon-design-system/carbon-components-svelte/commit/acd8d991e54b889ef043c7b8c1fffb4fd87841e7))
- **context-menu:** rebind listeners when target changes (#2977) ([df13db3](https://github.com/carbon-design-system/carbon-components-svelte/commit/df13db3b6f755332198bc1e324af28526d8f4b63))
- **context-menu:** reset role to "menuitem" when option no longer selectable (#2976) ([055b271](https://github.com/carbon-design-system/carbon-components-svelte/commit/055b271fe28f4ec0a36a901ae7aa9d1cd658d18d))
- **copy-button:** avoid dispatching "copy" event if already clicked (#3141) ([5c97a64](https://github.com/carbon-design-system/carbon-components-svelte/commit/5c97a644dab470eb08731f7331d61a8054343234))
- **copy-button:** re-attach modal observer when `portalTooltip` toggles ([bd9c862](https://github.com/carbon-design-system/carbon-components-svelte/commit/bd9c86221e873d7f88f8c6516dee5f0bb46f6f74))
- **css:** suppress native copy feedback caret for portalled tooltips (#2961) ([45d9234](https://github.com/carbon-design-system/carbon-components-svelte/commit/45d923406f81d459c613413b1d40f91283fb3a9b))
- **data-table:** `click:header` reports intended direction even when `sort` is cancelled (#2940) ([e66b7f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/e66b7f979e926402e8484cac485b0b6b9a3f3e33))
- **data-table:** detect in-place row mutations in cell cache (#2941) ([e37a8f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/e37a8f88f04cff9d60d0ae681bb2146e8830a192))
- **data-table:** preserve active filter when `rows` prop changes (#2944) ([fd4e9f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/fd4e9f641c98f44ebae9721ba78f084f04ae546b))
- **data-table:** scope `TableHeader` ids to the `DataTable` instance (#2939) ([a669092](https://github.com/carbon-design-system/carbon-components-svelte/commit/a669092390eabe209d436845f6c513a0eb51d50e))
- **date-picker-input:** forward `focus` event to input (#2889) ([e844c76](https://github.com/carbon-design-system/carbon-components-svelte/commit/e844c7631ff3a730fc2c6300ed87d7ddd5203f42))
- **date-picker-skeleton:** replace unused `label` with `span` (#2890) ([214e42a](https://github.com/carbon-design-system/carbon-components-svelte/commit/214e42a28d73dcc59b015443f362924547f0cd08))
- **date-picker:** avoid animation flicker if calendar is already open (#2888) ([961670c](https://github.com/carbon-design-system/carbon-components-svelte/commit/961670cfafa1f57c382d06c4e74dc53b28eae63f))
- **date-picker:** constrain input width if `helperText` is longer than input ([829a6c5](https://github.com/carbon-design-system/carbon-components-svelte/commit/829a6c53766cc51dd75d07ca3cb80925de032e3b))
- **date-picker:** disabled state icon uses correct color ([135d046](https://github.com/carbon-design-system/carbon-components-svelte/commit/135d04686dfc720c07569997fc3b24b9292732c1))
- **date-picker:** portalled menu should track scroll/resize events ([71c713c](https://github.com/carbon-design-system/carbon-components-svelte/commit/71c713ccaa9bbdabfaf276328e9fcf0738d1f752))
- **date-picker:** restore single-letter weekday abbreviations for `locale="en"` ([c450d81](https://github.com/carbon-design-system/carbon-components-svelte/commit/c450d817c39a73920fe476184e941b1a62f57d6f))
- **date-picker:** style disabled month nav buttons ([39b3fd3](https://github.com/carbon-design-system/carbon-components-svelte/commit/39b3fd37431e05c32e49656d2982730efb4b5943))
- **date-picker:** suppress invalid/warn states when disabled or read-only ([4d9fa04](https://github.com/carbon-design-system/carbon-components-svelte/commit/4d9fa04c688891dec23920c3cf7c1bd8a682c5b6))
- **dropdown:** exclude "Space" from typeahead buffer (#2928) ([f246af8](https://github.com/carbon-design-system/carbon-components-svelte/commit/f246af89bb47ae7311ed51375a49e0ca5190ae7f))
- **dropdown:** gate `aria-controls` on `open` (#2927) ([3213964](https://github.com/carbon-design-system/carbon-components-svelte/commit/3213964326b0f7f5b83ada3157470dab5eb9edcf))
- **dropdown:** scroll selected option into view when menu overflows ([6bc4d64](https://github.com/carbon-design-system/carbon-components-svelte/commit/6bc4d644cfbc248f69467b966070f242ae720022))
- **dropdown:** suppress invalid/warn states when disabled or read-only ([3a9eb2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a9eb2e9d308204d77e00aaee0abb38d2e611588))
- **dropdown:** wire `aria-describedby` to helper/error/warn messages (#2932) ([62b7677](https://github.com/carbon-design-system/carbon-components-svelte/commit/62b76773461621856b2dbb5707ed5c7d73d509ab))
- **file-uploader:** stable per-file ids for add/remove events (#3017) ([88b4264](https://github.com/carbon-design-system/carbon-components-svelte/commit/88b426426d445b93f42cb058cf542a4b77f41d30))
- **inline-loading:** clear success timer before rescheduling ([00f283d](https://github.com/carbon-design-system/carbon-components-svelte/commit/00f283d1ff548bf2860607cefdfa62db50aab86c))
- **inline-notification:** remove decorative `statusIconDescription` prop ([6595f97](https://github.com/carbon-design-system/carbon-components-svelte/commit/6595f97b60671b37fb8463852376248344187b40))
- **inline-notification:** type `role` as "alert" | "log" | "status" ([39c4308](https://github.com/carbon-design-system/carbon-components-svelte/commit/39c4308ce18d29edb423ac9978bee8a043297265))
- **link:** forward focus/blur/keydown/keyup events ([e3526be](https://github.com/carbon-design-system/carbon-components-svelte/commit/e3526be41360f85cb30e7608513c6bca5db92663))
- **list-box:** add safer guard for rendering invalidText/warnText ([57c828b](https://github.com/carbon-design-system/carbon-components-svelte/commit/57c828b407dc3189fc2c157d02c7eabf330d5124))
- **local-storage:** drop stray argument from internal `setItem` calls ([d59de93](https://github.com/carbon-design-system/carbon-components-svelte/commit/d59de932ee2e4303398b1411dd0246df5d6baff1))
- **local-storage:** sync `prevValue` after reactive key change ([fa68b4d](https://github.com/carbon-design-system/carbon-components-svelte/commit/fa68b4db0d37bcf4e4f99342a4efdef8b8cd8dd8))
- **modal:** implement body scroll lock ([da2e81c](https://github.com/carbon-design-system/carbon-components-svelte/commit/da2e81c4a28a07dcb8e580956ede86f69e630367))
- **modal:** skip Enter submit when target is textarea/select/contenteditable (#2994) ([a277c1a](https://github.com/carbon-design-system/carbon-components-svelte/commit/a277c1a5b5fa11ca918183a2d72032d1c980eae0))
- **multi-select:** apply wrapper classes to portal host if `portalMenu` is `true` ([2392bad](https://github.com/carbon-design-system/carbon-components-svelte/commit/2392bad39b4ce0734b2068531a89062d69f93cd7))
- **multi-select:** close menu on focus leaving wrapper (#2920) ([c458505](https://github.com/carbon-design-system/carbon-components-svelte/commit/c45850577bc807efba74858267df54e58b11d298))
- **multi-select:** do not open menu on filterable input focus (#2921) ([eb3d754](https://github.com/carbon-design-system/carbon-components-svelte/commit/eb3d754f4115b7f5e3fbd242d6ce3865dc417c32))
- **multi-select:** preserve bound `value` on non-filterable close (#2924) ([0fd75dc](https://github.com/carbon-design-system/carbon-components-svelte/commit/0fd75dc9db425993c7ae46512dc355edda8e9573))
- **multi-select:** recompute `sortedItems` when `items` prop changes (#2922) ([0d29494](https://github.com/carbon-design-system/carbon-components-svelte/commit/0d294944869fd357dac501f51817b5396ef64bdd))
- **multi-select:** remove `aria-labelledby` shadowing label association (#2923) ([84de7ac](https://github.com/carbon-design-system/carbon-components-svelte/commit/84de7acb60216858400c4fce2a2420cfc3b0fa0d))
- **multi-select:** set `aria-haspopup="listbox"` on input (#2919) ([59de2ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/59de2abc8c6df9f6cae5011ad27fcfb5b1faaffa))
- **multi-select:** suppress invalid/warn states when disabled or read-only ([12e464a](https://github.com/carbon-design-system/carbon-components-svelte/commit/12e464a253f1cc060a997cea583c09a9bf61c08d))
- **notification-icon:** remove decorative `iconDescription` prop ([985e97d](https://github.com/carbon-design-system/carbon-components-svelte/commit/985e97dafd642cdb7fdaf30568d4a5ab5d6229b6))
- **notification-queue:** remove decorative `statusIconDescription` prop ([6642c8e](https://github.com/carbon-design-system/carbon-components-svelte/commit/6642c8e9461fe201dffc63a1327e4ef6a571f3bb))
- **number-input:** set `aria-readonly` for readonly state (#3037) ([6c896ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c896ca0d853f1243e7a0165ff77eed9155baa50))
- **outbound-link:** forward focus/blur/keydown/keyup events ([1fff120](https://github.com/carbon-design-system/carbon-components-svelte/commit/1fff120ce405f86dbd6dca10a8b0f042e471e17a))
- **overflow-menu-item:** `primaryFocus` should not be reactive (#2987) ([9538612](https://github.com/carbon-design-system/carbon-components-svelte/commit/95386124f6285c8b54f5f3d9246f426713e910d1))
- **overflow-menu-item:** set `aria-disabled` on disabled link (#2983) ([38bfc44](https://github.com/carbon-design-system/carbon-components-svelte/commit/38bfc44b1f8c50034c03d2c191d43976fe69bbd3))
- **overflow-menu:** `aria-controls` is stable (#2986) ([bff1477](https://github.com/carbon-design-system/carbon-components-svelte/commit/bff14778e6432293f218cd767ff80b2b35c03f9c))
- **overflow-menu:** prevent infinite loop when all items are disabled (#2984) ([388ef46](https://github.com/carbon-design-system/carbon-components-svelte/commit/388ef46a474e3ab076dacb4d5914f900b8486649))
- **overflow-menu:** self-unregister items on destroy (#3011) ([905e08a](https://github.com/carbon-design-system/carbon-components-svelte/commit/905e08ab5c6faecfc0fb7e6a105d0eb4b011cd41))
- **overflow-menu:** use `aria-haspopup="menu"` (#2985) ([fe5b44d](https://github.com/carbon-design-system/carbon-components-svelte/commit/fe5b44d3065c62a3155f0db69f632b40b9aec2bb))
- **overflow-menu:** use `SvelteHTMLElements` to type target/rel props (#3003) ([6b25d75](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b25d757d68a317dd57f694ebedc90b6b80686b3))
- **package:** include CSS type definitions in `package.json` exports map ([e806405](https://github.com/carbon-design-system/carbon-components-svelte/commit/e806405b9fb6ad6bec015d75f725cbe0702b0c77))
- **pagination-nav:** announce current page as 1-based in live region (#3070) ([58b1ce5](https://github.com/carbon-design-system/carbon-components-svelte/commit/58b1ce52655578d69f34edc6fbfda7e25d47d2ed))
- **pagination-nav:** label active middle page with "Active, Page" (#3071) ([e8f1d5b](https://github.com/carbon-design-system/carbon-components-svelte/commit/e8f1d5b3d196c6cd31048cdda0b606f3eaae5772))
- **pagination:** use clear suffixes for internal IDs (#2990) ([2f05cab](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f05cabaf861304c20df67738b4a044aeb009a8d))
- **progress-bar:** associate label via `aria-labelledby` (#3074) ([5875281](https://github.com/carbon-design-system/carbon-components-svelte/commit/58752817e3c3b5b606157ba0c06de93207a6028f))
- **progress-indicator:** remove unmounted steps from context (#3049) ([44780e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/44780e3afa28dc33c7535638a17f59276701aa16))
- **progress-step:** dispatch `change` once per keypress (#3054) ([9923f8f](https://github.com/carbon-design-system/carbon-components-svelte/commit/9923f8ff84860c314c89b62b51658efe83ea9453))
- **progress-step:** do not throw if rendered outside context (#3081) ([2437a06](https://github.com/carbon-design-system/carbon-components-svelte/commit/2437a06a576d7ecec7ad0346759a51120c49655b))
- **progress-step:** forward focus/blur events (#3055) ([2eb3cdd](https://github.com/carbon-design-system/carbon-components-svelte/commit/2eb3cddd0a803772b2f7104f3b3df538767ee225))
- **radio-button-group:** associate `helperText` via `aria-describedby` (#3085) ([6b3b95e](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b3b95eed08d6761fa778105378657d703ad5815))
- **radio-button-group:** unsubscribe from `selectedValue` on destroy (#3061) ([6e90822](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e908222af8d5e4ea519a9cb783f502cb5791641))
- **select:** add missing warn icon/text for inline variant (#2913) ([768ab48](https://github.com/carbon-design-system/carbon-components-svelte/commit/768ab480ad7c43f3d6768eb9f6b3461d1ba2cbcf))
- **select:** suppress invalid/warn states when disabled or read-only ([62df7cd](https://github.com/carbon-design-system/carbon-components-svelte/commit/62df7cd4b2b3704bf86c7de9a50d348d62801610))
- **selectable-tile:** announce label as checkbox to screen readers (#3075) ([be497f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/be497f886c04ef7d7a10c9fa0f445835c13ea65b))
- **selectable-tile:** hide checkmark icon from assistive technology (#3107) ([dea0830](https://github.com/carbon-design-system/carbon-components-svelte/commit/dea0830e47369325f7906674b81c4125c457e23d))
- **selectable-tile:** re-register with group when value changes (#3067) ([4928d32](https://github.com/carbon-design-system/carbon-components-svelte/commit/4928d325a9b38d93933a24ce47eca274804969aa))
- **selectable-tile:** set `aria-disabled` for disabled state (#3065) ([ec4265d](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec4265dfcb1d39adb152f57b2633150668ae1dff))
- **session-storage:** drop stray argument from internal `setItem` calls ([bf72abf](https://github.com/carbon-design-system/carbon-components-svelte/commit/bf72abf373d41fde562b5132591859b462e0993d))
- **session-storage:** sync `prevValue` after hydration and reactive key change ([d5d81c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5d81c307d0a847a2c9f945cc61643d0695c4f14))
- **slider:** move keyboard handler to thumb with role="slider" (#3092) ([bcb35f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/bcb35f62511b00fd77388d6c696519b52f1fd6da))
- **slider:** suppress invalid/warn states when disabled or read-only ([e8420df](https://github.com/carbon-design-system/carbon-components-svelte/commit/e8420df0845825147f9d19ec58c6161a96cc7b5e))
- **slider:** update value on click without drag (#3046) ([8692e6e](https://github.com/carbon-design-system/carbon-components-svelte/commit/8692e6e5fbfd0044df21f8ceb88d4036a1780123))
- **structured-list-input:** do not throw if rendered outside context (#3033) ([5139247](https://github.com/carbon-design-system/carbon-components-svelte/commit/5139247f125cbba48dde65ebc0afe5f491db50af))
- **structured-list-row:** make selectable rows keyboard-activatable (#3091) ([2a40eb5](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a40eb5ce3248c904820beb227e18fae133be869))
- **structured-list:** prevent dispatching initial "change" event (#3032) ([50cf228](https://github.com/carbon-design-system/carbon-components-svelte/commit/50cf228d83d938196aca3637b056307f70cd1b11))
- **switch:** forward focus/blur/keyup events ([bc7332e](https://github.com/carbon-design-system/carbon-components-svelte/commit/bc7332ede6cc848060110bc74d5923f177b41ef1))
- **switch:** remove useless `preventDefault` modifier (#2967) ([57059a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/57059a8414898f7cd92be900a67138ddcaac367f))
- **tabs:** prevent infinite loop when all items are disabled (#3129) ([170f132](https://github.com/carbon-design-system/carbon-components-svelte/commit/170f1329ba56ff4038035114a8f6d8fbf58eb445))
- **tag:** `SelectableTag` uses `aria-pressed` instead of `aria-checked` (#3073) ([10b9c43](https://github.com/carbon-design-system/carbon-components-svelte/commit/10b9c43ac9aa1bee17c6c53d0555e20f8eb25dae))
- **time-picker-select:** forward change/input/focus/blur events (#2899) ([3565cc3](https://github.com/carbon-design-system/carbon-components-svelte/commit/3565cc31f762fd908e8481a2baaf723f7cb419fd))
- **time-picker:** associate `invalidText` with input via `aria-describedby` (#2894) ([1134104](https://github.com/carbon-design-system/carbon-components-svelte/commit/1134104c92371c63ef551d58c9638c12bdd6468b))
- **time-picker:** invalid state has icon (#2896) ([8bcf9fd](https://github.com/carbon-design-system/carbon-components-svelte/commit/8bcf9fd17ffcd0be01069c26df5bb33c9a75c9f2))
- **toast-notification:** remove decorative `statusIconDescription` prop ([4017539](https://github.com/carbon-design-system/carbon-components-svelte/commit/401753991f1f2c5e4dc82bea24931865b9c673e1))
- **toast-notification:** type `role` as "alert" | "log" | "status" ([3f65834](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f65834c41cf1af37cb05ff3f0c9e3d08cc86dc2))
- **toggle:** do not render empty label span when no label provided (#3137) ([0b06091](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b060913a0e857d6166c0c1a983bef61374aa20f))
- **toolbar-batch-actions:** stop mutating controlled `active` prop (#3022) ([d919dc5](https://github.com/carbon-design-system/carbon-components-svelte/commit/d919dc58f5e6409234739fb4e1fc0226b67e2797))
- **toolbar-content:** unsubscribe from `batchActionsActive` on destroy ([6b71325](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b71325267f16eca0b5c7227a03be8611e233848))
- **toolbar-menu:** reset parent overflow on unmount (#3029) ([b020cb3](https://github.com/carbon-design-system/carbon-components-svelte/commit/b020cb3d97d9a5be7db3c8850e04607309d7a020))
- **toolbar-search:** coerce `value` to string before reading length (#3023) ([046d233](https://github.com/carbon-design-system/carbon-components-svelte/commit/046d2339c69fc04825db2440b2202a6783f61a66))
- **toolbar-search:** skip expanded toggle when persistent (#3025) ([8c0aac9](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c0aac9f6a4d845870738d73a17ad1815b78b2f9))
- **tooltip-footer:** do not throw if rendered outside context (#3047) ([07d7e63](https://github.com/carbon-design-system/carbon-components-svelte/commit/07d7e6331e77226ecf9fcfc28bcd365b8c721c41))
- **tree-view-item:** ArrowLeft on collapsed parent focuses its ancestor ([ade0f55](https://github.com/carbon-design-system/carbon-components-svelte/commit/ade0f5517b1d3ae6217ff45fa99eda0bf765784d))
- **tree-view-item:** ArrowRight reliably focuses the first child row ([924150f](https://github.com/carbon-design-system/carbon-components-svelte/commit/924150f978145425247f100141af5bdc7589a35b))
- **tree-view-item:** Enter toggles expand on parent; Space only selects ([ff54c2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff54c2ac15d26f1ec4e721061e9c49e7babe5ec7))
- **tree-view-item:** export findParentTreeNode ([e7a2644](https://github.com/carbon-design-system/carbon-components-svelte/commit/e7a264414edc8ed7f54670ce7a92f14e0865e0b6))
- **tree-view-item:** wire aria-owns and aria-labelledby for subtree group ([faa3bab](https://github.com/carbon-design-system/carbon-components-svelte/commit/faa3bab0814a2dc9e43ec1a1418d78796812e71f))
- **tree-view:** arrow keys work with link rows (#3101) ([49b8db8](https://github.com/carbon-design-system/carbon-components-svelte/commit/49b8db89476d669f5f50c4a36b18dcf86ad18b3a))
- **tree-view:** re-apply first focusable tabindex when nodes change ([841355f](https://github.com/carbon-design-system/carbon-components-svelte/commit/841355fa97395074563919b41e2ca3a8f8d045d5))
- **tree-view:** roving tabindex resets the previous row on focus move ([f69710d](https://github.com/carbon-design-system/carbon-components-svelte/commit/f69710dd92ed0466b4e859026abcf6b900c80779))
- **tree-view:** support Ctrl+A to select all in multiselect ([a07027f](https://github.com/carbon-design-system/carbon-components-svelte/commit/a07027f094d8fe6b590298ef307773f125186733))
- **tree-view:** support Home and End keys for focus navigation ([8f1c11d](https://github.com/carbon-design-system/carbon-components-svelte/commit/8f1c11dd59ebc85d2715c5035d84fa23157763f6))
- **tree-view:** tree walker handles non-Element nodes and skips hidden rows ([0b0e5e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b0e5e3138565333b7d1a5d57b7fd38b36be7c5f))
- **ui-shell:** `Header` preserves user-toggled side nav across breakpoints (#3013) ([c66efd1](https://github.com/carbon-design-system/carbon-components-svelte/commit/c66efd1b05e1bb873a22b7b3fa86ba9a94b55d8d))
- **ui-shell:** `HeaderAction` allows content overflow and uses correct color scheme ([30b0b9e](https://github.com/carbon-design-system/carbon-components-svelte/commit/30b0b9ef5346221420c3190e693e96b4880955ff))
- **ui-shell:** `HeaderActionLink` uses correct focus outline color (#3154) ([ed746b2](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed746b2d896e03068b15e97d92e6431c83a28119))
- **ui-shell:** `HeaderNav` does not forward `aria-label` to menu bar (#3028) ([cccc4a9](https://github.com/carbon-design-system/carbon-components-svelte/commit/cccc4a98edd179f5f98a9c48eac97b0909bd9391))
- **ui-shell:** `HeaderShell` uses unique IDs (#3010) ([ab7991f](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab7991f7a8fb64e82194e4cda9d9915422269b9b))
- **ui-shell:** `SideNav` locks body scroll when used with modal ([ddc76aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/ddc76aa6e32fc10d4f124e8cf7cb5df65a491d5f))
- **ui-shell:** guard `ref` access in window click handlers (#3012) ([00a52a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/00a52a83579da31304da262477ff083951c52f0f))
- avoid literal false tokens in composed class attributes (#2960) ([0979800](https://github.com/carbon-design-system/carbon-components-svelte/commit/09798001c8fd90fda71ff939679e3e60d69c42a4))
- drop literal "undefined" token from interpolated class strings (#2992) ([802d8e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/802d8e26ffaa435517db1b0ac70f786cf5c69471))

### Performance

- **combo-box:** drop per-keystroke index Map for `findIndex` (#3088) ([c70ed77](https://github.com/carbon-design-system/carbon-components-svelte/commit/c70ed77651078a6413a5e7afcc1b7cc71999897f))
- **combo-box:** remove dead code for single-filtered-item (#2934) ([50e3f08](https://github.com/carbon-design-system/carbon-components-svelte/commit/50e3f08c4f3c49a7a905dfaa329804fba5580f2e))
- **combo-box:** remove no-op `highlightedId` writes (#2915) ([d606f87](https://github.com/carbon-design-system/carbon-components-svelte/commit/d606f87745125af03906e93a68fe7b5f1f538efa))
- **data-table:** remove imperative `refSelectAll.checked` (#2937) ([981d2d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/981d2d51723d2a6b3e1391177c571434d529d1ea))
- **data-table:** remove unused `expandedRowsHeight` reactive (#2942) ([e5c66dc](https://github.com/carbon-design-system/carbon-components-svelte/commit/e5c66dc78b0edf75a072dae4698ad3b7595fd08f))
- **date-picker:** skip redundant `flatpickr` updates on reactive ticks (#2892) ([80375a7](https://github.com/carbon-design-system/carbon-components-svelte/commit/80375a7a2a1b27f95c0f7a2274df4b7226be304a))
- **dropdown:** drop selected index map (#3090) ([06c5af2](https://github.com/carbon-design-system/carbon-components-svelte/commit/06c5af28d16cfd099ddb0386b717979fddef6187))
- **dropdown:** use `itemIndexById` for virtualized scroll-to-selected (#2935) ([2ceea55](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ceea5535782f99ef215a5ab985279e7cd5f7c87))
- **multi-select:** drop per-keystroke index Map for `findIndex` (#3089) ([6ee97fa](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ee97fab23b5e097ec5388b4dcac1244129f387e))
- **toolbar-search:** avoid refiltering on unrelated updates (#3024) ([966ea54](https://github.com/carbon-design-system/carbon-components-svelte/commit/966ea5476e85851587d8cc8c8c122a12544504f3))
- **tree-view-node:** hide collapsed nodes via CSS (#3007) ([e5c2910](https://github.com/carbon-design-system/carbon-components-svelte/commit/e5c2910f06a5ca960c76b4627a1219ff39cba70a))

### [0.107.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.107.0...v0.107.1) (2026-05-02)

### Bug Fixes

- **date-picker:** support portal menu inside native `dialog` ([3fb3948](https://github.com/carbon-design-system/carbon-components-svelte/commit/3fb3948a7ca3e8499a908ca79f70b464db83a3df)), closes [#2881](https://github.com/carbon-design-system/carbon-components-svelte/issues/2881)
- **floating-portal:** auto-target accounts for native `popover` ([741ccd4](https://github.com/carbon-design-system/carbon-components-svelte/commit/741ccd4950bdaf8e3b1705ce197419d2d797e381)), closes [#2882](https://github.com/carbon-design-system/carbon-components-svelte/issues/2882)

### [0.107.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.106.2...v0.107.0) (2026-04-25)

### Features

- **floating-portal:** add `target` prop ([b4b0b50](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4b0b5054ef2d0f74d153ae6b3b205d2521e2372))
- **floating-portal:** auto-detect native `dialog` as target ([4e438df](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e438df7ac0c7d3dfff8f122b6911d747bec5965)), closes [#2873](https://github.com/carbon-design-system/carbon-components-svelte/issues/2873)
- **portal:** add `target` prop ([029f65e](https://github.com/carbon-design-system/carbon-components-svelte/commit/029f65e08ef0dd970becf9dc174a9ae3773b524f))

### Bug Fixes

- **checkbox-group:** avoid dispatching "change" event twice ([bab81b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/bab81b4f180a66a19aaa28f95937ebaae08a400a))
- **checkbox-group:** prevent dispatching initial "change" event in Svelte 5 ([4fe17ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/4fe17ef594c52d291af7e2c42616cd16307ef88f)), closes [#2878](https://github.com/carbon-design-system/carbon-components-svelte/issues/2878)
- **content-switcher:** prevent dispatching initial "change" event in Svelte 5 ([4f8066c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f8066cf2a40869ac52733c909da51499a807147)), closes [#2878](https://github.com/carbon-design-system/carbon-components-svelte/issues/2878)
- **radio-button-group:** prevent dispatching initial "change" event in Svelte 5 ([fb3b758](https://github.com/carbon-design-system/carbon-components-svelte/commit/fb3b758919c6ffe5c876021d45df893a08c72db7)), closes [#2879](https://github.com/carbon-design-system/carbon-components-svelte/issues/2879)

### [0.106.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.106.1...v0.106.2) (2026-04-20)

### Bug Fixes

- **select:** prevent dispatching initial "update" event in Svelte 5 (#2872) ([5e8afc1](https://github.com/carbon-design-system/carbon-components-svelte/commit/5e8afc1a5c23473e701f8c2bccf7556c85bb1066)), closes [#2871](https://github.com/carbon-design-system/carbon-components-svelte/issues/2871)

### [0.106.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.106.0...v0.106.1) (2026-04-16)

### Bug Fixes

- **data-table-skeleton:** do not require `DataTableHeader` key/empty/value properties (#2870) ([482feac](https://github.com/carbon-design-system/carbon-components-svelte/commit/482feac23bf2db92ace6f802d28bc4c72a4f6c76)), closes [#2869](https://github.com/carbon-design-system/carbon-components-svelte/issues/2869)
- **types:** `tabindex` type allows number or string ([8f2180d](https://github.com/carbon-design-system/carbon-components-svelte/commit/8f2180d560996f99d577de9f8904781d1cf092b2))

### [0.106.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.105.1...v0.106.0) (2026-04-08)

### Features

- **combo-box:** add `openOnClear` ([7fbfc35](https://github.com/carbon-design-system/carbon-components-svelte/commit/7fbfc35e45247ecc49a788dea85f2343e12ff37c))
- **combo-box:** support auto-highlighting the first match ([cbcf9bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/cbcf9bda057e4c8f3b84455118e914f5a79fde77))
- **combo-box:** typeahead supports custom `shouldFilterItem` ([06c6d57](https://github.com/carbon-design-system/carbon-components-svelte/commit/06c6d5744c21b5a2eb30b2f0fc2f03982fd64c99))
- **data-table:** add top-level `sort` prop ([2bd1e14](https://github.com/carbon-design-system/carbon-components-svelte/commit/2bd1e14a994423a17448d9ea3ea2c959094da171))
- **data-table:** dispatch `sort` event ([ce9b0b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/ce9b0b65d084e6e47a66d8a4bd091b78d814398c))
- **dropdown:** `selectedId` is optional ([26567e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/26567e9db4bba75c0f0f77a75fdc23f412c2cbec))
- **tag:** support large size ([20274c5](https://github.com/carbon-design-system/carbon-components-svelte/commit/20274c575f7a3d29a0f2fb128a603015df47ca35))
- **theme:** support rendering as a `Dropdown` ([7d78437](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d784379fb6493e3d8b5b8f85793664ed03189ac))
- **tree-view:** support `multiselect` ([378d1e6](https://github.com/carbon-design-system/carbon-components-svelte/commit/378d1e60b8b64a6cc112652caaabca56b2b0c596))
- **tree-view:** support links ([8ee8f5d](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ee8f5d3a610c606460ce8f077751045379d5e5c))
- **ui-shell:** support classic theme ([822ce33](https://github.com/carbon-design-system/carbon-components-svelte/commit/822ce33a279ebc2fba66e234c9ac37bf663a4275)), closes [#2836](https://github.com/carbon-design-system/carbon-components-svelte/issues/2836)

### Bug Fixes

- **combo-box:** add missing "lg" size mapping ([f4cb46c](https://github.com/carbon-design-system/carbon-components-svelte/commit/f4cb46c1206e474ff881f8efd3fff88452f5af15))
- **combo-box:** do not auto-select partial match when pressing "Enter" ([7cbb63b](https://github.com/carbon-design-system/carbon-components-svelte/commit/7cbb63bcb1b7b800ad7079a7d5f42be84cdedb69))
- **combo-box:** do not trap focus when clicking outside element ([42984b9](https://github.com/carbon-design-system/carbon-components-svelte/commit/42984b944d6714e3d25c232772779c44236ec00a))
- **combo-box:** prevent infinite loop when all items are disabled ([d9289f2](https://github.com/carbon-design-system/carbon-components-svelte/commit/d9289f2978cdd4eeda6781be6632b2f42a0d09b9))
- **dropdown:** button uses `combobox` role, apply missing ARIA attributes ([62c4be5](https://github.com/carbon-design-system/carbon-components-svelte/commit/62c4be5302f561f57e6e675a99d850b10e40b27a))
- **dropdown:** do not spread `translateWithId` to raw `button` element ([96e7af2](https://github.com/carbon-design-system/carbon-components-svelte/commit/96e7af297b38f10bba28cf7058d9d8ad5647a860))
- **dropdown:** prevent infinite loop when all items are disabled ([f58fc9c](https://github.com/carbon-design-system/carbon-components-svelte/commit/f58fc9c5dd27b159c532616c3ba03e8e5667a82c))
- **dropdown:** selected item has checkmark icon ([93ebb19](https://github.com/carbon-design-system/carbon-components-svelte/commit/93ebb1978ca8538fb16d37f2a57c4b5193e16549))
- **dropdown:** use `labelText` as aria-label fallback ([5a53787](https://github.com/carbon-design-system/carbon-components-svelte/commit/5a537877675692af60662bd0835b2ec27fe29919))
- **list-box:** add missing "lg" size mapping ([54e6520](https://github.com/carbon-design-system/carbon-components-svelte/commit/54e652093c3ccb9a5a9acb89e7ae5442cc55385b))
- **multi-select:** `sortItem` comparator returns a number, not `Item` ([1a04817](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a0481752ca9237728338ea5f1cda8c1237a3f23))
- **multi-select:** Backspace/Delete clears selection ([3ffbb31](https://github.com/carbon-design-system/carbon-components-svelte/commit/3ffbb311343864fb7c5f0c078ab89ce991334d34))
- **multi-select:** fix typo in `size` prop description ([65ea6c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/65ea6c361341f83e334214e8feea37d8ebd8c052))
- **multi-select:** invalid/warn, filterable variant should only render one icon ([dcf0c7e](https://github.com/carbon-design-system/carbon-components-svelte/commit/dcf0c7e3d5f4838d6bff1851ace1b331a53a9986))
- **multi-select:** narrow `itemToString` return type ([57fddc9](https://github.com/carbon-design-system/carbon-components-svelte/commit/57fddc985e118051bc40d20e6ed1cfcd9116acc4))
- **multi-select:** prevent infinite loop when all items are disabled ([edfa849](https://github.com/carbon-design-system/carbon-components-svelte/commit/edfa8499530c9dcebc149218b6ffa55d583bf571))
- **number-input:** remove `pattern` for number type input ([853a6c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/853a6c394183a22256940da406957253a9555ec9))
- **number-input:** text mode should also apply min/max/step attributes to `input` ([5a889f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/5a889f98b27d74119511783a16ea4506b2d64da3))
- **tree-view:** `expandNodes` should expand all by default ([b445c59](https://github.com/carbon-design-system/carbon-components-svelte/commit/b445c59c23033da4478f1ba3e071594a2f894e25))
- **tree-view:** escape node ID when using `querySelector` for focusing ([f8fce52](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8fce52a39d24e1a5b420bdf7e0aa78a4aa321d9))

### Performance

- **combo-box:** use Set/Map for O(1) lookups ([88f5c3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/88f5c3ca0b1f30ab2ceb6ed2beb7f6d40270d24c))
- **data-table:** avoid virtualized scroll set-up after any reactive update ([02b619c](https://github.com/carbon-design-system/carbon-components-svelte/commit/02b619cc7687bc950fef8d75934ce2e6c4354341))
- **data-table:** guard rows assignment with reference check ([f7ae1c6](https://github.com/carbon-design-system/carbon-components-svelte/commit/f7ae1c6b6f6851a0fccbdeb98ee6049d0ef8cc30))
- **data-table:** rebuild `tableCellsByRowId` for changed headers only ([7adacb3](https://github.com/carbon-design-system/carbon-components-svelte/commit/7adacb347f72a68997ad7a7131375632bcf1307e))
- **data-table:** remove unused `thKeys` computation ([ff2cae4](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff2cae419b540d94d3ed1f026285f3bf9b1cbeaa))
- **dropdown:** use Set/Map for O(1) lookups ([5f1bc01](https://github.com/carbon-design-system/carbon-components-svelte/commit/5f1bc014af5572a5dbd7a865c56b2ae29ac0cc30))
- **multi-select:** avoid double re-sort for `selectionFeedback="top"` ([f1ba47f](https://github.com/carbon-design-system/carbon-components-svelte/commit/f1ba47fcd6af7d2cc65d731936aca98fe08577c8))
- **multi-select:** optimize `isSelectAll` logic ([f6250b0](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6250b00deefb799ca4343f12b788d64cae6ee16))
- **multi-select:** use Set/Map for O(1) lookups ([5ce7d39](https://github.com/carbon-design-system/carbon-components-svelte/commit/5ce7d3942752aef0fdda16dd029223ce213114d7))
- **number-input:** cache `Intl.NumberFormat` locale usage ([e98bbd5](https://github.com/carbon-design-system/carbon-components-svelte/commit/e98bbd5178e824a0df2e9f87492acdb20b21f807))
- **tree-view:** remove unused tree walker reactive initialization ([b115ce2](https://github.com/carbon-design-system/carbon-components-svelte/commit/b115ce25d00bc34c1628243557f3874834868772))

### [0.105.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.105.0...v0.105.1) (2026-04-01)

### Bug Fixes

- **composed-modal:** use mouse events for outside click ([7104ac4](https://github.com/carbon-design-system/carbon-components-svelte/commit/7104ac4957539ede9ed4d02784bf4c8513ea249e)), closes [#2805](https://github.com/carbon-design-system/carbon-components-svelte/issues/2805)
- **modal:** use mouse events for outside click ([3a8fa07](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a8fa07ff7ddca1100d2a6c8e52cbe3deb72a974)), closes [#2805](https://github.com/carbon-design-system/carbon-components-svelte/issues/2805)

### [0.105.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.104.0...v0.105.0) (2026-03-28)

### Features

- **ui-shell:** support theming ([83af86b](https://github.com/carbon-design-system/carbon-components-svelte/commit/83af86b918402e8cd2f31a38faee233eca05afa3)), closes [#2457](https://github.com/carbon-design-system/carbon-components-svelte/issues/2457)

### Bug Fixes

- **ui-shell:** `HeaderSearch` does not render clear button if inactive ([089fb86](https://github.com/carbon-design-system/carbon-components-svelte/commit/089fb86570b9f17ecbe3bcefebec099f4c857649))

### [0.104.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.103.0...v0.104.0) (2026-03-28)

### Features

- **code-snippet:** portal tooltip inside modal context ([7821456](https://github.com/carbon-design-system/carbon-components-svelte/commit/7821456430d28dc71dd5f2b352589f8e0f72be25)), closes [#386](https://github.com/carbon-design-system/carbon-components-svelte/issues/386)
- **combo-box:** add `selectTextOnFocus` prop ([e0554a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/e0554a04fbe275cf56917387bf113bdccccfaf7d))
- **content-switcher:** add `selectionMode` prop ([ef0fb0a](https://github.com/carbon-design-system/carbon-components-svelte/commit/ef0fb0a27d147e152c08b272f6f35d2d585bd07d))
- **context-menu:** `e.preventDefault()` prevents menu from closing ([66d08bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/66d08bcd1eb7f613157f0da3997e4ec5e25e4cc9))
- **copy-button:** portal tooltip inside modal context ([10f109f](https://github.com/carbon-design-system/carbon-components-svelte/commit/10f109f83000fbad016a67539705b26b6742acbc))
- **file-uploader:** `iconDescription` passes back file metadata ([80730e6](https://github.com/carbon-design-system/carbon-components-svelte/commit/80730e67effa36f5ca00216c22088dc8e0091da8))
- **file-uploader:** `iconDescription` uses better defaults ([252d536](https://github.com/carbon-design-system/carbon-components-svelte/commit/252d5363bb3409bef4a7032afadb6caecd0d50e0))
- **file-uploader:** add `orderFiles` prop ([70a939a](https://github.com/carbon-design-system/carbon-components-svelte/commit/70a939a050a339594a0b75101899790bd3369e33)), closes [#2775](https://github.com/carbon-design-system/carbon-components-svelte/issues/2775)
- **file-uploader:** add `preventDuplicates` prop ([b867814](https://github.com/carbon-design-system/carbon-components-svelte/commit/b8678148956cc842aa7d7a35956f6d4d8f9af83b))
- **file-uploader:** dispatch clear and change events when clearing files ([6ca7acc](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ca7acc278e591808c77d1d43f5bb5ca1ff5f88a))
- **file-uploader:** dispatch rejected event if file exceeds `maxFileSize` ([f4a9cc6](https://github.com/carbon-design-system/carbon-components-svelte/commit/f4a9cc618dedee92d3ba24593c26197113e2148d))
- **floating-portal:** add `intrinsicAlign` prop ([6731628](https://github.com/carbon-design-system/carbon-components-svelte/commit/673162838927531a3c2a9805d4e314d6e781e3ad))
- **floating-portal:** support `intrinsicWidth` prop ([d98fddc](https://github.com/carbon-design-system/carbon-components-svelte/commit/d98fddc0bf5cbbebecfc715d94a1ebc8031c8ec0))
- **floating-portal:** support left/right directions, gap props ([01d07ac](https://github.com/carbon-design-system/carbon-components-svelte/commit/01d07acb3c092c5c3e0e7a845157ead67eb0079a))
- **multi-select:** support `isSelectAll` item option ([a97b2b7](https://github.com/carbon-design-system/carbon-components-svelte/commit/a97b2b7ddfc4f0e128faa43e655a6fb3b58f9c71))
- **skeleton-icon:** add `SkeletonIcon` component ([d91ed6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d91ed6aeac4c715d82c0924c7af8e5aa328ba6b2))
- **skeleton-placeholder:** add size/width/height props ([4f364ce](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f364cee9096c4e77bee0c0be8371d0692f94deb))
- **tag:** add `SelectableTag` ([9314882](https://github.com/carbon-design-system/carbon-components-svelte/commit/931488293e086662827834c04f46547b1c9bc21a)), closes [#2763](https://github.com/carbon-design-system/carbon-components-svelte/issues/2763)
- **theme:** set `color-scheme` on root element ([0c69e41](https://github.com/carbon-design-system/carbon-components-svelte/commit/0c69e41555133c754bc39945e126ca6823cf1f7b))
- **tooltip-definition:** add `clickToOpen` prop ([4960a6c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4960a6c1287cb34d40f377c42efc5ba8e2094fe3)), closes [#2761](https://github.com/carbon-design-system/carbon-components-svelte/issues/2761)
- **tooltip-definition:** add `enterDelayMs` and `leaveDelayMs` props ([454e392](https://github.com/carbon-design-system/carbon-components-svelte/commit/454e39260ef7aa6783e50c2ed7020e3fed6ea412))
- **tooltip-definition:** portal tooltip inside modal context ([05b7293](https://github.com/carbon-design-system/carbon-components-svelte/commit/05b72939ed9364a2cb9ba11b74658c0c1399f37b))
- **tooltip-icon:** add `enterDelayMs` and `leaveDelayMs` props ([5678ce3](https://github.com/carbon-design-system/carbon-components-svelte/commit/5678ce3d27f554a8369b182f59f3fca84d370c0f))
- **tooltip-icon:** add `open` prop and open/close events ([33585f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/33585f979cd07ac7358b1ba2afbf8952f500cf16))
- **tooltip-icon:** portal tooltip inside modal context ([db287f5](https://github.com/carbon-design-system/carbon-components-svelte/commit/db287f598875f863f9e885e74c9b6de1c63e7f80))
- **tooltip:** portal tooltip inside modal context ([71c153d](https://github.com/carbon-design-system/carbon-components-svelte/commit/71c153dd94e9664e41586fc76c7cc8fb18c1ea5c))

### Bug Fixes

- **context-menu:** auto-indent option with icon ([4a1f32c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4a1f32c87583cb00b378600248bbb33ae3b74c5a))
- **data-table:** custom sort accounts for sort direction ([#2797](https://github.com/carbon-design-system/carbon-components-svelte/issues/2797)) ([388709a](https://github.com/carbon-design-system/carbon-components-svelte/commit/388709a3604ce223942773c75b5f42b1ba6c2ea5))
- **file-uploader:** use stable file IDs ([ea2608f](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea2608f604b7a9eb42a94dc16ab9aa6d4351e110))
- **inline-notification:** title uses `strong` element for emphasis ([#2750](https://github.com/carbon-design-system/carbon-components-svelte/issues/2750)) ([5385c00](https://github.com/carbon-design-system/carbon-components-svelte/commit/5385c006101cd0203521fdcb9ed9ffcbb932b03e))
- **password-input:** portal tooltip inside modal context ([3930789](https://github.com/carbon-design-system/carbon-components-svelte/commit/39307898d4c40a220bac6da73a78c29bc8b529ac)), closes [#545](https://github.com/carbon-design-system/carbon-components-svelte/issues/545) [#1603](https://github.com/carbon-design-system/carbon-components-svelte/issues/1603)
- **toolbar-search:** remove redundant `<any>` from Row generics ([6657a61](https://github.com/carbon-design-system/carbon-components-svelte/commit/6657a6103b4086949d1a54b1f1591bcc54f7c4a7))
- **tooltip-icon:** only one tooltip is visible at a time ([d93c795](https://github.com/carbon-design-system/carbon-components-svelte/commit/d93c7951e1daec70141c5bbe4cd916fc48eaa3d6))
- **types:** remove unnecessary `[@template](https://github.com/template)` JSDoc type ([bed6a59](https://github.com/carbon-design-system/carbon-components-svelte/commit/bed6a597355649d688784f7f4bbd24e83801ae5b))
- **ui-shell:** ensure `HeaderAction` button styles match spec ([309d62e](https://github.com/carbon-design-system/carbon-components-svelte/commit/309d62ee2f1e48849d58e37fb56a4277ec8a85ed))
- **ui-shell:** ensure search close button hover style is preserved ([f8d1df1](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8d1df1bad5b313c465b6a76be592109a172974f))

### [0.103.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.102.0...v0.103.0) (2026-03-09)

### Features

- **button:** `icon` is generic ([a7e7df7](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7e7df73caf3503b2e3f1580d681507494164646))
- **checkbox:** `value` is generic ([478bbc3](https://github.com/carbon-design-system/carbon-components-svelte/commit/478bbc33f72fc65b85de97d55c0d8edbfa9f1307))
- **contained-list:** `icon` is generic ([d8c4e6d](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8c4e6d29a88c5a3a32f7c8de6a96ece07eac6d4))
- **context-menu-option:** `icon` is generic ([fb55602](https://github.com/carbon-design-system/carbon-components-svelte/commit/fb55602cf50a6d4e48c2ee9d3c706640ac9ebd7a))
- **file-uploader-button:** `icon` is generic ([6d23ae9](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d23ae94f4f6a30880642077d40834f5da6dd3ac))
- **link:** `icon` is generic ([519fe6f](https://github.com/carbon-design-system/carbon-components-svelte/commit/519fe6f33972dce7c44b7d3c8e09cfb2986bd800))
- **local-storage:** `value` is generic ([f6c5402](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6c5402fa8f7144f5b769bb46b5ee1562db75e27))
- **modal-footer:** `primaryButtonIcon` is generic ([ea83bd6](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea83bd6d60dd099c7e5d7198c577caf676609017))
- **modal:** `primaryButtonIcon` is generic ([98029d6](https://github.com/carbon-design-system/carbon-components-svelte/commit/98029d694713d70999ef8703f23e477b8d13c341))
- **notification-button:** `icon` is generic ([a8bb771](https://github.com/carbon-design-system/carbon-components-svelte/commit/a8bb771f0299a9ae618fafbb1afd2a8ba4ca6731))
- **overflow-menu:** `icon` is generic ([3be481f](https://github.com/carbon-design-system/carbon-components-svelte/commit/3be481f8446ecdaa83e1de1a21b8dd447c6a5711))
- **search:** `icon` is generic ([09bace4](https://github.com/carbon-design-system/carbon-components-svelte/commit/09bace4f48b9a292052a5087f288139900bea257))
- **search:** `value` is generic ([72564ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/72564ad3a6309c2cd4f1df25447a58b8317fe5e4))
- **session-storage:** `value` is generic ([cab5277](https://github.com/carbon-design-system/carbon-components-svelte/commit/cab52775b91ad55615e67e0ce2da987e37ddb13c))
- **tab:** `icon` is generic ([cf3bf3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/cf3bf3c45a67e4bca357995b362da365033ce275))
- **tabs:** `Tab` supports `icon` prop ([c520ce6](https://github.com/carbon-design-system/carbon-components-svelte/commit/c520ce6dd204a49edddb3c567d782466f59e602b)), closes [#2729](https://github.com/carbon-design-system/carbon-components-svelte/issues/2729)
- **tabs:** container type supports `secondaryLabel` ([1c52431](https://github.com/carbon-design-system/carbon-components-svelte/commit/1c52431060e5e8b1ba4e1bb944a7ab636029c3e1)), closes [#2725](https://github.com/carbon-design-system/carbon-components-svelte/issues/2725)
- **tabs:** container type supports icons ([b4e53fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4e53fcd84bf5b24c13e40593a04c95807878122)), closes [#2724](https://github.com/carbon-design-system/carbon-components-svelte/issues/2724)
- **tabs:** support `fullWidth` ([7bf42f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/7bf42f7f9a76a98e303e9579568e154cf2dc4ae2)), closes [#2722](https://github.com/carbon-design-system/carbon-components-svelte/issues/2722)
- **tag:** `icon` is generic ([a76bc23](https://github.com/carbon-design-system/carbon-components-svelte/commit/a76bc2379534f5317e7db79aa4c1d210796ec0ff))
- **theme:** `tokens` is generic ([dbfe108](https://github.com/carbon-design-system/carbon-components-svelte/commit/dbfe1088f3a0da84116febd929802cb165f1a0f7))
- **toolbar-batch-actions:** `id` is generic ([ef743b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/ef743b4b114bf82acd3e300c65b93b755ce697d1))
- **tooltip-icon:** `icon` is generic ([a1f8f74](https://github.com/carbon-design-system/carbon-components-svelte/commit/a1f8f74ec6a9ca72d0a79e4eea5ce6a8a55b5192))
- **tooltip:** `icon` is generic ([1e01218](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e01218c5528506e9a74218cc6e2da2927c2d6b5))
- **tree-view-node:** `icon` is generic ([cfd460a](https://github.com/carbon-design-system/carbon-components-svelte/commit/cfd460a79b5700a56e3bcf48d071e83a30f6b52a))
- **ui-shell:** `icon` is generic ([22f1d24](https://github.com/carbon-design-system/carbon-components-svelte/commit/22f1d248e6f2320eaf44b9e03ed9b6b8749d02b3))

### Bug Fixes

- **breakpoint:** guard `breakpointObserver` find result and derived callbacks ([0478240](https://github.com/carbon-design-system/carbon-components-svelte/commit/0478240dda88bbe8a75783df10e748d65e7b979d))
- **combo-box:** use `labelText` as aria-label fallback ([b997f69](https://github.com/carbon-design-system/carbon-components-svelte/commit/b997f6936f42a8bfb3d9df1bddd26b5fd524176b)), closes [#2715](https://github.com/carbon-design-system/carbon-components-svelte/issues/2715)
- **data-table:** guard `resolvePath` pathCache.delete and segments ([aad08b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/aad08b6f42c5e96c8e99bfce6ceeb9a60d6e6190))
- **date-picker:** add null safety check for `createCalendar`, guard `RangePlugin` use ([d4dacdc](https://github.com/carbon-design-system/carbon-components-svelte/commit/d4dacdceff0a781ac53b65c2cedfe37e6e165a62))
- **tabs:** container type disabled tab should not apply border on hover ([bdfae5a](https://github.com/carbon-design-system/carbon-components-svelte/commit/bdfae5a3d34fc464e5ea6637995284256bcc3654))
- **tabs:** container type has background color for panel ([7c2be21](https://github.com/carbon-design-system/carbon-components-svelte/commit/7c2be21083216710dbb0c2f4910866a66f873961)), closes [#2723](https://github.com/carbon-design-system/carbon-components-svelte/issues/2723)
- **tabs:** container type should be auto-width by default ([0713704](https://github.com/carbon-design-system/carbon-components-svelte/commit/07137049110646b385f435915feffd798fd584e9)), closes [#2739](https://github.com/carbon-design-system/carbon-components-svelte/issues/2739)
- **truncate:** guard update() options in truncate action ([98ea6d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/98ea6d58963c889c4404f9a88526bb96bc88ced2))
- **ui-shell:** allow `SideNav` overlay to show for custom expansion breakpoint ([84eb3bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/84eb3bd54f8d35c5dd16789bcdee775381967b44)), closes [#770](https://github.com/carbon-design-system/carbon-components-svelte/issues/770)

## [0.102.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.101.4...v0.102.0) (2026-03-07)

### ⚠ BREAKING CHANGES

- **data-table:** rename `expanded-row` slot to `expandedRow` for Svelte 5 snippet support

### Features

- **data-table:** add `sortAlways` prop ([44a85ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/44a85eaf98ddb5338a4b077813b72e6c69e738ec)), closes [#2697](https://github.com/carbon-design-system/carbon-components-svelte/issues/2697)
- **data-table:** allow custom expand icon ([65349c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/65349c4968abf3285a878acc0a34ed33bf6acb51)), closes [#2696](https://github.com/carbon-design-system/carbon-components-svelte/issues/2696)
- **session-storage:** add `SessionStorage` component ([d63670a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d63670a495707288eea17767c34365772f64577c)), closes [#2695](https://github.com/carbon-design-system/carbon-components-svelte/issues/2695)

### Bug Fixes

- **tag:** filterable tag supports `click` event on tag body ([aaf15a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/aaf15a125f5c103b9e1e0058179b062eb987699c)), closes [#2694](https://github.com/carbon-design-system/carbon-components-svelte/issues/2694)
- **tree-view:** use correct leaf depth to restore active node style ([7fda0f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/7fda0f71ddc6ef2464b62f99dedc71961651dc8d))

### [0.101.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.101.3...v0.101.4) (2026-02-26)

### Bug Fixes

- **ui-shell:** remove incorrect role="menu" from `SideNavMenu` ([#2704](https://github.com/carbon-design-system/carbon-components-svelte/issues/2704)) ([6d6cd02](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d6cd0210c985675f06f85e2cf4936d010bb787b))

### Performance

- **date-picker:** hoist regex to module scope in `DatePickerInput` ([#2705](https://github.com/carbon-design-system/carbon-components-svelte/issues/2705)) ([e30d3afe](https://github.com/carbon-design-system/carbon-components-svelte/commit/e30d3afef86142e43913e94caf8344e9b42e7c65))
- **data-table:** extract and hoist row click ignore regex to `shouldIgnoreRowClick` utility ([#2705](https://github.com/carbon-design-system/carbon-components-svelte/issues/2705)) ([5b832f5a](https://github.com/carbon-design-system/carbon-components-svelte/commit/5b832f5ad6fe003c7cb31de0dad99e3c594adf63))

### [0.101.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.101.2...v0.101.3) (2026-02-25)

### Bug Fixes

- **ui-shell:** fixed `SideNav` should not render hamburger menu or unset left margin ([4f2db4b](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f2db4bfd7bf6b5199c59562dcde9cc0c61dd697)), closes [#2701](https://github.com/carbon-design-system/carbon-components-svelte/issues/2701)

### [0.101.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.101.1...v0.101.2) (2026-02-23)

### Bug Fixes

- **dropdown:** menu should close if `portalMenu` is true ([09a4a91](https://github.com/carbon-design-system/carbon-components-svelte/commit/09a4a91aeb9ee01b88e94a1cd5454ebb3b96ed02)), closes [#2699](https://github.com/carbon-design-system/carbon-components-svelte/issues/2699)

### [0.101.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.101.0...v0.101.1) (2026-02-21)

### Bug Fixes

- **composed-modal:** auto-focus first input for transactional dialogs ([1e4abac](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e4abac06187cddc8befe753437ae2b727002fe7)), closes [#2671](https://github.com/carbon-design-system/carbon-components-svelte/issues/2671)
- **composed-modal:** auto-focus secondary button for danger modals ([445c343](https://github.com/carbon-design-system/carbon-components-svelte/commit/445c3437d2a2ee1f8b8a852cab6fd4cab13fd0bf))
- **date-picker:** don't escape hyphens in derived input pattern ([7476b77](https://github.com/carbon-design-system/carbon-components-svelte/commit/7476b7707d74496cf6d37c9b4d0558f299101845)), closes [#2689](https://github.com/carbon-design-system/carbon-components-svelte/issues/2689)
- **modal:** auto-focus first input for transactional dialogs ([bdc7728](https://github.com/carbon-design-system/carbon-components-svelte/commit/bdc7728a77e344e10bd11c43462fd84e930a7061)), closes [#2671](https://github.com/carbon-design-system/carbon-components-svelte/issues/2671)
- **modal:** auto-focus secondary button for danger modals ([0bd8148](https://github.com/carbon-design-system/carbon-components-svelte/commit/0bd8148188c6721120e45b3a269184de759816ab))
- **tooltip:** show tooltip on hover ([0f148fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f148fc3623cdd62741a69de4e6346044351e964)), closes [#2687](https://github.com/carbon-design-system/carbon-components-svelte/issues/2687)
- **types:** replace `any` with inferred generics and `unknown` ([d30aec2](https://github.com/carbon-design-system/carbon-components-svelte/commit/d30aec2001aa451f2ea043ebfcfab96e851e23bc))

## [0.101.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.100.0...v0.101.0) (2026-02-16)

### ⚠ BREAKING CHANGES

- apply `carbon:` prefix to contexts

### Features

- **checkbox-group:** add `CheckboxGroup` ([935b4de](https://github.com/carbon-design-system/carbon-components-svelte/commit/935b4de2aa84771c744f53a0fe3507da67cf908b))
- **combo-box:** add `portalMenu` prop ([ee0c452](https://github.com/carbon-design-system/carbon-components-svelte/commit/ee0c4528886a8d1267b47771bf3b1b1fd0a2f269)), closes [#2632](https://github.com/carbon-design-system/carbon-components-svelte/issues/2632)
- **data-table:** support virtualized rows ([c187b72](https://github.com/carbon-design-system/carbon-components-svelte/commit/c187b7295a546337f7564fe9c93771ca651f3a74)), closes [#1192](https://github.com/carbon-design-system/carbon-components-svelte/issues/1192)
- **date-picker:** add `portalMenu` prop ([6d11f3e](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d11f3ec2a6cef2e525a2c9ea158d14222d70e9a)), closes [#2632](https://github.com/carbon-design-system/carbon-components-svelte/issues/2632)
- **dropdown:** add `portalMenu` prop ([43b7b8a](https://github.com/carbon-design-system/carbon-components-svelte/commit/43b7b8abb920b5fbb403de24dca21c10d91f7e92)), closes [#2142](https://github.com/carbon-design-system/carbon-components-svelte/issues/2142)
- **expandable-tile:** add `hasInteractiveContent` prop ([4e345f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e345f8d06ce95a331567afde7f8ff3023b32a54))
- **floating-portal:** add `FloatingPortal` ([532066a](https://github.com/carbon-design-system/carbon-components-svelte/commit/532066a448a0ffa2ba89497c6d96327a24d8188e))
- **list-box-menu:** add portal support ([8d425c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/8d425c46e6522f49050aca3b59ffb7c1397842f6))
- **multi-select:** add `portalMenu` prop ([e099432](https://github.com/carbon-design-system/carbon-components-svelte/commit/e099432c8dce9ae8402ef6035d60ada2b746acf5))
- **overflow-menu:** add `portalMenu` prop ([20dfaea](https://github.com/carbon-design-system/carbon-components-svelte/commit/20dfaea72aefb997ee31bb2d0843fbe2fcb82b35))
- **portal:** add `ref` prop for element access ([48d1676](https://github.com/carbon-design-system/carbon-components-svelte/commit/48d1676f589c4fc77ef213101374e53fa26018ba))
- **radio-button-group:** `selected` value is generic ([86891eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/86891eba4839d8fee12dfe7fe20385f1c8cfc4b1))
- **radio-button:** `selected` value is generic ([128ee38](https://github.com/carbon-design-system/carbon-components-svelte/commit/128ee388ec8fd3bad0a14d4bc2242c0947e4c5e3))
- **radio-tile:** `value` is generic ([5e942b3](https://github.com/carbon-design-system/carbon-components-svelte/commit/5e942b3f37aa2faab6bc0ba33675543c6f10e18b))
- **select-item:** `value` is generic ([36fd42a](https://github.com/carbon-design-system/carbon-components-svelte/commit/36fd42a8184d77e3092992bd4f74cce6f8e45025))
- **stack:** add `inline` prop for `inline-flex` display ([5710717](https://github.com/carbon-design-system/carbon-components-svelte/commit/5710717afcf94dda75cee09a906ebc9c573f112f))
- **structured-list:** `selected` value is generic ([a725ed8](https://github.com/carbon-design-system/carbon-components-svelte/commit/a725ed8cd55f498d255911e440a54b175c939114))

### Bug Fixes

- **button:** prevent icon-only button tooltip from triggering wrong action ([727573b](https://github.com/carbon-design-system/carbon-components-svelte/commit/727573b5df50a2aa012a70f592a85071eb806c27)), closes [#937](https://github.com/carbon-design-system/carbon-components-svelte/issues/937)
- **composed-modal:** focus primary button if it exists ([6e8a2b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e8a2b1ade683eae2d3f8d4868c9a0af91edb4ca))
- **composed-modal:** return focus to trigger element ([02a6b3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/02a6b3a678db823b83b8212483504ba482fb29ac))
- **date-picker:** derive input pattern from `dateFormat` prop ([a98c85b](https://github.com/carbon-design-system/carbon-components-svelte/commit/a98c85b78acf4a2209d6be6164a7955b680747f9)), closes [#1362](https://github.com/carbon-design-system/carbon-components-svelte/issues/1362)
- **date-picker:** sync "to" input after programmatic range update ([8815b89](https://github.com/carbon-design-system/carbon-components-svelte/commit/8815b8962b44a1cc5bedec454a8a9481e26303d3)), closes [#893](https://github.com/carbon-design-system/carbon-components-svelte/issues/893)
- **date-picker:** use correct variable in `calendar.set` loop ([0f2542f](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f2542f65779bb13703565bbe3ea3a22adceccd5))
- **expandable-tile:** prevent height animation on initial load ([38ce08e](https://github.com/carbon-design-system/carbon-components-svelte/commit/38ce08efa4ee28f6f9f6a481d375a5575cedb660))
- **modal:** focus primary button if it exists ([d6b1885](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6b1885df64b12788698f4880a9259d963a72223)), closes [#2671](https://github.com/carbon-design-system/carbon-components-svelte/issues/2671)
- **modal:** return focus to trigger element ([ad7db12](https://github.com/carbon-design-system/carbon-components-svelte/commit/ad7db12b2eaaea5eb0beb1b91a305fc37194544e))
- **overflow-menu:** `OverflowMenuItem` has explicit `type="button"` to prevent form submission ([6df3d81](https://github.com/carbon-design-system/carbon-components-svelte/commit/6df3d819bf076581a3ca15ad19d2c485d75a6c73))
- **portal:** transfer focus to active element ([0389e9a](https://github.com/carbon-design-system/carbon-components-svelte/commit/0389e9af73952f3c8b31205f2f6efd4775067a35))
- **ui-shell:** collapse `SideNavMenu` items when rail is closed ([1669604](https://github.com/carbon-design-system/carbon-components-svelte/commit/1669604a4f810b2cd3c58c2a4aa2a65c2324d46a)), closes [#746](https://github.com/carbon-design-system/carbon-components-svelte/issues/746)
- **ui-shell:** prevent `SideNav` flicker on page load ([5c98c27](https://github.com/carbon-design-system/carbon-components-svelte/commit/5c98c27a838af3d1f50beb4e069d34e0d7a1e397)), closes [#1383](https://github.com/carbon-design-system/carbon-components-svelte/issues/1383)

## [0.100.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.99.3...v0.100.0) (2026-02-13)

### ⚠ BREAKING CHANGES

- **number-input:** blur event is dispatched, not forwarded; access event through `e.detail.event`

### Features

- **data-table:** add `rowClass` prop ([740aad9](https://github.com/carbon-design-system/carbon-components-svelte/commit/740aad927e6511b9eb8cf77a394c91c6a0b0b575))
- **dropdown:** add `labelChildren` slot ([7920fd5](https://github.com/carbon-design-system/carbon-components-svelte/commit/7920fd5d4dd38968b5a763bdf8859891c5c28ac5))
- **number-input:** add `disableWheel` prop ([e651f9b](https://github.com/carbon-design-system/carbon-components-svelte/commit/e651f9bf15564c894463f2aa90f9d6791829628e)), closes [#2609](https://github.com/carbon-design-system/carbon-components-svelte/issues/2609)
- **number-input:** add `stepStartValue` prop ([afdd567](https://github.com/carbon-design-system/carbon-components-svelte/commit/afdd567c6b483f83a54a67c85aa162def895d1cd)), closes [#2610](https://github.com/carbon-design-system/carbon-components-svelte/issues/2610)
- **number-input:** add validation with auto min/max, locale formatting, `validate` prop ([31b29be](https://github.com/carbon-design-system/carbon-components-svelte/commit/31b29bebcd45bfd38ae157812601eb3fe46b51f1)), closes [#2614](https://github.com/carbon-design-system/carbon-components-svelte/issues/2614) [#2615](https://github.com/carbon-design-system/carbon-components-svelte/issues/2615) [#2616](https://github.com/carbon-design-system/carbon-components-svelte/issues/2616)
- **number-input:** dispatch blur, `click:stepper` events with `value` ([ea3135a](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea3135a31ffda929e1fec7ecc438e60791b513ab)), closes [#2611](https://github.com/carbon-design-system/carbon-components-svelte/issues/2611) [#2617](https://github.com/carbon-design-system/carbon-components-svelte/issues/2617) [#2618](https://github.com/carbon-design-system/carbon-components-svelte/issues/2618)
- **pagination:** add `dynamicPageSizes` prop ([b748b0c](https://github.com/carbon-design-system/carbon-components-svelte/commit/b748b0cea9f6e0bbaf231ac558a665c28c637a0c))
- **tooltip-icon:** add `size` prop ([7469b7d](https://github.com/carbon-design-system/carbon-components-svelte/commit/7469b7d86fca4a041e9fe2a892aa582b229bbd66)), closes [#2587](https://github.com/carbon-design-system/carbon-components-svelte/issues/2587)

### [0.99.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.99.2...v0.99.3) (2026-02-03)

### Bug Fixes

- **text-input:** inline variant supports `labelChildren` slot ([78a065f](https://github.com/carbon-design-system/carbon-components-svelte/commit/78a065f492183603dfd5247c3ebb60628194d44e)), closes [#2625](https://github.com/carbon-design-system/carbon-components-svelte/issues/2625)

### [0.99.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.99.1...v0.99.2) (2026-02-02)

### Bug Fixes

- **code-snippet:** allow empty value for `aria-label` ([1f2b40b](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f2b40bbf1a110ef49406ea9687c93d8303ea00b))
- **code-snippet:** type definitions include `$$restProps` ([cba89af](https://github.com/carbon-design-system/carbon-components-svelte/commit/cba89afc490fe5560bfb3aea44fc9b5479e781f5))
- **combo-box:** `virtualConfig.overscan` allows 0 ([dbce40d](https://github.com/carbon-design-system/carbon-components-svelte/commit/dbce40d1580b739810986367f73495d70bbc42f1))
- **combo-box:** allow empty `item.text` and `aria-label` ([3d2447a](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d2447a8b410c1ecd51f784fa61dffe06d3fb2ca))
- **composed-modal:** allow empty value for `aria-label` ([27508e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/27508e76cae4bff55909d7289b2ce4ae9a5ae275))
- **data-table:** allow empty `header.key` and 0 for `header.width` ([86e8cc0](https://github.com/carbon-design-system/carbon-components-svelte/commit/86e8cc09abaf71240cfedde636a3343b066cae28))
- **data-table:** default string sorting is case- and accent-insensitive ([aada03e](https://github.com/carbon-design-system/carbon-components-svelte/commit/aada03e4efbd93aee6a6db3e0dd8a37d87a5fb3b))
- **dropdown:** `virtualConfig.overscan` allows 0 ([e9fef81](https://github.com/carbon-design-system/carbon-components-svelte/commit/e9fef814489bc670dee5b216e2b2d18af4afeb8a))
- **dropdown:** allow empty `item.text` ([46e661e](https://github.com/carbon-design-system/carbon-components-svelte/commit/46e661e07c888d19eef8ae474c7020646e7d328f))
- **form-group:** allow empty value for `aria-labelledby` ([2f25c87](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f25c87a2061c7e7b1824bb39d57d55bbd4a619c))
- **modal:** allow empty value for `aria-label` ([7d79eaf](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d79eaf11a25f28e045e9b798ad5be41d7bfc6c9))
- **multi-select:** allow empty `item.text` and `aria-label` ([151118b](https://github.com/carbon-design-system/carbon-components-svelte/commit/151118b072c2e1653bddd7afa70edb98b9d37ebb))
- **number-input:** dynamically set `aria-describedby` based on state ([6fa377d](https://github.com/carbon-design-system/carbon-components-svelte/commit/6fa377dc9b50bca2f7426741a9332556b2bbd054)), closes [#2613](https://github.com/carbon-design-system/carbon-components-svelte/issues/2613)
- **number-input:** preserve value during invalid decimal input ([9ba0bc9](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ba0bc9cdef31050bfd4010b9c6d4d6bae0e5c40))
- **number-input:** support locale-specific decimal separators ([7665b23](https://github.com/carbon-design-system/carbon-components-svelte/commit/7665b2327da8b18e3e47b4456443874da8409b1e)), closes [#2547](https://github.com/carbon-design-system/carbon-components-svelte/issues/2547)
- **overflow-menu:** allow empty value for `aria-label` ([9a26ae2](https://github.com/carbon-design-system/carbon-components-svelte/commit/9a26ae2b0137424e7d576a6317a0cce371f83f83))
- **select:** dynamically set `aria-describedby` based on state ([9639107](https://github.com/carbon-design-system/carbon-components-svelte/commit/96391075365ce0db7270fd896b05945adfe23e6c))
- **slider:** allow empty `minLabel`/`maxLabel` and `aria-label` ([ffd6d38](https://github.com/carbon-design-system/carbon-components-svelte/commit/ffd6d38f9caf2ef10a450f2fd041d189a4938991))
- **tabs:** allow empty value for `aria-label` ([2a7a133](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a7a133eca2b2c6c469ad2408f5343c5dd241159))
- **toggle:** allow empty value for `aria-label` ([ebfa493](https://github.com/carbon-design-system/carbon-components-svelte/commit/ebfa49384e1e7950ba8b35d93978d87b8b5e9b43))
- **ui-shell:** allow empty value for `aria-label` in `Header` ([32fe5b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/32fe5b1906e450c6a647431d28c449229d21cfa2))

### Performance

- **data-table:** optimize row selection/expansion lookups using Sets ([54dfd41](https://github.com/carbon-design-system/carbon-components-svelte/commit/54dfd41090ee5a4168fc0cefbebd884825f8c06b))
- **data-table:** compute selected/expanded states using `@const` ([efd5ae8](https://github.com/carbon-design-system/carbon-components-svelte/commit/efd5ae879999ef599fb67f22c72ffe66fa1522ca))
- **data-table:** recompute `tableCellsByRowId` only when rows/headers change ([b372c91](https://github.com/carbon-design-system/carbon-components-svelte/commit/b372c91feb1ceee32bbb06f12cfed7f1438e85d4))
- **data-table:** avoid redundant copy in `sortedRows` when sorting disabled ([6dd07f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/6dd07f013c8ce3902b850322b71c6a21250030c2))
- **data-table:** use Set in expand/select handlers ([a9c9101](https://github.com/carbon-design-system/carbon-components-svelte/commit/a9c910117d7d3fd378c16090dc62c02f9c935674))
- **data-table:** update `batchSelectedIds` only when selected value changes ([da603ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/da603ea59aadb0fa625ab534901872395be4299d))
- **tree-view:** use Set lookups for selected/expanded instead of array includes ([f582b05](https://github.com/carbon-design-system/carbon-components-svelte/commit/f582b052c489689e844c8f1c5b255e0f42c9590d))
- **tree-view:** guard store updates by `activeId` value equality ([f0928a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/f0928a1fe33852f1d8b88d4343b3a15a22afbc94))

### [0.99.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.99.0...v0.99.1) (2026-01-28)

### Bug Fixes

- **tree-view:** `autoCollapse` respects `activeId` ([48673a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/48673a1fcea615d9fe8518ad2c98986598ca7ea0)), closes [#2491](https://github.com/carbon-design-system/carbon-components-svelte/issues/2491)

## [0.99.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.8...v0.99.0) (2026-01-27)

### ⚠ BREAKING CHANGES

- **header:** rename slot "skip-to-content" to "skipToContent" for Svelte 5 support
- **data-table:** rename slot "cell-header" to "cellHeader" for Svelte 5 support

### Features

- **combo-box:** support virtualized items ([350a54e](https://github.com/carbon-design-system/carbon-components-svelte/commit/350a54eef3f59d0a7e7f6e109ad659c7f9849d61)), closes [#2395](https://github.com/carbon-design-system/carbon-components-svelte/issues/2395)
- **dropdown:** support virtualized items ([f15f853](https://github.com/carbon-design-system/carbon-components-svelte/commit/f15f8533b24fbdcbd702a93a2fb6433122fe8fbb)), closes [#2396](https://github.com/carbon-design-system/carbon-components-svelte/issues/2396)
- **local-storage:** auto-sync updates across tabs ([f966856](https://github.com/carbon-design-system/carbon-components-svelte/commit/f96685652a7d600d4437932527eb2d4555a95890))
- **multi-select:** support virtualized items ([a9acb11](https://github.com/carbon-design-system/carbon-components-svelte/commit/a9acb113e1f8c3493a163e661989d8b72e8dd5c4)), closes [#1623](https://github.com/carbon-design-system/carbon-components-svelte/issues/1623)
- **radio-button:** support implicit grouping via `name` attribute ([11b2684](https://github.com/carbon-design-system/carbon-components-svelte/commit/11b26845da742458a91391bb1e51137a848966a7))
- **tree-view:** add `autoCollapse` ([226d301](https://github.com/carbon-design-system/carbon-components-svelte/commit/226d3010bad9e18bd698e47fc1d5539a4bb913e9)), closes [#2491](https://github.com/carbon-design-system/carbon-components-svelte/issues/2491)
- **tree-view:** pass all tree view node props via slots ([1084461](https://github.com/carbon-design-system/carbon-components-svelte/commit/1084461369cf989690aa60b3eccdeeea72af427a))

### Bug Fixes

- **combo-box:** `clearFilterOnOpen` restores value after typing ([4e4b582](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e4b5824539041462141a4f07623d8efb67c9ab5)), closes [#2579](https://github.com/carbon-design-system/carbon-components-svelte/issues/2579)
- **combo-box:** `ComboBoxItemId` is generic, defaulting to `any` ([31336b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/31336b1ffeb1957de655056ec30608fb890cca55))
- **combo-box:** keyboard navigation starts at selected item index ([73a90aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/73a90aac72afc2c23c20ec17ada63baec10d1220))
- **data-table:** `DataTableRowId` is generic, defaulting to `any` ([aae89c0](https://github.com/carbon-design-system/carbon-components-svelte/commit/aae89c0569d827c6179a436944ae7c7ef1fadcee))
- **dropdown:** `DropdownItem` id generic, defaulting to `any` ([72820f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/72820f725ed2f3c63782c17bddc460f308b6856f)), closes [#2564](https://github.com/carbon-design-system/carbon-components-svelte/issues/2564)
- **dropdown:** keyboard navigation starts at selected item index ([23549f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/23549f6790679af0ecdd609c7099ef411988de23)), closes [#2575](https://github.com/carbon-design-system/carbon-components-svelte/issues/2575)
- **multi-select:** `MultiSelectItemId` is generic, defaulting to `any` ([01549bb](https://github.com/carbon-design-system/carbon-components-svelte/commit/01549bb67d49c0d1de58b3cf8d5bc6316b024496))
- **number-input:** add styles for `type="text"` ([83ac138](https://github.com/carbon-design-system/carbon-components-svelte/commit/83ac1382da6041b5d656a45537aba48928514ae4))
- **number-input:** allow deleting all characters if `allowDecimal` is true ([5d36b14](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d36b14db89a302e33ddad424dd1eca311f86bd1))
- **number-input:** include correct styles for `allowDecimal` input ([e32fb3e](https://github.com/carbon-design-system/carbon-components-svelte/commit/e32fb3ee0207fb25ace5229b1d7747181712676e))
- **overflow-menu:** item supports `target` and `rel` props ([61ef1ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/61ef1ba3e88393ff93aa6310cbafc50e3c19ed67)), closes [#2559](https://github.com/carbon-design-system/carbon-components-svelte/issues/2559)
- **toolbar-search:** `ToolbarSearch` preserves generic row ID types ([87b2cfe](https://github.com/carbon-design-system/carbon-components-svelte/commit/87b2cfef0d610f237de481414d5c4d738dee5123))
- **tree-view:** `TreeNodeId` is generic, defaulting to `string | number` ([3b5f8c1](https://github.com/carbon-design-system/carbon-components-svelte/commit/3b5f8c13a374d3cabdac91b9e59aee60ca100d01))
- **types:** generic component props should extend default values ([9d4b1f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d4b1f08acbbee090e04210ea42d3e1a3d892c36))

### [0.98.8](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.7...v0.98.8) (2026-01-19)

### Bug Fixes

- **code-snippet:** prevent dispatching initial "collapse" event in Svelte 5 ([81758aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/81758aaedc575fade31dccaec942e1b858f51a47)), closes [#2527](https://github.com/carbon-design-system/carbon-components-svelte/issues/2527)
- **header-search:** prevent dispatching initial "inactive" event in Svelte 5 ([0b63452](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b63452a8e965d4a8d9e4d57ea9c925d0e030141)), closes [#2532](https://github.com/carbon-design-system/carbon-components-svelte/issues/2532)
- **pagination:** prevent dispatching initial "update" event in Svelte 5 ([ab72262](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab72262494aa78d6693ecb096b9f519aee9c2a25)), closes [#2528](https://github.com/carbon-design-system/carbon-components-svelte/issues/2528)
- **search:** prevent dispatching initial "collapse" event in Svelte 5 ([7a2ebbe](https://github.com/carbon-design-system/carbon-components-svelte/commit/7a2ebbed6d5627bc58e4af2017a2743977c58445)), closes [#2529](https://github.com/carbon-design-system/carbon-components-svelte/issues/2529)
- **side-nav:** prevent dispatching initial "close" event in Svelte 5 ([3f2a6fe](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f2a6fee73186c66f2304c25f1f4d0671337c81a)), closes [#2533](https://github.com/carbon-design-system/carbon-components-svelte/issues/2533)
- **theme:** prevent dispatching initial "update" event in Svelte 5 ([7f3924b](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f3924bd193cda29a55dd1d3e6fd56628e8d843b)), closes [#2530](https://github.com/carbon-design-system/carbon-components-svelte/issues/2530)
- **tooltip-definition:** prevent dispatching initial "close" event in Svelte 5 ([edf69cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/edf69cfd0a4464b437998bc13318c4bbc37aed54)), closes [#2531](https://github.com/carbon-design-system/carbon-components-svelte/issues/2531)

### [0.98.7](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.6...v0.98.7) (2026-01-19)

### Bug Fixes

- **multi-select:** prevent dispatching initial "select" event in Svelte 5 ([e4c7797](https://github.com/carbon-design-system/carbon-components-svelte/commit/e4c7797d7ea860f600fb82d3718eeab234cf8c95)), closes [#2525](https://github.com/carbon-design-system/carbon-components-svelte/issues/2525)

## [0.98.6](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.5...v0.98.6) (2026-01-18)

### Bug Fixes

- **select:** remove unused `SelectValue` type ([123bf08](https://github.com/carbon-design-system/carbon-components-svelte/commit/123bf081eb823d08308defe32452113517f6c308))
- **theme:** pass `CarbonTheme` to generic `SelectProps` ([ca62ac9](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca62ac949a05e4c8c302ae21361cb376d007ff64))
- **ui-shell:** `SideNav` overlays `UIShell` content ([8ed59f1](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ed59f11276eb96c493dab4056d94481ae4a32ef)), closes [#2520](https://github.com/carbon-design-system/carbon-components-svelte/issues/2520) [#1463](https://github.com/carbon-design-system/carbon-components-svelte/issues/1463) [#544](https://github.com/carbon-design-system/carbon-components-svelte/issues/544)

### [0.98.5](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.4...v0.98.5) (2026-01-17)

### Bug Fixes

- **tree-view:** accessors use generic `Node` type ([0bfdfb0](https://github.com/carbon-design-system/carbon-components-svelte/commit/0bfdfb081cc725540abd763394c4f86122baf1cf))
- **types:** context types support generics ([9066426](https://github.com/carbon-design-system/carbon-components-svelte/commit/90664262cfe505d2ed1d222fbb1c6de591eaaa39))
- **types:** fix `truncate` function type ([fee3592](https://github.com/carbon-design-system/carbon-components-svelte/commit/fee3592297df95335890e79e85500a594d32e4f7))

### [0.98.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.3...v0.98.4) (2026-01-17)

### Bug Fixes

- **types:** generate default slot props for Svelte 5 `#snippet` usage ([6f5eb78](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f5eb78873d68c0dfbc76a419fdb40e64aded890)), closes [#2505](https://github.com/carbon-design-system/carbon-components-svelte/issues/2505)

### [0.98.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.2...v0.98.3) (2026-01-17)

### Bug Fixes

- **types:** named slot props for `#snippet` usage includes args ([7448035](https://github.com/carbon-design-system/carbon-components-svelte/commit/7448035711a98cf193a2b4f57aabab6bbd189f0e)), closes [#2505](https://github.com/carbon-design-system/carbon-components-svelte/issues/2505)

### [0.98.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.1...v0.98.2) (2026-01-17)

### Bug Fixes

- **multi-select:** selected options have `aria-checked` state ([aa87856](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa8785698d0b1ed6034c11209a37d94b674f1db6))
- **types:** generate named slot props for Svelte 5 `#snippet` usage ([6069a65](https://github.com/carbon-design-system/carbon-components-svelte/commit/6069a6550a46745da0dee6d422a67c945a142e38))

### [0.98.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.0...v0.98.1) (2025-12-26)

### Bug Fixes

- **checkbox:** prevent duplicate "check" event dispatches in Svelte 5 ([7b85c5f](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b85c5f4a117c8cb9f3f8882bf6dae6f63adc9b7)), closes [#2467](https://github.com/carbon-design-system/carbon-components-svelte/issues/2467)
- **combo-box:** ensure bind:value syncs when clearing via keyboard ([4f052e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f052e55e29fe1e537b7448342639832ded82552)), closes [#2470](https://github.com/carbon-design-system/carbon-components-svelte/issues/2470)
- **combo-box:** prevent dispatching initial "select" event in Svelte 5 ([38c428d](https://github.com/carbon-design-system/carbon-components-svelte/commit/38c428d8ba1bd94c3194b8321a968c550670ff58)), closes [#2472](https://github.com/carbon-design-system/carbon-components-svelte/issues/2472)
- **content-switcher:** fix focus management for Svelte 5 compatibility ([521d628](https://github.com/carbon-design-system/carbon-components-svelte/commit/521d628a688af462913527d035ebee37f5c0bad0)), closes [#2468](https://github.com/carbon-design-system/carbon-components-svelte/issues/2468)
- **data-table:** `PropertyPath` depth limit supports 4 levels ([dd0b142](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd0b142723430fd6fba262f71bce51f83bbf0f6b))
- **structured-list:** prevent dispatching initial "change" event in Svelte 5 ([5291165](https://github.com/carbon-design-system/carbon-components-svelte/commit/5291165ec8a994d7f9c4b7458d0fa15374ea502d)), closes [#2478](https://github.com/carbon-design-system/carbon-components-svelte/issues/2478)
- **toolbar-search:** replace `JSON.stringify` with custom deep comparison for filtered rows ([14a565b](https://github.com/carbon-design-system/carbon-components-svelte/commit/14a565b4e6b41de0f73751e3fb3589934054dd3e))
- **tooltip:** prevent dispatching initial "close" event in Svelte 5 ([5abd2ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/5abd2ba788090df1720402023b78f60a4aa12ff6)), closes [#2475](https://github.com/carbon-design-system/carbon-components-svelte/issues/2475)

### Performance

- **data-table:** optimize `resolvePath` utility ([41b7b6b](https://github.com/carbon-design-system/carbon-components-svelte/commit/41b7b6b9e1b4e925341da9cd75779ec79c83cc63))
- **tree-view:** optimize node traversal ([7eeb844](https://github.com/carbon-design-system/carbon-components-svelte/commit/7eeb844ca69f48fa68733c67937ceaa1030add5c))
- **tree-view:** optimize `showNode` and batch active/selected updates ([e537ba3](https://github.com/carbon-design-system/carbon-components-svelte/commit/e537ba357978051a3ae3390e1ebd2a261d224684))

### [0.98.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.97.0...v0.98.0) (2025-12-21)

### Features

- **contained-list:** add `ContainedList` and `ContainedListItem` ([836f5e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/836f5e7095b5d198422dcbfc2a0acc0c17de0235))
- **file-uploader:** add `maxFileSize` prop ([0eb5f9d](https://github.com/carbon-design-system/carbon-components-svelte/commit/0eb5f9ddcc4a761c9eaef076c7599c805bb1ef79))
- **heading:** add `Heading` and `Section` components ([c028489](https://github.com/carbon-design-system/carbon-components-svelte/commit/c0284894cff73dfc9d69298369b00d66fbc24ddc))
- **slider:** support warning state ([303ec5c](https://github.com/carbon-design-system/carbon-components-svelte/commit/303ec5c6b3dca2138c2875203705fbd23dde0c91)), closes [#2444](https://github.com/carbon-design-system/carbon-components-svelte/issues/2444)

### Bug Fixes

- **radio-tile:** forward `aria-*` attributes to input element ([489fd2c](https://github.com/carbon-design-system/carbon-components-svelte/commit/489fd2cebc40e7eb99089f25eff71cce4c515623))

### [0.97.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.96.0...v0.97.0) (2025-12-21)

### Features

- **file-uploader-button:** support `icon` ([eed238c](https://github.com/carbon-design-system/carbon-components-svelte/commit/eed238c2a2a2c3047c030c58f22a2707a395c59d)), closes [#2433](https://github.com/carbon-design-system/carbon-components-svelte/issues/2433)
- **slider:** support `invalidText` ([9588710](https://github.com/carbon-design-system/carbon-components-svelte/commit/9588710de94231f3389e8d924f739ad9f86bc410)), closes [#2445](https://github.com/carbon-design-system/carbon-components-svelte/issues/2445)
- **slider:** support `readOnly` ([494cb55](https://github.com/carbon-design-system/carbon-components-svelte/commit/494cb55ee510d0026892b1f40844cd7bee59ede7)), closes [#2443](https://github.com/carbon-design-system/carbon-components-svelte/issues/2443)
- **stack:** add `align` and `justify` props ([9044402](https://github.com/carbon-design-system/carbon-components-svelte/commit/90444027b9d4870f078411e0482ab4e6d28692c0))

### Bug Fixes

- **file-uploader-button:** prevent crash when `files` is cleared ([5ce7a04](https://github.com/carbon-design-system/carbon-components-svelte/commit/5ce7a04f1a518c7ca414df378d1ba85182d584a9)), closes [#2436](https://github.com/carbon-design-system/carbon-components-svelte/issues/2436)
- **slider:** fix typo in `labelText` prop description ([e4f4ed0](https://github.com/carbon-design-system/carbon-components-svelte/commit/e4f4ed0a9d216420778432cbf3f514ca6e1cfd85))
- **tree-view-node:** make `findParentTreeNode` and `computeTreeLeafDepth` stricter ([d91295b](https://github.com/carbon-design-system/carbon-components-svelte/commit/d91295b1c6156e3d9a1df2c77b2dda35c58af50e))

## [0.96.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.95.1...v0.96.0) (2025-12-14)

### ⚠ BREAKING CHANGES

- **radio-button-group:** change `legendText` slot to `legendChildren`
- **tile-group:** rename `legend` to `legendText`
- **selectable-tile-group:** rename `legend` to `legendText`
- **data-table:** change `title`/`description` slots to `titleChildren`, `descriptionChildren`
- **inline-notification:** change `title`/`subtitle`/`caption` slot names to `titleChildren`/`subtitleChildren`/`captionChildren`
- **toast-notification:** change `title`/`subtitle`/`caption` slot names to `titleChildren`/`subtitleChildren`/`captionChildren`
- **header:** change `company` prop to `companyText`
- **header-action:** change `text` slot to `textChildren`
- **context-menu-option:** change `labelText` slot to `labelChildren`
- **file-uploader-drop-container:** change `labelText` slot to `labelChildren`
- **file-uploader-button:** change `labelText` slot to `labelChildren`
- **number-input:** change `labelText` slot to `labelChildren`
- **text-area:** change `labelText` slot to `labelChildren`
- **text-input:** change `labelText` slot to `labelChildren`
- **password-input:** change `labelText` slot to `labelChildren`
- **date-picker-input:** change `labelText` slot to `labelChildren`
- **toggle-skeleton:** change `labelText` slot to `labelChildren`
- **toggle:** change `labelText` slot to `labelChildren`
- **search:** change `labelText` slot to `labelChildren`
- **multi-select:** change `labelText` slot to `labelChildren`
- **select:** change `labelText` slot to `labelChildren`
- **combo-box:** change `labelText` slot to `labelChildren`
- **progress-bar:** change `labelText` slot to `labelChildren`
- **slider:** change `labelText` slot to `labelChildren`
- **checkbox:** change `labelText` slot to `labelChildren`
- **tree-view:** change `labelText` slot to `labelChildren`
- **radio-button:** change `labelText` slot to `labelChildren`
- **time-picker:** change `labelText` slot to `labelChildren`
- **time-picker-select:** change `labelText` slot to `labelChildren`

### Features

- **inline-notification:** add `open` prop ([63058c6](https://github.com/carbon-design-system/carbon-components-svelte/commit/63058c6b3f12f9b4ced0c5123b02569273fda60b)), closes [#630](https://github.com/carbon-design-system/carbon-components-svelte/issues/630)
- **selectable-tile-group:** add `legendChildren` slot ([ddb6abd](https://github.com/carbon-design-system/carbon-components-svelte/commit/ddb6abd78b1912b30b7764a4ed3c4beb03c81536))
- **stack:** support `gap={0}` ([e374436](https://github.com/carbon-design-system/carbon-components-svelte/commit/e374436204adac6cae8a665b4eaa39efd8c6616e)), closes [#2426](https://github.com/carbon-design-system/carbon-components-svelte/issues/2426)
- **tile-group:** add `legendChildren` slot ([4ff133b](https://github.com/carbon-design-system/carbon-components-svelte/commit/4ff133b202c45a47f7e287d4479d8bccdfc35566))
- **toast-notification:** add `open` prop ([d703135](https://github.com/carbon-design-system/carbon-components-svelte/commit/d70313509920c11687bf91b5709e470d8cbe259b))

### Bug Fixes

- **pagination:** update JSDoc descriptions for dispatched events ([4588944](https://github.com/carbon-design-system/carbon-components-svelte/commit/4588944c4c394cf45ebc61c40dfa85288df4d30d))
- **stack:** include styles for individual themes ([397ccba](https://github.com/carbon-design-system/carbon-components-svelte/commit/397ccbaf33fa9f9720eaece4096d8e508df7da62)), closes [#2417](https://github.com/carbon-design-system/carbon-components-svelte/issues/2417)
- **time-picker:** allow longer labels ([3d1d187](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d1d1876e0ad43ea268be713df4a91e682165f73)), closes [#1749](https://github.com/carbon-design-system/carbon-components-svelte/issues/1749)

### [0.95.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.95.0...v0.95.1) (2025-12-04)

### Bug Fixes

- **toolbar:** omit `inert` when batch actions are not present ([667fe61](https://github.com/carbon-design-system/carbon-components-svelte/commit/667fe61b3d88dfa23dabbe651029e2402e7852e7)), closes [#2404](https://github.com/carbon-design-system/carbon-components-svelte/issues/2404)

### [0.95.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.94.0...v0.95.0) (2025-12-01)

### Features

- **modal:** add `formId` prop to enable native form submission ([2a5c274](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a5c27451c115c1cb5422493a92f0bc67b26e8d2)), closes [#310](https://github.com/carbon-design-system/carbon-components-svelte/issues/310)
- **portal:** add `Portal` component ([4982e26](https://github.com/carbon-design-system/carbon-components-svelte/commit/4982e26c624e9c8d9e8167e21247ee520a38ae48)), closes [#2280](https://github.com/carbon-design-system/carbon-components-svelte/issues/2280)

### Bug Fixes

- **number-input:** only show invalid state when `invalid` and `invalidText` are set ([#2384](https://github.com/carbon-design-system/carbon-components-svelte/issues/2384)) ([e06340c](https://github.com/carbon-design-system/carbon-components-svelte/commit/e06340c3776aefdae3f77f92eb04da3864a1ce41)), closes [#1180](https://github.com/carbon-design-system/carbon-components-svelte/issues/1180)
- **tabs:** avoid infinite update loop in Svelte 5 ([#2394](https://github.com/carbon-design-system/carbon-components-svelte/issues/2394)) ([65316af](https://github.com/carbon-design-system/carbon-components-svelte/commit/65316af5e508576e2f9ebe8dd7e2a08aca5376af)), closes [#2366](https://github.com/carbon-design-system/carbon-components-svelte/issues/2366)

## [0.94.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.93.0...v0.94.0) (2025-11-29)

### ⚠ BREAKING CHANGES

- **progress-step:** remove one-update delay for `complete` prop (#2368)

### Features

- **header-search:** support TypeScript generics ([5d0468a](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d0468aed5e62a3275ecefe99edf859ac3f753ef))
- **notification:** add `NotificationQueue` component ([9560791](https://github.com/carbon-design-system/carbon-components-svelte/commit/956079131853ceae6852fb1ad7b26e776a354dbd)), closes [#2283](https://github.com/carbon-design-system/carbon-components-svelte/issues/2283)
- **recursive-list:** support TypeScript generics ([b200828](https://github.com/carbon-design-system/carbon-components-svelte/commit/b2008288364a16c8e5690b1c4ce70405cc0c468d))
- **selectable-tile:** add `SelectableTileGroup` component ([6ba0fdf](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ba0fdf97fcc2e1283b32c0c8f04bea45cd3198b))
- **select:** support TypeScript generics ([d57b375](https://github.com/carbon-design-system/carbon-components-svelte/commit/d57b3754de9721a38cbb09f703e76a9327c678d3))
- **theme:** export `themes` constant ([776e471](https://github.com/carbon-design-system/carbon-components-svelte/commit/776e4715e858e88fe57afd4c9d9c7962f3167b38)), closes [#939](https://github.com/carbon-design-system/carbon-components-svelte/issues/939)
- **tile-group:** make `selectedValue` and `selected` generic ([#2374](https://github.com/carbon-design-system/carbon-components-svelte/issues/2374)) ([209cc02](https://github.com/carbon-design-system/carbon-components-svelte/commit/209cc02fb53e744f7dd2b3142249d5b9425bdf29))
- **tree-view:** support TypeScript generics ([9efbbda](https://github.com/carbon-design-system/carbon-components-svelte/commit/9efbbda3c3e4faaf4ebec839dfae42e17aa85233))

### Bug Fixes

- **inline-notification:** conditionally render title/subtitle ([751190c](https://github.com/carbon-design-system/carbon-components-svelte/commit/751190cee9d2d3b5ed8d564551b5c67d37182e25)), closes [#2379](https://github.com/carbon-design-system/carbon-components-svelte/issues/2379)
- **toast-notification:** conditionally render subtitle/caption ([f4d2091](https://github.com/carbon-design-system/carbon-components-svelte/commit/f4d209121496dfad733d658e9615cadafc96acea))
- **modal:** improve focus trap for `Dropdown` and other components ([#2369](https://github.com/carbon-design-system/carbon-components-svelte/issues/2369)) ([d11e3ac](https://github.com/carbon-design-system/carbon-components-svelte/commit/d11e3ac9ad9da9875bed68b716cc82f231a6f959)), closes [#1392](https://github.com/carbon-design-system/carbon-components-svelte/issues/1392)
- **tabs:** avoid infinite update loop in Svelte 5 ([#2367](https://github.com/carbon-design-system/carbon-components-svelte/issues/2367)) ([413aab5](https://github.com/carbon-design-system/carbon-components-svelte/commit/413aab54fc66fda1d5282a0d0bcc60af2dc8c89b)), closes [#2366](https://github.com/carbon-design-system/carbon-components-svelte/issues/2366)
- **tile-group:** improve context types for `SelectableTileGroup` and `TileGroup` ([#2375](https://github.com/carbon-design-system/carbon-components-svelte/issues/2375)) ([ff144d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff144d272ddb9fb1b9d4f75c3098316afd0b50ec))

## [0.93.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.92.0...v0.93.0) (2025-11-22)

### ⚠ BREAKING CHANGES

- **number-input:** remove unused `iconDescription` prop (#2354)
- **file-uploader:** use `button` for accessibility ([#2351](https://github.com/carbon-design-system/carbon-components-svelte/issues/2351)) ([ace3376](https://github.com/carbon-design-system/carbon-components-svelte/commit/ace3376b3f9efeab3f3bd1b6f6a5abab84623ee0))

### Features

- **data-table:** add `tableHeaderTranslateWithId` prop ([864d687](https://github.com/carbon-design-system/carbon-components-svelte/commit/864d6875bc8384f52bcdb9d1f66c05feb621ccfc))
- **overflow-menu:** support `e.preventDefault` on item click ([#2360](https://github.com/carbon-design-system/carbon-components-svelte/issues/2360)) ([e63b7d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/e63b7d893abbc8fd3eadac1eb54d6559c606494a))
- **stack:** add `Stack` component ([#2352](https://github.com/carbon-design-system/carbon-components-svelte/issues/2352)) ([bf3b93a](https://github.com/carbon-design-system/carbon-components-svelte/commit/bf3b93ae2de210f8a3d1bcf618ac9966b72aa07e)), closes [#2278](https://github.com/carbon-design-system/carbon-components-svelte/issues/2278)
- **types:** add `[@example](https://github.com/example)` tags for accessors ([0192d0e](https://github.com/carbon-design-system/carbon-components-svelte/commit/0192d0e9938a5c48d7f08c7bfaed54b3d8a2b8d8))

### Bug Fixes

- **context-menu:** close on any click instead of only outside clicks ([#2349](https://github.com/carbon-design-system/carbon-components-svelte/issues/2349)) ([a980071](https://github.com/carbon-design-system/carbon-components-svelte/commit/a9800715ca8a8cc0fa84ae97d386dd456b4b7024)), closes [#578](https://github.com/carbon-design-system/carbon-components-svelte/issues/578)
- **data-table:** restore `target` and `currentTarget` types ([#2345](https://github.com/carbon-design-system/carbon-components-svelte/issues/2345)) ([6b11d7a](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b11d7a2f37d2670847b33c96570415f5c48807f)), closes [#2344](https://github.com/carbon-design-system/carbon-components-svelte/issues/2344)
- **dropdown:** support typeahead when menu is open ([#2357](https://github.com/carbon-design-system/carbon-components-svelte/issues/2357)) ([f2b5056](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2b50563d4a91af4a38c4164821fbf9306261cf3)), closes [#1975](https://github.com/carbon-design-system/carbon-components-svelte/issues/1975)
- **number-input:** remove unused `iconDescription` prop ([#2354](https://github.com/carbon-design-system/carbon-components-svelte/issues/2354)) ([7e5d437](https://github.com/carbon-design-system/carbon-components-svelte/commit/7e5d437f66f968ab1c6cef409f9733a9d170daf4))
- **table-header:** implement `translateWithId` ([c4eed4d](https://github.com/carbon-design-system/carbon-components-svelte/commit/c4eed4dda7fff44e50c7a4f711cd4a40172394d2))
- **tabs:** resolve index de-sync from dynamic tab rendering ([8a2d0ae](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a2d0ae2a74bba7626b0e59e6586237b18115207)), closes [#1537](https://github.com/carbon-design-system/carbon-components-svelte/issues/1537)
- **toolbar:** prevent keyboard focus on hidden toolbar elements ([#2359](https://github.com/carbon-design-system/carbon-components-svelte/issues/2359)) ([bdaf6b5](https://github.com/carbon-design-system/carbon-components-svelte/commit/bdaf6b558d8c94909c7592fdcc1946a40a31bb19)), closes [#663](https://github.com/carbon-design-system/carbon-components-svelte/issues/663)

## [0.92.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.91.0...v0.92.0) (2025-11-13)

### ⚠ BREAKING CHANGES

- **number-input:** rename `label` to `labelText`
- **multi-select:** rename `titleText` to `labelText`
- **dropdown:** rename `titleText` to `labelText`
- **combo-box:** rename `titleText` to `labelText`

### Features

- **combo-box:** add `typeahead` prop for autocomplete ([#2340](https://github.com/carbon-design-system/carbon-components-svelte/issues/2340)) ([40ab3b7](https://github.com/carbon-design-system/carbon-components-svelte/commit/40ab3b71791dc35714cf7e16f50abff5095f9362)), closes [#2275](https://github.com/carbon-design-system/carbon-components-svelte/issues/2275)

### Bug Fixes

- **composed-modal:** make closed modal inert ([1002ad3](https://github.com/carbon-design-system/carbon-components-svelte/commit/1002ad39c807df0b0ba093e6f75fc8333a8368ae)), closes [#2338](https://github.com/carbon-design-system/carbon-components-svelte/issues/2338)
- **modal:** make closed modal inert ([8e32236](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e32236e9e92ba9168ff0248cb45ad3e46c275a8)), closes [#2338](https://github.com/carbon-design-system/carbon-components-svelte/issues/2338)

### [0.91.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.90.2...v0.91.0) (2025-11-10)

### Features

- **combo-box:** support TypeScript generics ([9e3ce77](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e3ce775617aecd31e914723a6f6d313c2eb9254))
- **dropdown:** support TypeScript generics ([65572ec](https://github.com/carbon-design-system/carbon-components-svelte/commit/65572ecec461a2a9112c37ef6025b5d090e6e068))
- **multi-select:** support TypeScript generics ([1b3d067](https://github.com/carbon-design-system/carbon-components-svelte/commit/1b3d06757e9e6095f0a27b92328b4e2b129d5f1c))
- **tree-view:** `showNode` is configurable ([6f23803](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f238034abfeb5c095715b497c84c86d6b10f059)), closes [#2282](https://github.com/carbon-design-system/carbon-components-svelte/issues/2282)
- **tree-view:** add `filterTreeNodes` utilities ([038a4f4](https://github.com/carbon-design-system/carbon-components-svelte/commit/038a4f4b96a9a6579962b872e1407dc30b32dd82)), closes [#2281](https://github.com/carbon-design-system/carbon-components-svelte/issues/2281)
- **types:** annotate typedefs and dispatched events ([#2322](https://github.com/carbon-design-system/carbon-components-svelte/issues/2322)) ([7632c03](https://github.com/carbon-design-system/carbon-components-svelte/commit/7632c03d1bb2e1287210865d60fe49597dc4812e))

### Bug Fixes

- **breakpoint:** use `declare const` in types ([#2330](https://github.com/carbon-design-system/carbon-components-svelte/issues/2330)) ([24152e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/24152e29fc5677d0f3263cd42a5393d5a5a13c4e))
- **multi-select:** restore complete keyboard navigation for filterable variant ([#2317](https://github.com/carbon-design-system/carbon-components-svelte/issues/2317)) ([2c0ae9e](https://github.com/carbon-design-system/carbon-components-svelte/commit/2c0ae9e30bcb7e09e83767c1c90b9e43d903ea3c)), closes [#2313](https://github.com/carbon-design-system/carbon-components-svelte/issues/2313)
- **slider:** store event object for drag calculations ([#2320](https://github.com/carbon-design-system/carbon-components-svelte/issues/2320)) ([50f010d](https://github.com/carbon-design-system/carbon-components-svelte/commit/50f010d7ce532e29890336be1d34411fac85bf98))
- **tree-view-node:** correctly type `computeTreeLeafDepth` export ([cbe7d93](https://github.com/carbon-design-system/carbon-components-svelte/commit/cbe7d93a92af9a93257e7328cec8a25fc4ce4229))
- **types:** correctly generate `[@default](https://github.com/default)` values ([f2c0701](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2c07011be488a3284d6c7f7a2704a51e1e680d7))
- **types:** generate types for all components ([b90a1f2](https://github.com/carbon-design-system/carbon-components-svelte/commit/b90a1f21f0d82b73bd430ec82bc1df2a9b45e029))
- **types:** re-generate `types/index.d.ts` ([47cd789](https://github.com/carbon-design-system/carbon-components-svelte/commit/47cd7891bb989c797b34a528fbe8d5165cb54ae8))
- **types:** remove function code from `[@default](https://github.com/default)` tags ([527f34f](https://github.com/carbon-design-system/carbon-components-svelte/commit/527f34fd3a6f3c29739c64e6f489fd7949d139e7))

### [0.90.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.90.1...v0.90.2) (2025-11-08)

### Bug Fixes

- **button:** icon slot includes `style` prop in TypeScript definitions ([8507917](https://github.com/carbon-design-system/carbon-components-svelte/commit/8507917d693a93471b5858e6ab21965eeab17efe))
- **multi-select:** restore keyboard navigation for filterable variant ([#2314](https://github.com/carbon-design-system/carbon-components-svelte/issues/2314)) ([7d849d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d849d282a580cd62a075fc8f125263aa71de4d0)), closes [#2313](https://github.com/carbon-design-system/carbon-components-svelte/issues/2313)
- **number-input:** avoid global `isNaN` ([f93aab2](https://github.com/carbon-design-system/carbon-components-svelte/commit/f93aab28c6098197d0bef6d438a663042d0f96fe))
- **tooltip:** avoid useless ternary ([798fe61](https://github.com/carbon-design-system/carbon-components-svelte/commit/798fe61b795b98fc76dffe4221da11969f341e08))
- **types:** include skeleton props for Button/DataTableSkeleton ([2f08b9a](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f08b9aa8327e3a24fdd9cf4e4f509fbaeaaa947))
- use strict equals in `Breakpoint` and `TextInput` ([a565dc5](https://github.com/carbon-design-system/carbon-components-svelte/commit/a565dc5733c618866686b29b7ddd5f28c6b7d10d))

### [0.90.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.90.0...v0.90.1) (2025-10-26)

### Bug Fixes

- **multi-select:** only focus input if filterable ([25192832](https://github.com/carbon-design-system/carbon-components-svelte/commit/2519283256307735f57428c3d3604f8b370e953a)), closes [#2288](https://github.com/carbon-design-system/carbon-components-svelte/issues/2288)
- **text-input:** fix input value reactivity ([#2234](https://github.com/carbon-design-system/carbon-components-svelte/issues/2234))

## [0.90.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.8...v0.90.0) (2025-10-23)

### ⚠ BREAKING CHANGES

- **data-table:** include `target` and `currentTarget` in row/cell click events (#2264)
- **select:** forward `$$restProps` to `select` element (#2263)
- **text-area:** disallow `resize` if `cols` is specified (#2230)

### Features

- **button:** add `hideTooltip` to hide tooltip for icon-only variant ([ad85269](https://github.com/carbon-design-system/carbon-components-svelte/commit/ad85269d2dc183b1bd514c6e2d408ab17630c830)), closes [#1251](https://github.com/carbon-design-system/carbon-components-svelte/issues/1251)
- **checkbox:** add `helperText` prop ([dd9e1da](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd9e1daec95058b1440c1e1619416b68abe35bf2))
- **combo-box:** add `clearFilterOnOpen` prop ([997cda4](https://github.com/carbon-design-system/carbon-components-svelte/commit/997cda4e15b3f0c2a82e3df3516df04b30f5203a)), closes [#1635](https://github.com/carbon-design-system/carbon-components-svelte/issues/1635)
- **combo-box:** allow custom value ([#2232](https://github.com/carbon-design-system/carbon-components-svelte/issues/2232)) ([1a9c9c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a9c9c4ec903db45e98d59aff8fa4f695ac0e1a7)), closes [#1726](https://github.com/carbon-design-system/carbon-components-svelte/issues/1726)
- **composed-modal:** support cancelable close event ([d256651](https://github.com/carbon-design-system/carbon-components-svelte/commit/d256651b79a8f8069044419a5cb13cab65490b49)), closes [#1549](https://github.com/carbon-design-system/carbon-components-svelte/issues/1549)
- **data-table:** include `target` and `currentTarget` in row/cell click events ([#2264](https://github.com/carbon-design-system/carbon-components-svelte/issues/2264)) ([acdbc13](https://github.com/carbon-design-system/carbon-components-svelte/commit/acdbc13cbaf5a39bdbab857e31c201ae1ffc0ba7)), closes [#1904](https://github.com/carbon-design-system/carbon-components-svelte/issues/1904)
- **data-table:** pass `rowSelected` and `rowExpanded` to slotted row/cell ([15914b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/15914b4b2cc551ea1f844eedb1bbe1c123450a9d)), closes [#1672](https://github.com/carbon-design-system/carbon-components-svelte/issues/1672)
- **modal:** support cancelable close event ([42afc2f](https://github.com/carbon-design-system/carbon-components-svelte/commit/42afc2f0749e6b1e0f564fc704de872afff8c2f6)), closes [#1549](https://github.com/carbon-design-system/carbon-components-svelte/issues/1549)
- **number-input:** allow decimals ([#2233](https://github.com/carbon-design-system/carbon-components-svelte/issues/2233)) ([416d9e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/416d9e9cd6cff99fa2f02bc8d3adfbe7dbf42fe4)), closes [#1873](https://github.com/carbon-design-system/carbon-components-svelte/issues/1873)
- **radio-button:** add `helperText` prop ([53aa6e0](https://github.com/carbon-design-system/carbon-components-svelte/commit/53aa6e0f2b949b0b05f085a4222cd769e321fbd7))
- **text-area:** add `warn` and `warnText` props ([367d607](https://github.com/carbon-design-system/carbon-components-svelte/commit/367d607b31d2902809163e9d12f05502a3bb895a)), closes [#1136](https://github.com/carbon-design-system/carbon-components-svelte/issues/1136)
- **toggle:** add `ref` prop ([#2252](https://github.com/carbon-design-system/carbon-components-svelte/issues/2252)) ([b54876b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b54876bb16a1325ccd97d000c26ca65730601886)), closes [#2218](https://github.com/carbon-design-system/carbon-components-svelte/issues/2218)
- **toolbar:** `ToolbarBatchActions` supports standalone usage ([14ff730](https://github.com/carbon-design-system/carbon-components-svelte/commit/14ff730c1a11951372c47b087b10095c249f94ab)), closes [#2273](https://github.com/carbon-design-system/carbon-components-svelte/issues/2273)
- **ui-shell:** `HeaderNavMenu` implements keyboard navigation ([#2248](https://github.com/carbon-design-system/carbon-components-svelte/issues/2248)) ([b4d7037](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4d7037b251e2b8a3210c906821cc8838d73ece0)), closes [#1068](https://github.com/carbon-design-system/carbon-components-svelte/issues/1068)

### Bug Fixes

- **select:** forward `$$restProps` to `select` element ([#2263](https://github.com/carbon-design-system/carbon-components-svelte/issues/2263)) ([5af6c9d](https://github.com/carbon-design-system/carbon-components-svelte/commit/5af6c9d08a4e64c2c1e8801b7a1818f8227e9c7d))
- **text-area:** disallow `resize` if `cols` is specified ([#2230](https://github.com/carbon-design-system/carbon-components-svelte/issues/2230)) ([92b8581](https://github.com/carbon-design-system/carbon-components-svelte/commit/92b85813f1cee01ef7fe190df14e7c67e082c12f)), closes [#1661](https://github.com/carbon-design-system/carbon-components-svelte/issues/1661)
- **text-area:** polyfill warn state styles ([cc65ac2](https://github.com/carbon-design-system/carbon-components-svelte/commit/cc65ac2ae5f7717a1d4bc0e668a0bccb904c0742)), closes [#1136](https://github.com/carbon-design-system/carbon-components-svelte/issues/1136)

### [0.89.8](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.7...v0.89.8) (2025-10-19)

### Bug Fixes

- **checkbox:** polyfill readonly styles ([c4136e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/c4136e9c405775d845f7ca3216969c3f71f3d6c3)), closes [#1544](https://github.com/carbon-design-system/carbon-components-svelte/issues/1544)
- **checkbox:** prevent state changes when `readonly` is true ([3f18348](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f183487e4df3bd29cb4506a9b8f91bb8eaae4c0)), closes [#1544](https://github.com/carbon-design-system/carbon-components-svelte/issues/1544)
- **combo-box:** forward `on:input` to enable async filtering ([ba16b1c](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba16b1c8009a51b31251cb5b9b558367711a472c)), closes [#617](https://github.com/carbon-design-system/carbon-components-svelte/issues/617)
- **context-menu:** avoid clipping nested menu on narrow screens ([#2227](https://github.com/carbon-design-system/carbon-components-svelte/issues/2227)) ([1933c0b](https://github.com/carbon-design-system/carbon-components-svelte/commit/1933c0bea07c23e544711e06b762de0cc7deb03e)), closes [#1847](https://github.com/carbon-design-system/carbon-components-svelte/issues/1847)
- **context-menu:** nested menu implements hover intent triangle ([#2221](https://github.com/carbon-design-system/carbon-components-svelte/issues/2221)) ([6403028](https://github.com/carbon-design-system/carbon-components-svelte/commit/64030283c76924d7ab35b26950efa4612bdf2ac4)), closes [#2220](https://github.com/carbon-design-system/carbon-components-svelte/issues/2220)
- **context-menu:** prevent parent menu closure when clicking submenu on mobile ([#2219](https://github.com/carbon-design-system/carbon-components-svelte/issues/2219)) ([597cb57](https://github.com/carbon-design-system/carbon-components-svelte/commit/597cb57bc73df3ad9c4b3942dc6960e017851910)), closes [#1848](https://github.com/carbon-design-system/carbon-components-svelte/issues/1848)
- **data-table:** default filtering supports nested keys ([#2213](https://github.com/carbon-design-system/carbon-components-svelte/issues/2213)) ([484c61d](https://github.com/carbon-design-system/carbon-components-svelte/commit/484c61d7ab5bd7c2a979860170f2e732842f58cb)), closes [#1897](https://github.com/carbon-design-system/carbon-components-svelte/issues/1897)
- **data-table:** title/description slots should override elements ([90f25df](https://github.com/carbon-design-system/carbon-components-svelte/commit/90f25df5e116ca281882d908b77f2489df0bf041)), closes [#1594](https://github.com/carbon-design-system/carbon-components-svelte/issues/1594)
- **date-picker:** allow clearing range dates by setting values to empty strings ([#2236](https://github.com/carbon-design-system/carbon-components-svelte/issues/2236)) ([9b45af8](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b45af8a7aa2fa9bf03c699d8d1f5425b1050d8b)), closes [#1862](https://github.com/carbon-design-system/carbon-components-svelte/issues/1862)
- **date-picker:** dispatch `change` for "single" variant ([#2229](https://github.com/carbon-design-system/carbon-components-svelte/issues/2229)) ([4873a64](https://github.com/carbon-design-system/carbon-components-svelte/commit/4873a64f1b28dd8fc24005d392f2d7dcf8f30b90)), closes [#314](https://github.com/carbon-design-system/carbon-components-svelte/issues/314) [#950](https://github.com/carbon-design-system/carbon-components-svelte/issues/950)
- **dropdown:** remove `parent.addEventListener` to resolve cross-origin iframe error ([#2222](https://github.com/carbon-design-system/carbon-components-svelte/issues/2222)) ([10f549d](https://github.com/carbon-design-system/carbon-components-svelte/commit/10f549dc2388ce8448cb505cde93508a214c3b17)), closes [#1875](https://github.com/carbon-design-system/carbon-components-svelte/issues/1875)
- **file-uploader:** `multiple` should append instead of replace files ([#2223](https://github.com/carbon-design-system/carbon-components-svelte/issues/2223)) ([b44f24d](https://github.com/carbon-design-system/carbon-components-svelte/commit/b44f24d81a8444e6d4ad463fb0c4ead56b8d8dc1)), closes [#1774](https://github.com/carbon-design-system/carbon-components-svelte/issues/1774)
- **file-uploader:** synchronize `input.files` when files removed ([750cd75](https://github.com/carbon-design-system/carbon-components-svelte/commit/750cd752e781df8683b7f8ed4e47227df320797b)), closes [#1785](https://github.com/carbon-design-system/carbon-components-svelte/issues/1785)
- **local-storage:** key is also reactive ([8ef7500](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ef7500d1f421ff1a92e88bf06a68e7274d58ca5)), closes [#1204](https://github.com/carbon-design-system/carbon-components-svelte/issues/1204)
- **modal:** `ModalFooter` prop type `secondaryButtons` allows empty array ([#2211](https://github.com/carbon-design-system/carbon-components-svelte/issues/2211)) ([166ffff](https://github.com/carbon-design-system/carbon-components-svelte/commit/166ffff63d1b4ec390fd9aeb78c66aaa63d2b3fe))
- **multi-select:** address a11y issues ([#2231](https://github.com/carbon-design-system/carbon-components-svelte/issues/2231)) ([c4c335a](https://github.com/carbon-design-system/carbon-components-svelte/commit/c4c335aebc4082ffbeb12e1151f84f87f99325fc)), closes [#2172](https://github.com/carbon-design-system/carbon-components-svelte/issues/2172)
- **multi-select:** filterable variant should not use read-only checkbox ([#2256](https://github.com/carbon-design-system/carbon-components-svelte/issues/2256)) ([a91abb4](https://github.com/carbon-design-system/carbon-components-svelte/commit/a91abb4c4366c682794cb5b4b0d67d503f50704c)), closes [#2255](https://github.com/carbon-design-system/carbon-components-svelte/issues/2255)
- **pagination:** prevent double update when `pageSize` changes on last page ([b5fbd10](https://github.com/carbon-design-system/carbon-components-svelte/commit/b5fbd10f07d9f4f802b927669cdba314c65b4d47)), closes [#1634](https://github.com/carbon-design-system/carbon-components-svelte/issues/1634)
- **radio-button:** allow standalone usage with `checked` prop ([2324d37](https://github.com/carbon-design-system/carbon-components-svelte/commit/2324d377882d6adbadaf58d01aad7e1ce80f5b0e)), closes [#1879](https://github.com/carbon-design-system/carbon-components-svelte/issues/1879)
- **select:** avoid rendering empty label element ([#2246](https://github.com/carbon-design-system/carbon-components-svelte/issues/2246)) ([91a218d](https://github.com/carbon-design-system/carbon-components-svelte/commit/91a218db7659179d4fa08a66adea919c9dfd74dd)), closes [#1977](https://github.com/carbon-design-system/carbon-components-svelte/issues/1977)
- **slider:** dispatch `on:input` for keyboard events ([#2215](https://github.com/carbon-design-system/carbon-components-svelte/issues/2215)) ([42371f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/42371f6793dc506c9704fbe2089acdb775d4f111)), closes [#1980](https://github.com/carbon-design-system/carbon-components-svelte/issues/1980)
- **slider:** round `Shift+Arrow` values to valid steps ([#2216](https://github.com/carbon-design-system/carbon-components-svelte/issues/2216)) ([1eb0216](https://github.com/carbon-design-system/carbon-components-svelte/commit/1eb0216067fe5a56bc97f5b3afb1376bfcb29df0)), closes [#1219](https://github.com/carbon-design-system/carbon-components-svelte/issues/1219)
- **text-input:** preserve HTML5 validation for `type="number"` ([#2234](https://github.com/carbon-design-system/carbon-components-svelte/issues/2234)) ([54b7c65](https://github.com/carbon-design-system/carbon-components-svelte/commit/54b7c65f34cf4fb816ebbaa2cce10503a5df13e3)), closes [#1836](https://github.com/carbon-design-system/carbon-components-svelte/issues/1836)
- **text-input:** wrap `value` prop description to one line ([7f7d32d](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f7d32d42d79ea6532401befea89c9273806f1c0))
- **toggle:** dispatch change event for keyboard interactions ([#2217](https://github.com/carbon-design-system/carbon-components-svelte/issues/2217)) ([f38c305](https://github.com/carbon-design-system/carbon-components-svelte/commit/f38c305d9ed7a00da01445033834a80adabcb15f)), closes [#1611](https://github.com/carbon-design-system/carbon-components-svelte/issues/1611)
- **tooltip:** prevent closing on layout shift ([#2240](https://github.com/carbon-design-system/carbon-components-svelte/issues/2240)) ([1d0bc7e](https://github.com/carbon-design-system/carbon-components-svelte/commit/1d0bc7e697dad725fdef9af586cb8b6006764bf7)), closes [#925](https://github.com/carbon-design-system/carbon-components-svelte/issues/925)
- **ui-shell:** add `ariaLabelMenu` prop for hamburger menu ([#2212](https://github.com/carbon-design-system/carbon-components-svelte/issues/2212)) ([4b1f31f](https://github.com/carbon-design-system/carbon-components-svelte/commit/4b1f31f785cb200312508c7666fbb2546851bc7e)), closes [#1538](https://github.com/carbon-design-system/carbon-components-svelte/issues/1538)
- **ui-shell:** prevent focus on hidden links when `SideNav` is collapsed ([#2242](https://github.com/carbon-design-system/carbon-components-svelte/issues/2242)) ([08ca4ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/08ca4eded77f73449fa405c6be7fd0aafa1b8724)), closes [#604](https://github.com/carbon-design-system/carbon-components-svelte/issues/604)

### [0.89.7](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.6...v0.89.7) (2025-09-05)

### Bug Fixes

- **combo-box:** address accessibility issues ([#2186](https://github.com/carbon-design-system/carbon-components-svelte/issues/2186)) ([2fc884c](https://github.com/carbon-design-system/carbon-components-svelte/commit/2fc884cacabfffcf7779d6ef9ba01dece0bf5d86)), closes [#2172](https://github.com/carbon-design-system/carbon-components-svelte/issues/2172)
- **data-table:** handle dynamic `headers` gracefully ([#2195](https://github.com/carbon-design-system/carbon-components-svelte/issues/2195)) ([6d0d3b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d0d3b108bb4595d878fda20736c40b9656d14d7)), closes [#2193](https://github.com/carbon-design-system/carbon-components-svelte/issues/2193)
- **overflow-menu:** avoid dynamic style injection for performance ([#2198](https://github.com/carbon-design-system/carbon-components-svelte/issues/2198)) ([14edf41](https://github.com/carbon-design-system/carbon-components-svelte/commit/14edf41e57fea1ddbb2cf24c37e79475849bdea1)), closes [#2197](https://github.com/carbon-design-system/carbon-components-svelte/issues/2197)
- **pagination:** `on:change` dispatches with correct value ([#2194](https://github.com/carbon-design-system/carbon-components-svelte/issues/2194)) ([44a6cc0](https://github.com/carbon-design-system/carbon-components-svelte/commit/44a6cc0dfcbd3cdad1b442a760c9f604e58d56e6))

### [0.89.6](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.5...v0.89.6) (2025-08-16)

### Bug Fixes

- **toggle:** avoid dispatching `toggle` event on state change ([#2184](https://github.com/carbon-design-system/carbon-components-svelte/issues/2184)) ([0df727b](https://github.com/carbon-design-system/carbon-components-svelte/commit/0df727b704d6cc577681dc682269a6e224ddbb6e))

### [0.89.5](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.4...v0.89.5) (2025-08-05)

### Bug Fixes

- **checkbox:** prevent infinite effect loop when binding to same object ([#2178](https://github.com/carbon-design-system/carbon-components-svelte/issues/2178)) ([c7ad1eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7ad1ebdd3764235f460abd95cdb7d1d389983d9)), closes [#2177](https://github.com/carbon-design-system/carbon-components-svelte/issues/2177)

### [0.89.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.3...v0.89.4) (2025-06-10)

### Bug Fixes

- **multi-select:** forward `on:input` for filterable variant ([#2170](https://github.com/carbon-design-system/carbon-components-svelte/issues/2170)) ([aecc4e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/aecc4e8eec6571515233ec76ca06218814a279a7))

### [0.89.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.2...v0.89.3) (2025-06-07)

### Bug Fixes

- **combo-box:** "Escape" key clears input value ([#2169](https://github.com/carbon-design-system/carbon-components-svelte/issues/2169)) ([632320a](https://github.com/carbon-design-system/carbon-components-svelte/commit/632320ae3b8d9c602add0f4f7c708fc643cb7ffc)), closes [#2167](https://github.com/carbon-design-system/carbon-components-svelte/issues/2167)
- **combo-box:** clear button supports "Space" key ([#2168](https://github.com/carbon-design-system/carbon-components-svelte/issues/2168)) ([95c06a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/95c06a83b3afcbb76acfc0a5efe2f178d333ff19)), closes [#2166](https://github.com/carbon-design-system/carbon-components-svelte/issues/2166)

### [0.89.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.1...v0.89.2) (2025-04-28)

### Bug Fixes

- **composed-modal:** ignore a11y warning in Svelte 5 ([#2159](https://github.com/carbon-design-system/carbon-components-svelte/issues/2159)) ([024d774](https://github.com/carbon-design-system/carbon-components-svelte/commit/024d77493c93e7823e4781a1a60aaf350d289d52))
- **pagination:** use `toLocaleString` for default text formatting ([#2161](https://github.com/carbon-design-system/carbon-components-svelte/issues/2161)) ([cdf5659](https://github.com/carbon-design-system/carbon-components-svelte/commit/cdf5659fa0177da77dc8ea1ccffdec54b746954b))
- **pagination:** window `totalItems` for performance ([#2160](https://github.com/carbon-design-system/carbon-components-svelte/issues/2160)) ([ed3928b](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed3928bb01ecca2fa63f551938dbee1c1829a978)), closes [#2156](https://github.com/carbon-design-system/carbon-components-svelte/issues/2156)
- **to-hierarchy:** revert to previous implementation ([96d37cc](https://github.com/carbon-design-system/carbon-components-svelte/commit/96d37cc490f28830264c35c84447ee4526256314))

### [0.89.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.0...v0.89.1) (2025-04-21)

### Bug Fixes

- **toolbar-search:** re-filter rows if `DataTable` rows change ([#2154](https://github.com/carbon-design-system/carbon-components-svelte/issues/2154)) ([f09c2e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/f09c2e2c311c15f633db8dc45930d8e58a4b362d)), closes [#2143](https://github.com/carbon-design-system/carbon-components-svelte/issues/2143)

### [0.89.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.88.4...v0.89.0) (2025-04-18)

### Features

- **combo-box:** add `hideLabel` prop ([#2153](https://github.com/carbon-design-system/carbon-components-svelte/issues/2153)) ([436dea4](https://github.com/carbon-design-system/carbon-components-svelte/commit/436dea47e8da35753a257c9b2bd6f33338e95ba5))

### Bug Fixes

- **select:** falsy item `text` should fallback to `value` ([#2152](https://github.com/carbon-design-system/carbon-components-svelte/issues/2152)) ([61ea8dd](https://github.com/carbon-design-system/carbon-components-svelte/commit/61ea8dd82c2f9863dfe5f8a882e73624b994d9e5))

### [0.88.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.88.3...v0.88.4) (2025-03-24)

### Bug Fixes

- **list-box-selection:** fix `aria-label` for clear button ([#2134](https://github.com/carbon-design-system/carbon-components-svelte/issues/2134)) ([dd1338f](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd1338ffc47926a13e231d4a0f724e923f2219e2))
- **list-box:** correct button/description translations based on selection count ([#2139](https://github.com/carbon-design-system/carbon-components-svelte/issues/2139)) ([1a5f2d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a5f2d8e67734bfda20272ae6a77d13b3837416d))
- **list-box:** set `aria-disabled` if `disabled` ([#2125](https://github.com/carbon-design-system/carbon-components-svelte/issues/2125)) ([#2138](https://github.com/carbon-design-system/carbon-components-svelte/issues/2138)) ([9b61af0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b61af0306b422acf1e7cdde278e517740f667c5)), closes [#2130](https://github.com/carbon-design-system/carbon-components-svelte/issues/2130)
- **radio-button:** forward `focus`, `blur` events ([#2135](https://github.com/carbon-design-system/carbon-components-svelte/issues/2135)) ([1462e30](https://github.com/carbon-design-system/carbon-components-svelte/commit/1462e300d69f0cd7ee5476dfe3a7ea892ac8f4ad)), closes [#2131](https://github.com/carbon-design-system/carbon-components-svelte/issues/2131)
- **radio-tile:** allow standalone `RadioTile` usage ([#2136](https://github.com/carbon-design-system/carbon-components-svelte/issues/2136)) ([ca9beeb](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca9beebaeac7eaed8079c010a86a78926b00147f))
- **text-area:** allow visually hidden label ([#2137](https://github.com/carbon-design-system/carbon-components-svelte/issues/2137)) ([43511e0](https://github.com/carbon-design-system/carbon-components-svelte/commit/43511e09ecf312c1b8e9339856b9d7d0785036de))

### [0.88.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.88.2...v0.88.3) (2025-03-19)

### Bug Fixes

- Revert **list-box:** use `aria-disabled` instead of invalid `disabled` attribute ([#2125](https://github.com/carbon-design-system/carbon-components-svelte/issues/2125)) ([e1b3ef2](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1b3ef22c9ee09474bacadbb0b22b41326566bab))

### [0.88.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.88.1...v0.88.2) (2025-03-19)

### Bug Fixes

- **combo-box:** fix typing when refocusing input ([9e3d830](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e3d83031e69889472c4e84be256ea242854cf81))
- **list-box:** use `aria-disabled` instead of invalid `disabled` attribute ([#2125](https://github.com/carbon-design-system/carbon-components-svelte/issues/2125)) ([e1b3ef2](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1b3ef22c9ee09474bacadbb0b22b41326566bab))
- **multi-select:** fix keyboard navigation for disabled items ([#2129](https://github.com/carbon-design-system/carbon-components-svelte/issues/2129)) ([e7939ff](https://github.com/carbon-design-system/carbon-components-svelte/commit/e7939ff0e21c3430c9eea74c503b7c35f6823445)), closes [#2128](https://github.com/carbon-design-system/carbon-components-svelte/issues/2128)
- **notification:** remove invalid `kind` prop from markup ([#2126](https://github.com/carbon-design-system/carbon-components-svelte/issues/2126)) ([e85d7ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/e85d7efc5ed15f5236d074fd7981ae527d9e5ab5))
- **theme:** remove invalid `themes` prop from markup ([#2127](https://github.com/carbon-design-system/carbon-components-svelte/issues/2127)) ([5987b61](https://github.com/carbon-design-system/carbon-components-svelte/commit/5987b61a5522fff09468bddd586eed4a537edcc8))

### [0.88.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.88.0...v0.88.1) (2025-03-12)

### Bug Fixes

- **select:** falsy item `text` should not override `value` ([#2118](https://github.com/carbon-design-system/carbon-components-svelte/issues/2118)) ([663b79a](https://github.com/carbon-design-system/carbon-components-svelte/commit/663b79ad054d14a91a8bf700feb62dcf50976eb8)), closes [#2117](https://github.com/carbon-design-system/carbon-components-svelte/issues/2117)
- **ui-shell:** `HeaderAction` uses dark color scheme ([#2119](https://github.com/carbon-design-system/carbon-components-svelte/issues/2119)) ([7ff93ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ff93ad2dac489859d5b4a83c1e359a6507718b4))

### [0.88.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.7...v0.88.0) (2025-03-09)

### Features

- **data-table:** allow custom `inputName` for radio/checkbox ([#2087](https://github.com/carbon-design-system/carbon-components-svelte/issues/2087)) ([7481b9a](https://github.com/carbon-design-system/carbon-components-svelte/commit/7481b9a995dfbc8c2fbaeaae143c8372cf5fce66)), closes [#2085](https://github.com/carbon-design-system/carbon-components-svelte/issues/2085)
- **ui-shell:** `HeaderAction` supports tooltip ([#2111](https://github.com/carbon-design-system/carbon-components-svelte/issues/2111)) ([24b9cbc](https://github.com/carbon-design-system/carbon-components-svelte/commit/24b9cbc9c343537e5e74799ef8289bd29396cf04)), closes [#2110](https://github.com/carbon-design-system/carbon-components-svelte/issues/2110)

### [0.87.7](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.6...v0.87.7) (2025-03-07)

### Bug Fixes

- **select:** avoid infinite update loop in Svelte 5 ([#2108](https://github.com/carbon-design-system/carbon-components-svelte/issues/2108)) ([9b4bfa6](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b4bfa6f86e23155516db156cbe1c980f3c699e8)), closes [#2107](https://github.com/carbon-design-system/carbon-components-svelte/issues/2107)

### [0.87.6](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.5...v0.87.6) (2025-02-24)

### Bug Fixes

- **overflow-menu:** add `aria-controls` to trigger button ([#2100](https://github.com/carbon-design-system/carbon-components-svelte/issues/2100)) ([b7297d4](https://github.com/carbon-design-system/carbon-components-svelte/commit/b7297d452a7813c02f3c89280787292b1c46acec))

### [0.87.5](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.4...v0.87.5) (2025-02-04)

### Bug Fixes

- **tag:** allow `on:close` to work with Svelte 5 ([#2097](https://github.com/carbon-design-system/carbon-components-svelte/issues/2097)) ([6e65ef3](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e65ef39e7ff9a3c0ee25b7945a62584e9b7441e)), closes [#2096](https://github.com/carbon-design-system/carbon-components-svelte/issues/2096)

### [0.87.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.3...v0.87.4) (2025-02-02)

### Bug Fixes

- **types:** loosen `icon` prop type to `any` ([#2095](https://github.com/carbon-design-system/carbon-components-svelte/issues/2095)) ([6bf72d4](https://github.com/carbon-design-system/carbon-components-svelte/commit/6bf72d46024ad2ce03651f28fc1a2a95ec03385d))

### [0.87.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.2...v0.87.3) (2025-01-30)

### Bug Fixes

- **overflow-menu:** support Svelte 5 ([88f4304](https://github.com/carbon-design-system/carbon-components-svelte/commit/88f4304d5a7c9b38b3cabda677233bef48fb9e3a)), closes [#2092](https://github.com/carbon-design-system/carbon-components-svelte/issues/2092)

### [0.87.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.1...v0.87.2) (2025-01-22)

### Bug Fixes

- **text-area:** counter supports null `value` ([#2089](https://github.com/carbon-design-system/carbon-components-svelte/issues/2089)) ([76eec84](https://github.com/carbon-design-system/carbon-components-svelte/commit/76eec84c5458d07d61d057d9ff06938e244dbb2c))

### [0.87.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.0...v0.87.1) (2025-01-19)

### Bug Fixes

- **data-table:** improve `expandable` accessibility ([#2086](https://github.com/carbon-design-system/carbon-components-svelte/issues/2086)) ([e874ac1](https://github.com/carbon-design-system/carbon-components-svelte/commit/e874ac19d778a00c0bba9be65d10be7e6c9104dd))
- **data-table:** prefix internal ID for radio button, checkbox ([#2082](https://github.com/carbon-design-system/carbon-components-svelte/issues/2082)) ([dd6cbac](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd6cbac3ee1728dbcba5cd1d8faa43941e2a198e)), closes [#2081](https://github.com/carbon-design-system/carbon-components-svelte/issues/2081)
- **dropdown:** avoid manual field `blur` ([c194c80](https://github.com/carbon-design-system/carbon-components-svelte/commit/c194c80e29ab36935af71adb9e166e9a16b70910)), closes [#2083](https://github.com/carbon-design-system/carbon-components-svelte/issues/2083)
- **multi-select:** avoid manual field `blur` ([fb6719b](https://github.com/carbon-design-system/carbon-components-svelte/commit/fb6719b1aee35aa45004d82e3b923b4ad45dff5d)), closes [#2083](https://github.com/carbon-design-system/carbon-components-svelte/issues/2083)

### [0.87.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.86.2...v0.87.0) (2024-12-09)

### Features

- add `toHierarchy` utility to normalize flat data into `nodes` for `TreeView`, `RecursiveList` ([#2072](https://github.com/carbon-design-system/carbon-components-svelte/issues/2072)) ([48afd18](https://github.com/carbon-design-system/carbon-components-svelte/commit/48afd18e5e01c2839024b8ddb31038267bcedeb8))

### Bug Fixes

- **tooltip-icon:** `button` should have explicit `type` ([#2071](https://github.com/carbon-design-system/carbon-components-svelte/issues/2071)) ([18c964e](https://github.com/carbon-design-system/carbon-components-svelte/commit/18c964e579a3762b8022751bf0ed5313b78b22ba))

### [0.86.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.86.1...v0.86.2) (2024-11-30)

### Bug Fixes

- **multi-select:** fix sorting behavior ([c3a390f](https://github.com/carbon-design-system/carbon-components-svelte/commit/c3a390f3fef072c6b736e33a85a2ae772df12e52)), closes [#2066](https://github.com/carbon-design-system/carbon-components-svelte/issues/2066)

## [0.86.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.86.0...v0.86.1) (2024-11-22)

### Bug Fixes

- **tree-view:** do not flatten original `nodes` ([#2056](https://github.com/carbon-design-system/carbon-components-svelte/issues/2056)) ([e488c88](https://github.com/carbon-design-system/carbon-components-svelte/commit/e488c8837146432330ebbf2f9182a8a69eab6b70))

## [0.86.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.85.4...v0.86.0) (2024-11-20)

### ⚠ BREAKING CHANGES

- **package:** set `type="module"` in `package.json`
- **package:** remove bundled ESM/UMD support
- **treeview:** rename `children` prop to `nodes` for Svelte 5 compatibility
- **recursive-list:** rename `children` prop to `nodes` for Svelte 5 compatibility
- **types:** use type alias instead of interface for exported component props ([6fbd8ae](https://github.com/carbon-design-system/carbon-components-svelte/commit/6fbd8ae6a90eabde74fb5481c980716eba477c31))

### Features

- **data-table:** support TypeScript generics ([#1954](https://github.com/carbon-design-system/carbon-components-svelte/issues/1954)) ([dd43224](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd43224119905c3a26a2369f836338c18fcbafba))

### Bug Fixes

- **data-table:** (Svelte 5 compatibility) handle `ToolbarSearch` filtering in `DataTable` ([#2037](https://github.com/carbon-design-system/carbon-components-svelte/issues/2037)) ([3192824](https://github.com/carbon-design-system/carbon-components-svelte/commit/3192824322faef7c0c012eb246bb6ef9da7f78dc))
- **multi-select:** (Svelte 5 compatibility) avoid cyclic dependency ([#2034](https://github.com/carbon-design-system/carbon-components-svelte/issues/2034)) ([1acd713](https://github.com/carbon-design-system/carbon-components-svelte/commit/1acd7135372eeabf002dacc80e39162989427140))
- **toolbar-menu:** (Svelte 5 compatibility) remove redundant menu offset ([#2047](https://github.com/carbon-design-system/carbon-components-svelte/issues/2047)) ([7e17394](https://github.com/carbon-design-system/carbon-components-svelte/commit/7e173943ac783756521c4957a1c24b5288ab45b7)), closes [#2040](https://github.com/carbon-design-system/carbon-components-svelte/issues/2040)
- **checkbox:** (Svelte 5 compatibility) bind `indeterminate` ([#2044](https://github.com/carbon-design-system/carbon-components-svelte/issues/2044)) ([9d5e7e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d5e7e31efb2d439b18ba0bf350b712377e160a7)), closes [#2039](https://github.com/carbon-design-system/carbon-components-svelte/issues/2039)

### [0.85.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.85.3...v0.85.4) (2024-11-09)

### Bug Fixes

- **combo-box:** fix types for `on:clear` ([#2020](https://github.com/carbon-design-system/carbon-components-svelte/issues/2020)) ([0831e87](https://github.com/carbon-design-system/carbon-components-svelte/commit/0831e871358fe012e9907699f1423b7e36dba0da))
- **data-table:** fix `DataTableValue` type reference in `DataTable` ([#2023](https://github.com/carbon-design-system/carbon-components-svelte/issues/2023)) ([44daa77](https://github.com/carbon-design-system/carbon-components-svelte/commit/44daa775d5e4dc9aef66eae0e661f14fb5b41354))
- **theme:** `Theme` correctly imports `toggle`, `select` props ([#2019](https://github.com/carbon-design-system/carbon-components-svelte/issues/2019)) ([49b5def](https://github.com/carbon-design-system/carbon-components-svelte/commit/49b5def8153f5eec523d56e2a2c6d4cc3a36dcb5)), closes [#2018](https://github.com/carbon-design-system/carbon-components-svelte/issues/2018)
- **toolbar-search:** fix types for `on:clear` ([#2022](https://github.com/carbon-design-system/carbon-components-svelte/issues/2022)) ([58e6021](https://github.com/carbon-design-system/carbon-components-svelte/commit/58e6021b08f311a5bb3cc7c7f181443cc633c8e4))
- **types:** delete extraneous `icons/Search.svelte.d.ts` ([#2025](https://github.com/carbon-design-system/carbon-components-svelte/issues/2025)) ([951d686](https://github.com/carbon-design-system/carbon-components-svelte/commit/951d6860423fc05df9f46e29fb19916b89c48466))
- **types:** fix types for `on:paste` event ([3167e44](https://github.com/carbon-design-system/carbon-components-svelte/commit/3167e449fdaf19abb4cdf1e2bf3f5bec24865f89))

### [0.85.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.85.2...v0.85.3) (2024-10-25)

### Bug Fixes

- address Svelte 5 warnings ([#2011](https://github.com/carbon-design-system/carbon-components-svelte/issues/2011)) ([43fccac](https://github.com/carbon-design-system/carbon-components-svelte/commit/43fccac1c6273d9aa83b8c26a5f8cecec667db59))

### [0.85.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.85.1...v0.85.2) (2024-08-14)

### Bug Fixes

- **header-action:** allow vertical scroll when expanded ([#1992](https://github.com/carbon-design-system/carbon-components-svelte/issues/1992)) ([61eceb0](https://github.com/carbon-design-system/carbon-components-svelte/commit/61eceb0caac20d92ce58c23d26908530a7e32dbe))

### [0.85.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.85.0...v0.85.1) (2024-08-09)

### Bug Fixes

- **multi-select:** fix `filterItem` return type ([#1972](https://github.com/carbon-design-system/carbon-components-svelte/issues/1972)) ([6140c3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/6140c3c5a91a879889be33080e1aa8b9183982d4))
- **search:** collapse expandable search if value is falsy ([#1987](https://github.com/carbon-design-system/carbon-components-svelte/issues/1987)) ([216d5a3](https://github.com/carbon-design-system/carbon-components-svelte/commit/216d5a39b14ddad600159c1159b6a2d38095cfaf)), closes [#1981](https://github.com/carbon-design-system/carbon-components-svelte/issues/1981)
- **text-area:** type `value` prop as nullable ([#1933](https://github.com/carbon-design-system/carbon-components-svelte/issues/1933)) ([47860ce](https://github.com/carbon-design-system/carbon-components-svelte/commit/47860ce1d7cc5f3b0363ab619dcfd74b3276eda7))

## [0.85.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.84.1...v0.85.0) (2024-03-23)

### ⚠ BREAKING CHANGES

- use `:global()` for custom UI Shell styles ([#1940](https://github.com/carbon-design-system/carbon-components-svelte/issues/1940)) ([d5a1148](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5a11489f8ab9dc05751aa20c420ea4dc6249567))

### [0.84.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.84.0...v0.84.1) (2024-03-16)

### Bug Fixes

- **checkbox:** forward `on:focus`, `on:blur` to `Checkbox` and `InlineCheckbox` ([#1937](https://github.com/carbon-design-system/carbon-components-svelte/issues/1937)) ([6364b23](https://github.com/carbon-design-system/carbon-components-svelte/commit/6364b23030cc0761aa6a0561a1673e89dde47868))
- **data-table:** loosen `sort` return type to be a `number` ([#1935](https://github.com/carbon-design-system/carbon-components-svelte/issues/1935)) ([9132bf8](https://github.com/carbon-design-system/carbon-components-svelte/commit/9132bf8e5a2d6ba70d17a0b4fcdea29d0785492c)), closes [#1934](https://github.com/carbon-design-system/carbon-components-svelte/issues/1934)

### [0.84.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.83.0...v0.84.0) (2024-03-08)

### Features

- **ui-shell:** support button tooltip in `HeaderGlobalAction` ([#1894](https://github.com/carbon-design-system/carbon-components-svelte/issues/1894)) ([d8bc651](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8bc65163eabacfee348d6248e90f683ac488aef)), closes [#1893](https://github.com/carbon-design-system/carbon-components-svelte/issues/1893)

### Bug Fixes

- **exports:** resolve imports with explicit \*.js extension ([#1927](https://github.com/carbon-design-system/carbon-components-svelte/issues/1927)) ([0405ede](https://github.com/carbon-design-system/carbon-components-svelte/commit/0405edee7d1696a157acab941488f8d3a750187f)), closes [#1925](https://github.com/carbon-design-system/carbon-components-svelte/issues/1925)

## [0.83.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.11...v0.83.0) (2024-03-07)

### ⚠ BREAKING CHANGES

- **link:** do not render `p` for disabled link

### Bug Fixes

- avoid using reserved `$` for Svelte 5 compat ([a0d5028](https://github.com/carbon-design-system/carbon-components-svelte/commit/a0d5028540e1bcbb3b37bf488c11ea94f97b5fa7))
- **link:** do not render `p` for disabled link ([8bffc17](https://github.com/carbon-design-system/carbon-components-svelte/commit/8bffc17d650144ed0d5b778766f79c33334f0275)), closes [#1924](https://github.com/carbon-design-system/carbon-components-svelte/issues/1924)
- **search:** hoist ignore `a11y autofocus` comment ([6152b78](https://github.com/carbon-design-system/carbon-components-svelte/commit/6152b784c1e6b19ff242524e6b0c8c98b0107788))

### [0.82.11](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.10...v0.82.11) (2024-02-26)

### Bug Fixes

- **code-snippet:** `showMoreLess={false}` should hide button ([4085536](https://github.com/carbon-design-system/carbon-components-svelte/commit/40855361891c2388c2b775803bcac937fbd6c1d6)), closes [#1536](https://github.com/carbon-design-system/carbon-components-svelte/issues/1536)
- **image-loader:** updated `src` should update the image ([0f318aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f318aac7732c2b94ec0729d54416611fbd0d493)), closes [#1677](https://github.com/carbon-design-system/carbon-components-svelte/issues/1677)
- **overflow-menu:** use `offsetWidth`, `offsetHeight` to compute menu dimensions ([#1913](https://github.com/carbon-design-system/carbon-components-svelte/issues/1913)) ([2404244](https://github.com/carbon-design-system/carbon-components-svelte/commit/24042442213ca9daa0cf663aabf37b3544e9c364))
- **toast-notification:** fire `on:clear` from timeout correctly ([9aabe3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/9aabe3cbbb05712b71f5cad7c571b170c1f3a439)), closes [#1914](https://github.com/carbon-design-system/carbon-components-svelte/issues/1914)

### [0.82.10](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.9...v0.82.10) (2024-02-12)

### Bug Fixes

- **slider:** dispatch `on:input` event ([#1906](https://github.com/carbon-design-system/carbon-components-svelte/issues/1906)) ([90dbd15](https://github.com/carbon-design-system/carbon-components-svelte/commit/90dbd1562b04df3cf4de28874b6e790ddca1db81)), closes [#1643](https://github.com/carbon-design-system/carbon-components-svelte/issues/1643)

### [0.82.9](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.8...v0.82.9) (2024-02-07)

### Bug Fixes

- **context-menu:** prevent `on:contextmenu` default behavior only when opening menu ([#1911](https://github.com/carbon-design-system/carbon-components-svelte/issues/1911)) ([4ad522c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4ad522c197d4a389a6187a499e9e54d5d8b3994a)), closes [#1909](https://github.com/carbon-design-system/carbon-components-svelte/issues/1909)
- **types:** improve `e.detail` type for dispatched events ([#1907](https://github.com/carbon-design-system/carbon-components-svelte/issues/1907)) ([6590457](https://github.com/carbon-design-system/carbon-components-svelte/commit/65904575743ba06344fb75e14685e42494c13cde))

### [0.82.8](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.7...v0.82.8) (2024-01-10)

### Bug Fixes

- **button:** forward `on:focus` event ([#1878](https://github.com/carbon-design-system/carbon-components-svelte/issues/1878)) ([5901872](https://github.com/carbon-design-system/carbon-components-svelte/commit/59018728df08db18ba85609e6db1c6dd8701d8bb)), closes [#1830](https://github.com/carbon-design-system/carbon-components-svelte/issues/1830)

### [0.82.7](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.6...v0.82.7) (2023-12-17)

### Bug Fixes

- **radio-button:** allow `value` type to be a number ([#1868](https://github.com/carbon-design-system/carbon-components-svelte/issues/1868)) ([4792257](https://github.com/carbon-design-system/carbon-components-svelte/commit/479225711a1e304df74f0cfc585e32b5454afd66))

### [0.82.6](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.5...v0.82.6) (2023-12-17)

### Bug Fixes

- **package:** include types in exports map ([#1865](https://github.com/carbon-design-system/carbon-components-svelte/issues/1865)) ([053beee](https://github.com/carbon-design-system/carbon-components-svelte/commit/053beeef7cbb1031f09798ffc360f8c87d17e3e1)), closes [#1863](https://github.com/carbon-design-system/carbon-components-svelte/issues/1863)

### [0.82.5](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.4...v0.82.5) (2023-12-16)

### Bug Fixes

- **header-search:** blur input when `active` is false ([#1857](https://github.com/carbon-design-system/carbon-components-svelte/issues/1857)) ([6c9cf9e](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c9cf9e043b3c963a257a28fa8dd29c8acd4b2ce))
- **package.json:** add `exports` field to package.json to address Vite development warnings ([#1864](https://github.com/carbon-design-system/carbon-components-svelte/issues/1864)) ([7bef3fa](https://github.com/carbon-design-system/carbon-components-svelte/commit/7bef3fae6250607337306e95440b8a472638476f))

### [0.82.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.3...v0.82.4) (2023-11-21)

### Bug Fixes

- **header-search:** blur input when deactivating ([#1855](https://github.com/carbon-design-system/carbon-components-svelte/issues/1855)) ([192f6a7](https://github.com/carbon-design-system/carbon-components-svelte/commit/192f6a775c2a7da25e7fc4893efdc5a80b83928c))

### [0.82.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.2...v0.82.3) (2023-11-21)

### Bug Fixes

- **header-search:** "Escape" should close empty search bar ([#1853](https://github.com/carbon-design-system/carbon-components-svelte/issues/1853)) ([e667352](https://github.com/carbon-design-system/carbon-components-svelte/commit/e667352329651c25dc2d283eaa6cc8ca872040f6))

### [0.82.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.1...v0.82.2) (2023-11-20)

### Bug Fixes

- **header-search:** "Escape" should clear search query ([#1851](https://github.com/carbon-design-system/carbon-components-svelte/issues/1851)) ([6da4572](https://github.com/carbon-design-system/carbon-components-svelte/commit/6da4572c2672e02a6463ee8374fd341868512034))
- **header-search:** vertically center button icons ([#1850](https://github.com/carbon-design-system/carbon-components-svelte/issues/1850)) ([d68dc18](https://github.com/carbon-design-system/carbon-components-svelte/commit/d68dc182668dc0b56481d4646d672591cd7fc3e3))

### [0.82.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.0...v0.82.1) (2023-11-18)

### Bug Fixes

- **pagination-nav:** set `button type="button"` to prevent form submission ([#1846](https://github.com/carbon-design-system/carbon-components-svelte/issues/1846)) ([bed073c](https://github.com/carbon-design-system/carbon-components-svelte/commit/bed073c2f707392d3fe7d75fbf4550e723b93605))

### [0.82.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.81.3...v0.82.0) (2023-11-13)

### Features

- **tree-view:** add `showNode` accessor ([#1844](https://github.com/carbon-design-system/carbon-components-svelte/issues/1844)) ([1ad4e3d](https://github.com/carbon-design-system/carbon-components-svelte/commit/1ad4e3d3856e07fb1808f34b8c48dfc6a8a5e7d8)), closes [#1377](https://github.com/carbon-design-system/carbon-components-svelte/issues/1377)
- **tree-view:** make `node` slottable ([#1843](https://github.com/carbon-design-system/carbon-components-svelte/issues/1843)) ([6a55fef](https://github.com/carbon-design-system/carbon-components-svelte/commit/6a55fef62e095114a1782d1079501e9e940cca94)), closes [#1660](https://github.com/carbon-design-system/carbon-components-svelte/issues/1660)

### [0.81.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.81.2...v0.81.3) (2023-11-08)

### Bug Fixes

- **select-item:** export `class` and `style` props ([#1840](https://github.com/carbon-design-system/carbon-components-svelte/issues/1840)) ([a9460e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/a9460e944de9ae967664a75df842f4bdc909067f)), closes [#1839](https://github.com/carbon-design-system/carbon-components-svelte/issues/1839)

### [0.81.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.81.1...v0.81.2) (2023-10-27)

### Bug Fixes

- **multi-select:** render checkboxes for form data ([#1835](https://github.com/carbon-design-system/carbon-components-svelte/issues/1835)) ([7ba52df](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ba52df3a1ee89b06377a0b4888cce27cc89196f)), closes [#1742](https://github.com/carbon-design-system/carbon-components-svelte/issues/1742)

### [0.81.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.81.0...v0.81.1) (2023-10-23)

### Bug Fixes

- **multi-select:** reset `selectedIds` when clearing selection ([#1832](https://github.com/carbon-design-system/carbon-components-svelte/issues/1832)) ([e3ab471](https://github.com/carbon-design-system/carbon-components-svelte/commit/e3ab471018b9ac94ff9de2284284dc61ba69c881)), closes [#1831](https://github.com/carbon-design-system/carbon-components-svelte/issues/1831)

### [0.81.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.80.0...v0.81.0) (2023-10-13)

### Features

- **data-table:** pass `row` to `display` function ([#1810](https://github.com/carbon-design-system/carbon-components-svelte/issues/1810)) ([9456eaa](https://github.com/carbon-design-system/carbon-components-svelte/commit/9456eaab3ce5259d8f6dcaa7b3db9058d3555aa6))
- **deps-dev:** upgrade `carbon-components` to 10.58 ([#1828](https://github.com/carbon-design-system/carbon-components-svelte/issues/1828)) ([519bd86](https://github.com/carbon-design-system/carbon-components-svelte/commit/519bd8616a4fe16af4befb6a1159e62f42d9651c))

### Bug Fixes

- **file-uploader-button:** clear value by setting to `""` instead of `null` ([#1812](https://github.com/carbon-design-system/carbon-components-svelte/issues/1812)) ([108eb52](https://github.com/carbon-design-system/carbon-components-svelte/commit/108eb5286c46bd17a54ccbda31ee95f16a16763e))
- **radio-button-group:** add `name` and `required` props ([#1037](https://github.com/carbon-design-system/carbon-components-svelte/issues/1037)) ([24e2a88](https://github.com/carbon-design-system/carbon-components-svelte/commit/24e2a8874f5d0c39f88761c3f118ba71aab27c1d)), closes [#1036](https://github.com/carbon-design-system/carbon-components-svelte/issues/1036)
- **radio-button-group:** strongly type dispatched change/select events ([#1819](https://github.com/carbon-design-system/carbon-components-svelte/issues/1819)) ([06d81dd](https://github.com/carbon-design-system/carbon-components-svelte/commit/06d81ddbff8a6170d34ca1e94a41c16d318ec7ca))
- **tile-group:** add `name` and `required` props ([#1818](https://github.com/carbon-design-system/carbon-components-svelte/issues/1818)) ([836b360](https://github.com/carbon-design-system/carbon-components-svelte/commit/836b360b9b7402cb3cd44489fd5f14b8c901f9f2))

### [0.80.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.79.0...v0.80.0) (2023-08-26)

### Features

- **ui-shell:** forward `click` event to `HeaderActionLink` ([#1797](https://github.com/carbon-design-system/carbon-components-svelte/issues/1797)) ([e5675eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/e5675eb203db51de736b24f41694f5b020f9aafc)), closes [#1796](https://github.com/carbon-design-system/carbon-components-svelte/issues/1796)

### Bug Fixes

- **skeleton-text:** fix reactivity in `paragraph` variant ([#1794](https://github.com/carbon-design-system/carbon-components-svelte/issues/1794)) ([bc97ce5](https://github.com/carbon-design-system/carbon-components-svelte/commit/bc97ce5e1b69669d17f3ad13aaeb774b05c09c80)), closes [#1793](https://github.com/carbon-design-system/carbon-components-svelte/issues/1793)

## [0.79.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.78.0...v0.79.0) (2023-07-24)

### ⚠ BREAKING CHANGES

- **loading:** remove `id` prop from `Loading` (#1783)

### Features

- **file-uploader-button:** support `danger-tertiary`, `danger-ghost` button variants ([#1784](https://github.com/carbon-design-system/carbon-components-svelte/issues/1784)) ([709322c](https://github.com/carbon-design-system/carbon-components-svelte/commit/709322c2819e3123ade4a13e3fd7d05035154d6b))
- **file-uploader:** add `size` prop to `FileUploaderButton` ([#1786](https://github.com/carbon-design-system/carbon-components-svelte/issues/1786)) ([51c281d](https://github.com/carbon-design-system/carbon-components-svelte/commit/51c281de4a29b99e61952959a8cbfdba0b49e786))
- **file-uploader:** make `labelTitle`, `labelDescription` slottable ([#1780](https://github.com/carbon-design-system/carbon-components-svelte/issues/1780)) ([239f1b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/239f1b10e562507f66e3cd318084ed1de30f0c25))
- **slider:** add `hideLabel` prop ([#1777](https://github.com/carbon-design-system/carbon-components-svelte/issues/1777)) ([baff07e](https://github.com/carbon-design-system/carbon-components-svelte/commit/baff07e012b43e1a24b2e574a57509f711a463f6)), closes [#1682](https://github.com/carbon-design-system/carbon-components-svelte/issues/1682)

### Bug Fixes

- **file-uploader:** do not render empty element if `labelTitle`, `labelDescription` not provided ([#1778](https://github.com/carbon-design-system/carbon-components-svelte/issues/1778)) ([7ef8b73](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ef8b73252709130c8e269b83b2936e1631c96fa)), closes [#1775](https://github.com/carbon-design-system/carbon-components-svelte/issues/1775)
- **loading:** remove redundant `description` label ([#1783](https://github.com/carbon-design-system/carbon-components-svelte/issues/1783)) ([d6804b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6804b44fea0d4fc23574e63e7d4c64fa18e8f42)), closes [#1670](https://github.com/carbon-design-system/carbon-components-svelte/issues/1670)
- **types:** correctly type `kind` prop in `FileUploader`, `FileUploaderButton` ([#1781](https://github.com/carbon-design-system/carbon-components-svelte/issues/1781)) ([a7443c2](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7443c2dca396f79e06fed695374c0a15bda14ed))
- **types:** improve formatting of prop comments ([#1779](https://github.com/carbon-design-system/carbon-components-svelte/issues/1779)) ([be76370](https://github.com/carbon-design-system/carbon-components-svelte/commit/be763706ca7ab0182bc0f8171e74043ccbadf461))

## [0.78.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.77.0...v0.78.0) (2023-07-19)

### ⚠ BREAKING CHANGES

- **typescript:** minimum Svelte version for TypeScript users is 3.55

### Features

- **typescript:** support svelte 4 ([#1773](https://github.com/carbon-design-system/carbon-components-svelte/issues/1773)) ([2f026f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f026f792ad94f468b890a6d5ab36cc2642dacf2)), closes [#1753](https://github.com/carbon-design-system/carbon-components-svelte/issues/1753)

## [0.77.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.76.1...v0.77.0) (2023-07-13)

### Features

- **ui-shell:** add `preventCloseOnClickOutside` to `HeaderAction` ([#1625](https://github.com/carbon-design-system/carbon-components-svelte/issues/1625)) ([ea9b261](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea9b261b60698f9314e0aae4d61025bae215cccf)), closes [#1624](https://github.com/carbon-design-system/carbon-components-svelte/issues/1624)
- **ui-shell:** make `company` in `Header` slottable ([#1764](https://github.com/carbon-design-system/carbon-components-svelte/issues/1764)) ([9b3f014](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b3f014a0ba43abb5a36be4a6156910b5d7644d7))

### [0.76.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.76.0...v0.76.1) (2023-07-08)

### Bug Fixes

- **date-picker:** hide `helperText` if invalid or warning state ([#1759](https://github.com/carbon-design-system/carbon-components-svelte/issues/1759)) ([d5a4a8b](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5a4a8b94a8753545a54f7e43f1773e49a1ff208))
- **select:** hide `helperText` if invalid or warning state ([#1761](https://github.com/carbon-design-system/carbon-components-svelte/issues/1761)) ([7579c03](https://github.com/carbon-design-system/carbon-components-svelte/commit/7579c032faa3f1b9ad9d42f76da876f38725141e))
- **slider:** `disabled` Slider should not submit a form ([#1758](https://github.com/carbon-design-system/carbon-components-svelte/issues/1758)) ([ab21c89](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab21c89ab9240f61bd15d8c20bad65b3b469a29c))
- **types:** allow `data-*` attributes for props forwarded to HTML elements ([#1741](https://github.com/carbon-design-system/carbon-components-svelte/issues/1741)) ([7fdc2ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/7fdc2ef7f072382842cbb6bfc8e12e083aef1a1e))

### [0.76.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.75.1...v0.75.2) (2023-06-21)

### Features

- make `titleText` slottable in `MultiSelect`, `ComboBox` ([#1750](https://github.com/carbon-design-system/carbon-components-svelte/issues/1750)) ([0b4f19c](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b4f19c87e8479f0649fa2c5dc84beb4c1a1e302)), closes [#1747](https://github.com/carbon-design-system/carbon-components-svelte/issues/1747)

### [0.75.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.75.0...v0.75.1) (2023-06-02)

### Bug Fixes

- **expandable-tile:** set tile height using resize observer ([#1738](https://github.com/carbon-design-system/carbon-components-svelte/issues/1738)) ([a369962](https://github.com/carbon-design-system/carbon-components-svelte/commit/a369962fdf96f95bbdcc2f8f9f84c5d900ec4087))

### [0.75.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.74.0...v0.74.1) (2023-05-21)

### Features

- **pagination-nav:** add `tooltipPosition` prop ([#1733](https://github.com/carbon-design-system/carbon-components-svelte/issues/1733)) ([60a796e](https://github.com/carbon-design-system/carbon-components-svelte/commit/60a796ea48b17a4e8829b8782aaddb569534c7c4)), closes [#1656](https://github.com/carbon-design-system/carbon-components-svelte/issues/1656)

### [0.74.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.5...v0.74.0) (2023-05-18)

### Features

- **ui-shell:** make `HeaderNavItem` slottable ([#1693](https://github.com/carbon-design-system/carbon-components-svelte/issues/1693)) ([b9aaa3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/b9aaa3adcaf87e34ac3d45a2e39f1db92ebe1b33))

### Bug Fixes

- resolve `a11y` warnings from Svelte version 3.58 ([#1732](https://github.com/carbon-design-system/carbon-components-svelte/issues/1732)) ([c02b473](https://github.com/carbon-design-system/carbon-components-svelte/commit/c02b4738bce612359148267c79450c6650bf68d3))

### [0.73.5](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.4...v0.73.5) (2023-03-26)

### [0.73.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.3...v0.73.4) (2023-03-21)

### Bug Fixes

- **selectable-tile:** include dispatched events in types ([#1695](https://github.com/carbon-design-system/carbon-components-svelte/issues/1695)) ([ca40dd1](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca40dd18c2af1bc755b857c39469427038f20ece)), closes [#1694](https://github.com/carbon-design-system/carbon-components-svelte/issues/1694)
- **text-input:** correctly set input padding for warning state ([#1688](https://github.com/carbon-design-system/carbon-components-svelte/issues/1688)) ([821233a](https://github.com/carbon-design-system/carbon-components-svelte/commit/821233ab4f0bf247dea6a8aa32b79d15424ff059)), closes [#1687](https://github.com/carbon-design-system/carbon-components-svelte/issues/1687)

### [0.73.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.2...v0.73.3) (2023-03-11)

### Bug Fixes

- **1684:** hide helper text container in password input when not used ([#1685](https://github.com/carbon-design-system/carbon-components-svelte/issues/1685)) ([42349eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/42349ebc61fdc8756fc5209d4cb63f4f9a63dce9))

### [0.73.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.1...v0.73.2) (2023-02-27)

### Bug Fixes

- `readonly` should override `error` behavior in `TextInput`, `NumberInput` ([#1666](https://github.com/carbon-design-system/carbon-components-svelte/issues/1666)) ([6386c33](https://github.com/carbon-design-system/carbon-components-svelte/commit/6386c33f939b5fa310e8eb5a51412c6151de75d2)), closes [/github.com/carbon-design-system/carbon-components-svelte/pull/1666#pullrequestreview-1314558645](https://github.com/carbon-design-system//github.com/carbon-design-system/carbon-components-svelte/pull/1666/issues/pullrequestreview-1314558645)

### [0.73.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.0...v0.73.1) (2023-02-19)

### Bug Fixes

- **textinput/passwordinput:** apply aria-describedby to hint text ([b435be4](https://github.com/carbon-design-system/carbon-components-svelte/commit/b435be4f1221b30c9afd7a9e1c6867b38eeadeaa)), closes [#1633](https://github.com/carbon-design-system/carbon-components-svelte/issues/1633)

### [0.73.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.72.3...v0.73.0) (2023-02-19)

### Features

- **progress-bar:** add `status` prop ([#1560](https://github.com/carbon-design-system/carbon-components-svelte/issues/1560)) ([7ddbf17](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ddbf17cbb82bd78256037af8028ea20b9c35d5a))

### [0.72.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.72.2...v0.72.3) (2023-02-11)

### Bug Fixes

- **types:** add missing `$$restProps` for `Checkbox`, `Filename`, `FluidForm` ([#1655](https://github.com/carbon-design-system/carbon-components-svelte/issues/1655)) ([6450e8b](https://github.com/carbon-design-system/carbon-components-svelte/commit/6450e8b0b17e1538043f131d64e2d1fc667c95a8))

### [0.72.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.72.1...v0.72.2) (2023-02-05)

### Bug Fixes

- **dropdown:** dispatch correct `selectedItem` in `select` event ([#1646](https://github.com/carbon-design-system/carbon-components-svelte/issues/1646)) ([d897484](https://github.com/carbon-design-system/carbon-components-svelte/commit/d897484abfcc8be351ac87b0f0bb49900f4b4b1d)), closes [#1645](https://github.com/carbon-design-system/carbon-components-svelte/issues/1645)

### [0.72.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.72.0...v0.72.1) (2023-01-25)

### Bug Fixes

- **dropdown:** fix ssr issue ([#1639](https://github.com/carbon-design-system/carbon-components-svelte/issues/1639)) ([8cb5d53](https://github.com/carbon-design-system/carbon-components-svelte/commit/8cb5d538f7ad10d7c93e10c04f01d2c77b4eba44)), closes [#1638](https://github.com/carbon-design-system/carbon-components-svelte/issues/1638)

## [0.72.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.71.0...v0.72.0) (2023-01-18)

### ⚠ BREAKING CHANGES

- **tree-view:** remove `expanded` property from `TreeNode` interface (#1631)

### Bug Fixes

- **dropdown:** close when user clicks outside iframe ([#1596](https://github.com/carbon-design-system/carbon-components-svelte/issues/1596)) ([73aa6e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/73aa6e216aa99df3b0b3186398e6466db523cf88)), closes [#1595](https://github.com/carbon-design-system/carbon-components-svelte/issues/1595)
- **tree-view:** remove `expanded` property from `TreeNode` interface ([#1631](https://github.com/carbon-design-system/carbon-components-svelte/issues/1631)) ([ec867c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec867c46ba7adce02938d6516557d3312591fa5f)), closes [#1630](https://github.com/carbon-design-system/carbon-components-svelte/issues/1630)

## [0.71.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.71.0) - 2022-12-31

**Breaking Changes**

- `Select`: rename dispatched `change` event to `update`
- `Select`: forward `change` event
- `PaginationNav`: use 1-indexing to be consistent with `Pagination`
- `InlineNotification`: remove `iconDescription` prop (replaced with `closeButtonDescription` and `statusIconDescription`)

**Features**

- `Pagination`: dispatch `change` event when user interacts with previous/next buttons, or page/page size dropdowns
- `InlineNotification`: add `iconDescription` and `closeButtonDescription` props

**Documentation**

- link 'source code' to folder for multiple components
- `PaginationNav`: add description for `change` event

## [0.70.13](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.13) - 2022-12-08

**Fixes**

- support `NumberInput` incrementing/decrementing floating point values
- allow arrow keys to open and navigate `Dropdown` menu
- only fire `Dropdown` "select" event on interaction
- avoid runtime error if `Dropdown` items is an empty array
- avoid runtime error if `MultiSelect` items is an empty array
- avoid runtime error if `ComboBox` items is an empty array
- fire `OverflowMenu` "close" event when clicking outside menu
- fire `Popover` "click:outside" event when clicking sibling elements
- forward `Toggle` "change" and "keyup" events after `toggled` updates
- fix `ProgressStep` label text if `vertical`
- make `ProgressStep` inherit unclickable styles if `preventChangeOnClick`
- add explicit `type="button"` to `TableHeader` button
- add explicit `type="button"` to `ProgressStep` button
- loosen `TreeView` text prop type from `string` to `any`
- make `TreeView` children prop type work recursively
- remove unused `derived` import from `DataTable`

## [0.70.12](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.12) - 2022-10-13

**Fixes**

- `Search` prop types should extend `input` attributes

## [0.70.11](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.11) - 2022-10-13

**Fixes**

- ignore false positive a11y warnings from Svelte version 3.51
- `NumberInput` with `allowInput` should not be invalid if `value` is `null`

## [0.70.10](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.10) - 2022-10-04

**Fixes**

- avoid element reference error in `ListBoxMenuItem`
- display warn/invalid icons in `DatePickerInput` with calendar
- fix layout regression in `HeaderSearch`
- localize `HeaderAction`, `ImageLoader` transitions

## [0.70.9](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.9) - 2022-09-23

**Fixes**

- fix visual regression in next/previous buttons in `Pagination`, `PaginationNav`

## [0.70.8](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.8) - 2022-09-21

**Fixes**

- forward keyup, keydown, paste events in `ToolbarSearch` to `Search`

## [0.70.7](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.7) - 2022-09-17

**Fixes**

- prevent `submit` event on `Modal` if primary button is disabled

## [0.70.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.6) - 2022-09-05

**Fixes**

- resolve `Toggle`, `HeaderSearch` accessibility warnings in Svelte >=v3.50

## [0.70.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.5) - 2022-09-02

**Fixes**

- avoid left margin style if `Button` is icon-only

## [0.70.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.4) - 2022-08-31

**Fixes**

- correctly scroll item into view when keyboard navigating `Dropdown`, `ComboBox`, `MultiSelect`

## [0.70.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.3) - 2022-08-31

**Fixes**

- close menu in `Dropdown`, `MultiSelect` when pressing "Escape"
- prevent default behavior in `ComboBox` when pressing "Enter," "ArrowUp," or "ArrowDown"
- scroll item into view when keyboard navigating `Dropdown`, `ComboBox`, `MultiSelect`

## [0.70.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.2) - 2022-08-29

**Fixes**

- allow `$$restProps.style` to be correctly set on `Content`

## [0.70.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.1) - 2022-08-23

**Fixes**

- do not unset `Content` left margin for rail `SideNav`
- set `role`, `aria-label` attributes on `DatePicker` calendar container

## [0.70.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.0) - 2022-08-18

**Features**

- add `filteredRowIds` prop to `ToolbarSearch` to support pagination

## [0.69.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.69.0) - 2022-08-17

**Features**

- dispatch `on:click:header--select` event in `DataTable`
- dispatch `on:click:row--select` event in `DataTable`

## [0.68.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.68.0) - 2022-08-15

**Features**

- add `fullWidth` prop to `ToastNotification`
- dispatch cancelable `on:cancel` event in `ToolbarBatchActions`
- add `active` prop to `ToolbarBatchActions`

**Documentation**

- add `ToastNotification` example "Full width"
- add `DataTable` example "Batch selection with controlled toolbar"

## [0.67.9](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.9) - 2022-08-11

**Fixes**

- `NotificationActionButton` types should extend `Button` props

## [0.67.8](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.8) - 2022-08-10

**Fixes**

- remove `aria-checked="mixed"` if `InlineCheckbox` is indeterminate
- add `aria-labelledby` to `Slider` thumb
- add `role="switch"` to `Toggle` input

## [0.67.7](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.7) - 2022-08-07

**Fixes**

- remove UI Shell `Content` left margin if `SideNav` is collapsed

## [0.67.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.6) - 2022-08-05

**Refactor**

- use class directive in `TextInput`, `DatePickerInput`

**Fixes**

- avoid dynamic class names in `NotificationButton`, `NotificationIcon`
- forward keydown, keyup events to `NumberInput`

## [0.67.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.5) - 2022-08-04

**Fixes**

- correctly select a `ComboBox` item when pressing "Enter"

## [0.67.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.4) - 2022-07-26

**Fixes**

- override `Toggle` margin-top style if `hideLabel` is true

## [0.67.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.3) - 2022-07-26

**Fixes**

- correctly pluralize `Pagination` items display text
- prevent label text selection in `Toggle`
- add missing `hideLabel` prop to `Toggle`

## [0.67.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.2) - 2022-07-23

**Fixes**

- display correct `ComboBox` value if using `itemToString` and `shouldFilterItem` props

## [0.67.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.1) - 2022-07-12

**Fixes**

- set a high `z-index` on the `SideNav` overlay to avoid it being covered by other elements

## [0.67.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.0) - 2022-06-29

**Breaking Changes**

Svelte version >=3.48.0 is required.

- re-revert [924b6d35](924b6d352eebf5c82da63f0ead450dc59e80ca30) to allow close event in `ToastNotification`, `InlineNotification` to be cancellable

## [0.66.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.66.3) - 2022-06-29

**Fixes**

- revert [924b6d35](924b6d352eebf5c82da63f0ead450dc59e80ca30) and re-publish since v0.66.2 contains breaking changes

## [0.66.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.66.2) - 2022-06-29

**Fixes**

- allow close event in `ToastNotification`, `InlineNotification` to be cancellable

**Documentation**

- add `ToastNotification` example "Prevent default close behavior"
- add `InlineNotification` example "Prevent default close behavior"

## [0.66.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.66.1) - 2022-06-27

**Fixes**

- support `PasswordInput` invalid state when used in a `FluidForm`
- remove title attribute from `SideNavMenu` icon
- remove tabindex attribute from `SideNavMenu` icon
- override max-height in an expanded `SideNavMenu`
- fix `ComposedModal` type error where the focus node is possibly `null`

**Refactor**

- pass required `text` prop from `CodeSnippet` to `CopyButton` to prevent development warning

**Documentation**

- add `PasswordInput` example "Invalid state"
- rename `ComboBox` example "Selected id" to "Initial selected id"
- revise `DatePicker` example "DatePicker in a modal" to prevent iframe from stealing focus

## [0.66.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.66.0) - 2022-06-18

**Features**

- add `fullWidth` prop to `Slider`
- support number type for `selected` prop in `Select`

**Fixes**

- only dispatch "change" in `Select` if `selected` value has changed
- use first `SelectItem` value as default `selected` value in `Select` if `undefined`

**Documentation**

- add `Slider` example "Full width"
- revise `Select` example "Default" to demo usage without `selected` prop

## [0.65.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.65.3) - 2022-06-15

**Fixes**

- fix `TreeView` type error when keyboard navigating an expanded node

## [0.65.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.65.2) - 2022-06-12

**Fixes**

- `DataTable` header keys should be reactive
- use native binding for value prop in `TimePicker`
- use native binding for value prop in `ComboBox`, `MultiSelect`

## [0.65.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.65.1) - 2022-06-09

**Fixes**

- `DataTable` column sort direction order should be independent

## [0.65.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.65.0) - 2022-06-07

**Breaking Changes**

- mark array-type props as read-only

**Features**

- add `sortKey`, `sortDirection` props to `DataTable` for programmatic sorting
- forward `paste` event to `ComboBox`, `DatePicker`, `MultiSelect`, `NumberInput`, `Search`, `TextArea`, `TextInput`, `PasswordInput`, `TimePicker`, `HeaderSearch`
- support disabled items in `Dropdown`, `MultiSelect`, `ComboBox`

**Fixes**

- do not overwrite `cells` property in `rows` object in `DataTable`
- correctly toggle the body class if using nested modals
- remove useless `inline` prop from `Dropdown`
- remove redundant `Dropdown` list box role and id
- add missing `role="option"` and `aria-selected` attributes to `ListBoxMenuItem`

**Refactor**

- set alert `Modal` attributes in markup instead of script

**Documentation**

- add `DataTable` example "Programmatic sorting"
- add `Modal` example "Has scrolling content"
- add `Modal` example "Custom focus"
- add `Dropdown` example "Disabled items"
- add `MultiSelect` example "Disabled items"
- add `ComboBox` example "Disabled items"

## [0.64.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.64.3) - 2022-05-29

**Fixes**

- active tab in `Tabs` should not steal focus if programmatically selected
- set title attribute in `CheckBox`, `MultiSelect`, `Dropdown`, `ComboBox` if label is truncated

**Refactor**

- refactor components to use `class:` directive instead of the class attribute

**Documentation**

- add `Tabs` example "Disabled tabs"

## [0.64.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.64.2) - 2022-05-25

**Fixes**

- apply custom `DataTable` widths to empty columns

## [0.64.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.64.1) - 2022-05-23

**Fixes**

- mark `CopyButton` text prop as required
- mark `Dropdown` selectedId prop as required
- use `@see` tag in `Theme` tokens prop description
- remove `title` attribute from `Modal`, `ModalHeader` close button
- remove redundant `aria-label` from `Modal` close button icon
- add `aria-hidden="true"` to `Modal`, `ModalHeader` close button icon

**Documentation**

- update `Theme` docs to specify that it must be used with `all.css`
- update `DataTable` docs to note that custom widths do not work with `stickyHeader`

## [0.64.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.64.0) - 2022-05-14

**Breaking Changes**

- set `flatpickrProps.static` in `DatePicker` to be true by default
- use data attribute instead of id for `DataTable` headers/rows

**Features**

- support custom column widths in `DataTable`
- dispatch "expand" and "collapse" events in `CodeSnippet`

**Fixes**

- use `@see` tag for flatpickr options link in `DatePicker`
- pressing "Enter" in `DatePicker` should update the value
- dispatched event type without detail should be `null`, not `any`
- type missing "open" event in `HeaderAction`
- use small button in multi-line `CodeSnippet`

**Documentation**

- make calendar variants of `DatePicker` more prominent
- add `DataTable` example "Custom column widths"
- add `CodeSnippet` examples "Expanded by default" and "Reactive example"

## [0.63.8](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.8) - 2022-05-07

**Fixes**

- elevate `Toolbar` z-index so overflow menu is not clipped by the table

## [0.63.7](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.7) - 2022-05-04

**Fixes**

- strongly type `translateWithId` prop in `Dropdown`

## [0.63.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.6) - 2022-05-04

**Fixes**

- add `translateWithIdsSelection` prop to `ComboBox`, `MultiSelect` to customize clear selection description
- use default values in `ListBoxMenuIcon` if `translateWithIds` is undefined
- use default values in `ListBoxSelection` if `translateWithIds` is undefined

## [0.63.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.5) - 2022-05-02

**Fixes**

- dispatch "change" event in `Tabs` only if selected index has changed

## [0.63.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.4) - 2022-04-30

**Fixes**

- add missing `"2x3"` ratio value to `AspectRatio`
- fix typo in `ToolbarSearch` shouldFilterRows type annotation

**Documentation**

- correctly generate icon, action imports in examples
- remove unnecessary `tooltipBodyId` in `Tooltip` examples
- add `DataTable` "Expandable and selectable" example
- add `DataTable` "Batch selection" example

## [0.63.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.3) - 2022-04-28

**Fixes**

- fix `FileUploaderItem` regression where `delete` event should be dispatched if status is "edit"

**Documentation**

- add `FileUploader` "Item (edit)" example
- revise `FileUploader` "Item (edit status, invalid state)" example to include `on:delete` usage
- add `FileUploader` "Item (edit status, invalid state with subject, body)" example

## [0.63.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.2) - 2022-04-23

**Fixes**

- set `type="button"` on `Dropdown` to fix usage in a form
- re-focus search bar when clearing `ToolbarSearch` value

## [0.63.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.1) - 2022-04-18

**Fixes**

- `HeaderGlobalAction` icon size should be `20` by default
- fix `rows` reactivity in `DataTable`

## [0.63.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.0) - 2022-04-17

**Breaking Changes**

- remove deprecated components: `Icon`, `IconSkeleton`, `NotificationTextDetails`, `ToggleSmall`, `ToggleSmallSkeleton`, `HeaderActionSearch`
- remove deprecated component props
- remove `optimizeCarbonImports` preprocessor
- remove `GlobalHeader` and `SideNav` subfolders
- move `truncate` action from `actions` to `src/Truncate`

**Features**

- add `breakpointObserver`, `breakpoints` to base exports
- add `ProgressBar` `kind` prop to support inline, indented variants

**Fixes**

- add explicit `type="button"` attribute to interactive, filterable tag variants
- add TypeScript support for `sveltekit:` attributes for anchor elements
- `Link` types should extend `a` or `p` attributes
- prevent selectable `DataTable` with sticky header from jumping

**Refactor**

- use icons from `carbon-icons-svelte` v11

**Documentation**

- add `DataTable` "Sticky header" example
- refactor `Grid` examples
- add note to `UIShell` that theming is not supported
- add `ProgressBar` examples "Inline variant" and "Indented variant"

**Housekeeping**

- upgrade `carbon-components` to v10.56.0

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

- add `nonExpandableRowIds` prop to `DataTable` to specify rows that should not be expandable

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

- add DataTable example ["Sortable with nested object values"](https://svelte.carbondesignsystem.com/components/DataTable#sortable-with-nested-object-values)
- add ClickableTile example ["Disabled state"](https://svelte.carbondesignsystem.com/components/ClickableTile#disabled-state)
- add Link example ["Link with icon"](https://svelte.carbondesignsystem.com/components/Link#link-with-icon)

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

- add ["Padded columns"](https://svelte.carbondesignsystem.com/components/Grid#padded-columns) example to Grid docs
- demo different transitions in ["Header with app switcher"](https://svelte.carbondesignsystem.com/components/UIShell#header-with-app-switcher) example in UI Shell
- describe use case for [using native styles in OrderedList](https://svelte.carbondesignsystem.com/components/OrderedList#native-list-styles)

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

- Add example ["Skeleton with object headers"](https://svelte.carbondesignsystem.com/components/DataTable#skeleton-with-object-headers) to the DataTable docs
- Add example ["Header with global search"](https://svelte.carbondesignsystem.com/components/UIShell#header-with-global-search) to the UI Shell docs
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

- Add [programmatic RadioButton example](https://svelte.carbondesignsystem.com/components/RadioButton#programmatic-usage)
- Add [multiple ComboBox example](https://svelte.carbondesignsystem.com/components/ComboBox#multiple-combo-boxes)
- Add [multiple Dropdown example](https://svelte.carbondesignsystem.com/components/Dropdown#multiple-dropdowns)
- Add [multiple MultiSelect example](https://svelte.carbondesignsystem.com/components/MultiSelect#multiple-multi-select-dropdowns)
- Add [ExpandableAccordion recipe](https://svelte.carbondesignsystem.com/recipes/ExpandableAccordion#expandable-accordion)

## [0.23.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.23.0) - 2020-11-20

**Features**

- Persist UI Shell Header hamburger menu if `persistentHamburgerMenu` is `true` ([PR #396](https://github.com/carbon-design-system/carbon-components-svelte/pull/396), [issue #374](https://github.com/carbon-design-system/carbon-components-svelte/issues/374), [rendered example](https://svelte.carbondesignsystem.com/framed/UIShell/PersistedHamburgerMenu))
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
- Simplify date sort method in ["Sortable with custom display and sort methods"](https://svelte.carbondesignsystem.com/components/DataTable#sortable-with-custom-display-and-sort-methods) DataTable example ([PR #382](https://github.com/carbon-design-system/carbon-components-svelte/pull/382))
- Add [programmatic ProgressIndicator](https://svelte.carbondesignsystem.com/components/ProgressIndicator#programmatic-usage) example
- Add [vertical ProgressIndicatorSkeleton](https://svelte.carbondesignsystem.com/components/ProgressIndicator#skeleton-vertical) example
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

- DataTable: add example ["Empty column with overflow menu"](https://svelte.carbondesignsystem.com/components/DataTable#empty-column-with-overflow-menu)
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
  - [With custom display and sort methods](https://svelte.carbondesignsystem.com/components/DataTable#with-custom-display-and-sort-methods)
  - [With toolbar](https://svelte.carbondesignsystem.com/components/DataTable#with-toolbar)
  - [With toolbar (small size)](https://svelte.carbondesignsystem.com/components/DataTable#with-toolbar-small-size)
  - [Selectable](https://svelte.carbondesignsystem.com/components/DataTable#selectable)
  - [Initial selected rows](https://svelte.carbondesignsystem.com/components/DataTable#initial-selected-rows)
  - [Selectable with batch actions](https://svelte.carbondesignsystem.com/components/DataTable#selectable-with-batch-actions)
  - [Selectable (radio)](https://svelte.carbondesignsystem.com/components/DataTable#selectable-radio)
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

- Redesign component [documentation website](https://svelte.carbondesignsystem.com/)
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
