# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

- Selectable/expandable `DataTable`

## [0.8.4](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.8.4) - 2020-07-22

- add Grid components (`Grid`, `Row`, `Column`)
- add `PaginationNav` component
- fix `TooltipIcon` to avoid `$$restProps.class` override

## [0.8.3](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.8.3) - 2020-07-20

- bump `carbon-icons-svelte` dependency to version >=10.14.0
- support `size` prop (`undefined` or `"sm"` or `"lg`) in `DatePickerInput`, `NumberInput`, `Select`, `PasswordInput`, `TextInput` components
- support light variant for `ContentSwitcher`
- focus `ComboBox` after clearing the selection
- fix `ListBox` regression where size class can be overriden by `$$restProps.class`
- fix `Pagination` regression where current page selection value is stuck at `1`

## [0.8.2](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.8.2) - 2020-07-19

- fix `ComboBox` to close dropdown menu when pressing the "Escape" key ([Issue #198](https://github.com/IBM/carbon-components-svelte/issues/198))

## [0.8.1](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.8.1) - 2020-07-19

- fix bug in `Tag` to prevent custom class from overriding tag class
- fix SSR rendering issue in `Modal` by replacing `onDestroy` with `onMount` ([Issue #200](https://github.com/IBM/carbon-components-svelte/issues/200))

## [0.8.0](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.8.0) - 2020-07-19

- use $$restProps API (requires Svelte version >=3.20)
- upgrade `carbon-icons-svelte` to version >=10.13.0
- use svelte class:{value} API instead of `cx`
- add ref prop to "interactive" components like text inputs, anchor links... ([Issue #196](https://github.com/IBM/carbon-components-svelte/issues/196))
- add slot to Content Switcher `Switch` component ([Issue #183](https://github.com/IBM/carbon-components-svelte/issues/183))
- fix `ContentSwitcher` bug where bound `selectedIndex` could not be updated
- remove unused lib utilities (cx, css, fillArray)
- refactor component exports and folder structure
- create Sapper app for e2e testing and alternative development environment in `docs/`
- update Travis CI config to build library, build storybook, and run e2e tests in `docs/`
- remove Jest in favor of integration/e2e testing with Cypress
- update contributing guidelines

## [0.7.6](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.7.6) - 2020-07-19

- Add named slot to UI Shell `HeaderAction` component for text
  ([PR#201](https://github.com/IBM/carbon-components-svelte/pull/201), thanks [@danielboven](https://github.com/danielboven))

## [0.7.5](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.7.5) - 2020-07-17

- Add `name` prop to form-related components
  ([PR#199](https://github.com/IBM/carbon-components-svelte/pull/199), thanks [@softartisan](https://github.com/softartisan))

- Add `Content`, `SkipToContent` components to the UI Shell

- Forward `on:click` event to UI Shell `Header` component

## [0.7.4](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.7.4) - 2020-06-17

- Fix `OverflowMenu` focus behavior to set `didOpen` only if `open` is true ([PR#193](https://github.com/IBM/carbon-components-svelte/pull/193))

## [0.7.3](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.7.3) - 2020-06-16

- Fix `OverflowMenu` to focus button only after closing the menu ([PR#192](https://github.com/IBM/carbon-components-svelte/pull/192))

## [0.7.2](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.7.2) - 2020-06-04

- Add sort direction to dispatched "click:header" event for a sortable `DataTable`
  ([PR#188](https://github.com/IBM/carbon-components-svelte/pull/188), thanks [@mabentley85](https://github.com/mabentley85)!)

## [0.7.1](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.7.1) - 2020-06-03

- Add missing RadioTile export

## [0.7.0](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.7.0) - 2020-05-29

- Dispatch "update" event in `Pagination` for `pageSize`, `page` variables
  ([PR#185](https://github.com/IBM/carbon-components-svelte/pull/185), thanks [@mabentley85](https://github.com/mabentley85)!)

- Drop carbon-components as a peer dependency

## [0.6.3](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.6.3) - 2020-05-26

- Replace `"javascript:void(0)"` with `"/"` in `HeaderNavMenu` href attribute to fix a11y "not a valid attribute" warning; `href` is an exported property that can be overriden by the consumer
  ([Issue #184](https://github.com/IBM/carbon-components-svelte/issues/184))

- Ignore `a11y-no-onchange` warning in `TimePickerSelect`

- Bump development dependency `svelte` to v3.23.0

## [0.6.2](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.6.2) - 2020-05-09

- Fix `tileMaxHeight` bug in `ExpandableTile` by setting the value only if the default value is 0
  ([Issue #180](https://github.com/IBM/carbon-components-svelte/issues/180))

## [0.6.1](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.6.1) - 2020-05-08

- Fix `Pagination` bug by binding the correct variable (`selected`) to the `Select` component
  ([PR#179](https://github.com/IBM/carbon-components-svelte/pull/179), thanks [@ericol](https://github.com/ericol)!)

## [0.6.0](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.6.0) - 2020-05-07

- Fix button with icon bug by manually setting `hasIconOnly` in `Button`. This results in a breaking change for icon-only buttons, which now must include `hasIconOnly`
  ([Issue #174](https://github.com/IBM/carbon-components-svelte/issues/174))

## [0.5.1](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.5.1) - 2020-05-03

- Fix focus/dispatch bug in `Modal`, `ComposedModal`
  ([PR#173](https://github.com/IBM/carbon-components-svelte/pull/173), thanks [@mfeitoza](https://github.com/mfeitoza)!)

## [0.5.0](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.5.0) - 2020-04-29

- Ship `DataTable` that supports sorting

- Pin dependencies, remove commitlint, husky, eslint, prettier

## [0.4.2](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.4.2) - 2020-04-20

- Forward `on:blur` event to Select component
  ([PR#169](https://github.com/IBM/carbon-components-svelte/pull/169), thanks [@httpsOmkar](https://github.com/httpsOmkar)!)

## [0.4.1](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.4.1) - 2020-04-18

- Refactor UI Shell components to be modular (header, left panel, right panel)
  ([PR#168](https://github.com/IBM/carbon-components-svelte/pull/168), thanks [@mfeitoza](https://github.com/mfeitoza)!)

## [0.4.0](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.4.0) - 2020-04-18

- Refactor UI Shell to be component-based
  ([PR#166](https://github.com/IBM/carbon-components-svelte/pull/166), thanks [@mfeitoza](https://github.com/mfeitoza)!)

## [0.3.3](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.3.3) - 2020-03-09

- Fix "window is undefined" error when using UIShell with server-side rendering (SSR)
  ([PR#149](https://github.com/IBM/carbon-components-svelte/pull/149), thanks [@pbxothi](https://github.com/pbxothi)!)

## [0.3.2](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.3.2) - 2020-02-12

- Fix `SkeletonText` duplicate style attribute to work with `svelte^3.18.2`
  ([#134](https://github.com/IBM/carbon-components-svelte/issues/134))

## [0.3.1](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.3.1) - 2020-02-03

- Fix `DatePicker` locale initialization bug

- Fix `CheckboxSkeleton` styles; bump `carbon-components` version to ^10.9.3

## [0.3.0](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.3.0) - 2020-02-03

- Add `UIShell` component (thanks [@Heydan83](https://github.com/Heydan83)!)
  ([#10](https://github.com/IBM/carbon-components-svelte/issues/10))

- Add single component skeleton states for `Accordion`, `CodeSnippet`

- Fix `Select`, `SelectItem` to support two-way binding, programmatic prop setting

- Fix `Tab` to set `selected` prop to `currentIndex` after updating

## [0.2.1](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.2.1) - 2020-01-08

- Check if `l10n.en` is defined in `DatePicker` component to resolve Svelte REPL compilation

## [0.2.0](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.2.0) - 2020-01-08

- Include `src` in files published to npm to resolve Svelte module entry
  ([#102](https://github.com/IBM/carbon-components-svelte/issues/102))

- Support most Carbon components (See the [GitHub project](https://github.com/IBM/carbon-components-svelte/projects/1))

## [0.1.0](https://github.com/IBM/carbon-components-svelte/releases/tag/v0.1.0) - 2019-12-15

- Initial release
