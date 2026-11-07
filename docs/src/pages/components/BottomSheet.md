---
components: ["BottomSheet"]
description: A bottom sheet slides up from the bottom edge of a small screen. It rests at snap points, moves by dragging, and can block the page or sit beside it.
keywords: ["drawer", "action sheet", "bottom drawer", "detent", "snap points", "mobile"]
---

<script>
  import { Callout } from "carbon-components-svelte";
</script>

<Callout
  title="Preview"
  subtitle="Carbon has no bottom sheet. BottomSheet follows iOS sheets and Material bottom sheets, so its API may change in a minor release."
/>

## Basic

Bind `open` to show the sheet. Without `snapPoints` it rests at half height and full height. Set `snapPoints` to `["content"]` for an action sheet that is as tall as its content. A modal sheet dims the page, keeps focus inside, and locks page scroll. It closes from its close button, <DocKbd label="Escape" />, a tap on the scrim, or a drag down past its shortest snap point. Focus returns to the trigger when it closes.

<FileSource src="/framed/BottomSheet/BottomSheet" />

## Snap points

A snap point is where the sheet rests. Each entry in `snapPoints` is one of these:

| Snap point | Height |
| --- | --- |
| `"peek"` | 120px: the grabber and a title |
| `"half"` | Half the window |
| `"full"` | The window, less a 48px gap at the top |
| `"content"` | As tall as the header, content and footer |
| A number, such as `480` | That many px |
| A percentage, such as `"40%"` | That share of the window |

The sheet opens at the shortest one. Heights are limited to `"full"`, and entries that land on the same height merge. Bind `snapPoint` to read where the sheet rests or to move it. Moving it from outside animates, and `snap` fires when the user moves it by dragging, with the keyboard, or by focusing a field the sheet hides.

<FileSource src="/framed/BottomSheet/BottomSheetSnapPoints" />

## Filter sheet

Below the tallest snap point, a drag anywhere on the sheet moves it and the content does not scroll. At the tallest snap point the content scrolls, and a drag down that starts with the content at the top moves the sheet. A scroll that reaches the top while the finger is still going down hands the rest of the drag to the sheet. Put the primary buttons in the `actions` slot: they stay on the visible bottom edge at every snap point.

<FileSource src="/framed/BottomSheet/BottomSheetFilter" />

## Persistent sheet

Set `modal` to `false` for a sheet that sits beside the page, like the results of a map. There is no scrim, no focus trap and no scroll lock, so the page behind stays usable. The sheet is a `complementary` landmark named by its `title`. Set `dismissible` to `false` to keep it from closing: a drag below the shortest snap point stretches and springs back, <DocKbd label="Escape" /> does nothing, and the close button hides. A non-modal sheet leaves focus where it is when it opens.

<FileSource src="/framed/BottomSheet/BottomSheetPersistent" />

## Wide screens

At and above `breakpoint` the sheet stops being a sheet, with the same markup and state:

| Mode | Narrow | Wide |
| --- | --- | --- |
| Modal | A sheet with a scrim | A centered dialog, up to 32rem wide |
| Non-modal | A sheet beside the page | A 24rem panel on the inline-end edge, full height |

The grabber and the snap points go away, and the content scrolls inside the dialog or panel. Set `breakpoint` to a width in px or to one of Carbon's breakpoint names (`"md"` is the default, 672px). Set it to `false` to stay a sheet at every width. The breakpoint is read after the page loads, so a server-rendered open sheet renders as a sheet until then; a sheet is closed by default.

<FileSource src="/framed/BottomSheet/BottomSheetBreakpoint" />

## Keyboard and screen readers

Dragging has an equivalent for every action: the close button closes, and the grabber is a slider.

| Key | On the grabber |
| --- | --- |
| <DocKbd label="ArrowUp" /> or <DocKbd label="PageUp" /> | Move to the next taller snap point |
| <DocKbd label="ArrowDown" /> or <DocKbd label="PageDown" /> | Move to the next shorter snap point |
| <DocKbd label="Home" /> | Move to the shortest |
| <DocKbd label="End" /> | Move to the tallest |
| <DocKbd label="Escape" /> | Close, when `dismissible` |

The grabber is a slider named "Resize sheet" with an `aria-valuetext` such as "Half height". Set `resizeLabel` and `resizeValueText` to translate them. A sheet with one snap point has nothing to resize, so its grabber is decorative. Focusing a field that sits below the visible part of the sheet moves the sheet to the shortest snap point that shows it.

A modal sheet is a `dialog` with `aria-modal`, named by its title; a non-modal sheet is a landmark. Without a `title`, set `aria-label` or `aria-labelledby`.

## On a phone

| Do | Why |
| --- | --- |
| Add `viewport-fit=cover` to the viewport meta tag. | The sheet pads the bottom by `env(safe-area-inset-bottom)`, which is `0` without it. |
| Put the primary action in the `actions` slot. | It stays on the visible edge at every snap point, above the home indicator. |
| Keep a way to close that is not a drag. | A drag is hard with one hand, a switch device or a screen reader. The close button covers it. |
| Leave `dismissible` on for a modal sheet. | A user who cannot drag still needs to leave. |
| Don't nest a scrolling area that scrolls sideways inside a sheet and expect it to move the sheet. | A mostly sideways drag always belongs to the content. |

The sheet sizes itself with the visual viewport, so the on-screen keyboard lifts it instead of covering its lower part. Its CSS height is capped with `100dvh`, with `100vh` as the fallback. With reduced motion, the sheet snaps with no easing and a drag clamps at the ends instead of stretching.

## Events

| Event | Detail |
| --- | --- |
| `open` | None |
| `close` | `trigger`: `"escape-key"`, `"outside-click"`, `"close-button"`, `"drag"` or `"programmatic"`. Cancelable: call `preventDefault()` to keep the sheet open. |
| `snap` | `snapPoint`, `index` and `trigger` (`"drag"`, `"keyboard"` or `"focus"`) |
