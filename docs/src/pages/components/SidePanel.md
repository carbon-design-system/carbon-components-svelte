---
components: ["SidePanel"]
description: Side panels keep users in the context of a page while they view details, edit settings or work through a short flow.
keywords: ["drawer"]
---

## Basic

Bind `open` to show the panel. It docks under the UI Shell header and closes from its close button or <DocKbd label="Escape" />. Put footer buttons in the `actions` slot. The panel lays them out in an [ActionSet](/components/ActionSet) sized to the panel. Set `condensedActions` to `true` for 48px buttons in place of 64px.

Use a side panel for work that relates to the page under it, such as editing a row or filtering a list. For a task that needs the user's full attention, use a [Modal](/components/Modal). For global tools such as notifications or a switcher, use a [UI Shell](/components/UIShell) `HeaderPanel`.

`titleText` names the panel for screen readers. A panel without a title needs an `aria-label`. A long title wraps onto more lines. It is never cut off.

<FileSource src="/framed/SidePanel/SidePanel" />

## Focus

When the panel opens, focus moves to the first match:

1. The element that matches `selectorPrimaryFocus` (default: `[data-modal-primary-focus]`)
2. The first input, textarea or select
3. The close button

When the panel closes, focus goes back to the element that opened it. A panel already open when the page loads leaves focus where it is, unless it's modal. Set `selectorPrimaryFocus` to `null` to move focus yourself.

## Closing

The panel dispatches a cancelable `close` event. Call `e.preventDefault()` to keep it open, for example while a form has unsaved changes. `e.detail.trigger` tells you what closed it: `"escape-key"`, `"outside-click"`, `"close-button"` or `"programmatic"`. The last one means your code set `open` to `false`.

Set `hideCloseButton` to `true` to remove the close button. Give the user another way out, such as a Cancel button.

<FileSource src="/framed/SidePanel/SidePanelPreventClose" />

## Without a header

The panel docks under the UI Shell `Header` when one is on the page, and spans the full height without one. To dock it under another fixed bar, set the `--ccs-side-panel-top` custom property to the bar's height. Set it on `:root` for all panels, or as a prop on one: `<SidePanel --ccs-side-panel-top="4rem">`. A server render places the panel under the header until the page loads.

<FileSource src="/framed/SidePanel/SidePanelNoHeader" />

## Sizes

Set `size` to control the panel width. The default is `"md"`, 480px. A panel never takes more than 75% of the window.

<FileSource src="/framed/SidePanel/SidePanelSizes" />

## Placement

Set `placement` to `"start"` or `"end"` to choose the edge the panel docks to. The default is `"end"`, the right edge in a left-to-right layout and the left edge in a right-to-left one. Carbon React's `"left"` and `"right"` map to `"start"` and `"end"`.

<FileSource src="/framed/SidePanel/SidePanelPlacement" />

## Overlay

Set `includeOverlay` to `true` to dim the page behind the panel. The panel is then modal: it keeps focus inside and stops the page from scrolling. Clicking the overlay closes a panel without actions. A panel with actions stays open, so a stray click can't discard a form. Set `preventCloseOnClickOutside` to change either.

<FileSource src="/framed/SidePanel/SidePanelOverlay" />

## Slide-in

Set `slideIn` to `true` to push the page content aside so the panel doesn't cover it. Set `selectorPageContent` to the element to push, such as the UI Shell `Content`. A slide-in panel is part of the page: it leaves focus where it is and does not close on <DocKbd label="Escape" />.

<FileSource src="/framed/SidePanel/SidePanelSlideIn" />

## Resizable

Set `resizable` to `true` to let users drag the panel's free edge, or move it with the arrow keys once it has focus. <DocKbd label="Home" /> and <DocKbd label="End" /> jump to the narrowest and widest widths, and a double click restores `size`. Bind `width` to read or save the width. The `resize` event fires once per gesture. The handle hides on narrow screens.

<FileSource src="/framed/SidePanel/SidePanelResizable" />

## Multi-step

Set `currentStep` to show a back button from the second step on. Listen for `back` to go to the previous step. If the button that has focus goes away when the step changes, focus moves to the first field of the new step.

<FileSource src="/framed/SidePanel/SidePanelMultiStep" />

## Action toolbar

Put buttons for the panel's content in the `toolbar` slot, below the title.

<FileSource src="/framed/SidePanel/SidePanelToolbar" />

## AI label

Put an [AILabel](/components/AILabel) in the `decorator` slot to mark AI-generated content. The panel takes the AI surface.

<FileSource src="/framed/SidePanel/SidePanelAILabel" />

## Layering

The panel starts a [Layer](/components/Layer) wherever it renders, like a modal. Its body sits one level up, so fields and tiles in it contrast with the panel, and a `Layer` inside steps up again.

<FileSource src="/framed/SidePanel/SidePanelLayer" />

## Right-to-left

Inside a `dir="rtl"` page or a [LayoutDirection](/components/LayoutDirection), the panel mirrors: an end panel docks to the left, and the close and back buttons swap corners. The resize handle and its arrow keys follow the edge. To render the panel outside a transformed container, wrap it in a [Portal](/components/Portal), which keeps the direction and the [ThemeZone](/components/ThemeZone) theme.

<FileSource src="/framed/SidePanel/SidePanelRtl" />
