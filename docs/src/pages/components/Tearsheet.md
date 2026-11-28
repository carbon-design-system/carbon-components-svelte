---
components: ["Tearsheet"]
description: Tearsheets hold a focused task that outgrows a modal but should not become a page, such as a multi-field form or a review step.
---

<script>
  import { Callout } from "carbon-components-svelte";
</script>

<Callout
  titleText="Preview"
  subtitleText="Tearsheet follows Carbon React's Tearsheet from Carbon for IBM Products, which Carbon React does not export yet. Its API may change in a minor release."
/>

## Basic

Bind `open` to show the tearsheet. It slides up from the bottom, stops short of the top of the window, and closes from its close button or <DocKbd label="Escape" />. Focus moves to the first field when it opens and returns to the trigger when it closes. Use `labelText` for a step or category above the title, and `descriptionText` for a sentence below it.

Put footer buttons in the `actions` slot; the tearsheet lays them out in an [ActionSet](/components/ActionSet). A tearsheet with `actions` is transactional: it hides the close button and stays open on an outside click, so a stray click can't discard a form. A tearsheet without `actions` is passive, shows the close button, and closes on an outside click. Omit the `actions` slot entirely for a passive tearsheet: an empty slot still counts as `actions`.

<FileSource src="/framed/Tearsheet/Tearsheet" />

## Sizes

Set `size` to `"narrow"` for a single column. The default is `"wide"`, which spans the window with a margin on each side. A narrow tearsheet is as wide as a small [Modal](/components/Modal) and does not render `headerActions`. Both fill the window below the `md` breakpoint.

<FileSource src="/framed/Tearsheet/TearsheetSizes" />

## Closing

When the tearsheet closes, focus returns to the trigger. Set `returnFocusTo` to an element, or a function returning one, to focus that element instead. To fall back only when the trigger has unmounted, return the trigger while it is still connected. See Modal's [return focus to another element](/components/Modal#return-focus-to-another-element) example.

### Passive

Without `actions`, a tearsheet shows a close button and closes on an outside click. Set `preventCloseOnClickOutside` to `true` to keep it open.

<FileSource src="/framed/Tearsheet/TearsheetPassive" />

### Cancelable

The `close` event fires with `trigger` set to `"close-button"`, `"escape-key"`, `"outside-click"` or `"programmatic"`. Call `preventDefault()` on the first three to keep the tearsheet open, for example to confirm before discarding changes.

<FileSource src="/framed/Tearsheet/TearsheetCancelable" />

## Slots

### Header actions

Put buttons in the `headerActions` slot to place them beside the title. Wide tearsheets only: a narrow tearsheet does not render the slot, and nothing warns, so move those buttons to `actions` or use `size="wide"`.

<FileSource src="/framed/Tearsheet/TearsheetHeaderActions" />

### AI label

Put an [AILabel](/components/AILabel) in the `decorator` slot to mark AI-generated content. The tearsheet takes the AI surface.

<FileSource src="/framed/Tearsheet/TearsheetAILabel" />

## Layering

The tearsheet is a layer, like a modal. Its header and footer sit on the layer surface. A wide body is the page surface, so fields in it use the field color of the page and a [Layer](/components/Layer) inside steps up once. A narrow body sits one level up on the layer surface, as a modal's body does.

<FileSource src="/framed/Tearsheet/TearsheetLayer" />

## Overlays inside

Menus, dropdowns and the date picker calendar open in a portal, so a tearsheet body never clips them. A [Modal](/components/Modal) rendered inside the tearsheet opens above it, for example to confirm a discard. The tearsheet leaves no `transform` on its container once it has slid in, so the modal still covers the window.

<FileSource src="/framed/Tearsheet/TearsheetModal" />

A [Modal](/components/Modal), [ComposedModal](/components/ComposedModal) or [ConfirmModal](/components/ConfirmModal) sits one level above a tearsheet, so one opened from a tearsheet is on top wherever it is in the document. The reverse needs care. To open a tearsheet from inside a modal, or from another overlay with a `transform`, wrap it in a [Portal](/components/Portal), because a fixed element inside a transformed ancestor is placed and clipped by that ancestor instead of the window. A tearsheet rendered inside a modal, portalled or not, sits one level above that modal.

## Usage

| Do | Why |
| --- | --- |
| Use `actions` for transactional work, and leave the slot out for read-only content | Its presence decides the close button and the outside-click rule, as in Carbon v11. |
| Open a Modal from a tearsheet, wherever it is in the document | A Modal sits one level above a tearsheet, so a confirm over unsaved changes is on top. |
| Wrap a tearsheet rendered inside a modal or other transformed container in a Portal | The tearsheet is fixed to the window, and a transformed ancestor becomes its containing block. |
| Give a tearsheet a `titleText`, or an `aria-label` | The dialog needs a name, and the title provides it. |
