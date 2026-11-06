---
title: Gestures
layout: guide
description: Recognize tap, double tap, long press, pan, pinch and swipe from Pointer Events with one action, and keep each gesture reachable without it.
---

`gesture` is a Svelte action that turns Pointer Events into tap, double tap, long press, pan, pinch and swipe. It listens on one element, races the gestures you ask for, and gives the press to the first that claims it. It sets `touch-action` for you, ends a gesture cleanly when the browser takes over to scroll, and adds nothing to the page until a press starts. Import it with `import { gesture } from "carbon-components-svelte"`.

A gesture is never the only way to do something. Every example on this page has a button or a key that does the same thing, because a gesture is not available to everyone: a person using a switch, a voice control, a head pointer or a single finger cannot always pinch, hold or drag. See [A way in without the gesture](#a-way-in-without-the-gesture).

## Basic

Pass the recognizers you need. A function stands for a recognizer's main handler, so `tap: fn` is `tap: { onTap: fn }`. This pad has every recognizer on and logs what it hears. Try a mouse, a pen and a finger: each is a press, and the log names the pointer type.

<FileSource src="/framed/Gestures/GestureLog" />

```svelte
<script>
  import { gesture } from "carbon-components-svelte";
</script>

<div
  use:gesture={{
    tap: (event) => open(event.clientX, event.clientY),
    doubleTap: () => zoomToggle(),
    longPress: { onLongPress: () => lift(), delay: 500 },
    pan: { onMove: (event) => move(event.deltaX, event.deltaY) },
    pinch: { onChange: (event) => zoom(event.deltaScale) },
    swipe: { axis: "x", onSwipe: (event) => go(event.direction) },
  }}
>
  ...
</div>
```

`createGestures(node, options)` is the same function for code that is not in a template. Both return `update`, `destroy` and `cancel`.

## Recognizers

| Gesture | Fires | Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `tap` | On release | Up to 10 px of movement and 500 ms | With `doubleTap` it waits the double-tap interval, so a single tap is late by that long |
| `doubleTap` | On the second release | 300 ms apart and 30 px | The second tap is not also a tap |
| `longPress` | Once, when held | 500 ms and 10 px of movement | `onEnd` fires on release unless the hold went on to a pan |
| `pan` | `onStart`, `onMove`, `onEnd` | 4 px for a mouse or pen, 8 px for a finger | `onEnd` has the release velocity, and `cancelled` and `reason` |
| `pinch` | `onStart`, `onChange`, `onEnd` | 4 px of spread or travel | Reports `scale`, `deltaScale`, `rotation` and the midpoint |
| `swipe` | On release | 30 px along the axis and 0.3 px per ms | Reports `direction` and the velocity, for a fling |

Every handler receives a `GestureEvent` with the pointer position, where the press began, the distance moved, the pointer type and the original event. A pan's `onEnd` also has the release velocity in pixels per millisecond, which `inertiaStep` turns into a fling.

## Who gets the press

A press is one race. Each recognizer starts as possible, and the first to claim the press makes the ones that cannot share it fail.

| Claim | Fails | Keeps |
| :--- | :--- | :--- |
| Held long enough | Tap, double tap, swipe | Pan and pinch |
| Moved past the pan threshold | Tap, double tap, long press | Swipe, pinch |
| A second finger moved | Tap, long press, swipe. A pan in progress ends with `reason: "superseded"` | The remaining finger pans again when one lifts |
| A second finger landed with no pinch asked for | Tap, long press, swipe | Pan carries on with the first finger |
| Moved along the other axis | A pan with `axis` set | The page scrolls |

A finger that moves before a hold finishes is a scroll. A pan with `touch: "afterLongPress"` waits for the hold, so a swipe over the element still scrolls the page and a hold then drags. The hold hands its press to the pan: only the pan's `onEnd` fires.

## The browser's scroll and zoom

`touch-action` tells the browser which touches it may take. The action sets it from the gestures you ask for, so a horizontal pan keeps the page's vertical scroll.

| You ask for | `touch-action` | The browser keeps |
| :--- | :--- | :--- |
| Tap, long press | `auto` | Everything |
| Double tap | `manipulation` | Scroll and pinch zoom, but not double-tap zoom |
| Pan or swipe along `x` | `pan-y pinch-zoom` | Vertical scroll |
| Pan or swipe along `y` | `pan-x pinch-zoom` | Horizontal scroll |
| Pan or swipe both ways | `pinch-zoom` | Page zoom only |
| Pinch | `none` | Nothing: two fingers are yours |
| Pan after a long press | `auto` | Scroll, until the hold |

Set `touchAction` to your own value, or to `false` to manage it yourself. When the browser starts to scroll anyway it cancels the pointer, and the gesture ends with `cancelled: true` and `reason: "cancel"`.

## Zoom and pan

A pinch with two fingers, `Ctrl` with a wheel, and a trackpad pinch in Safari all arrive in the same `pinch` handlers, with `source` telling them apart. A pan drags the image and a fling carries on after release, unless the person asked for reduced motion. A double tap toggles the zoom.

<FileSource src="/framed/Gestures/ImageZoom" />

| Do | Why |
| :--- | :--- |
| Zoom by `deltaScale` about the midpoint, not by `scale` from the start. | A pinch that also moves keeps the point under the fingers, and a wheel pinch has no start to measure from. |
| Offer zoom in, zoom out and fit buttons, and `+`, `-` and `0` keys. | A pinch needs two fingers. Success criterion 2.5.1 asks for a way with one pointer. |
| Skip the fling when `prefers-reduced-motion` is set. | The pan then stops where the pointer left it. |

## Hold and drag

A mouse or pen drags a row at once. A finger holds first, so a swipe still scrolls the list. Both end in the same `pan` handlers. The hold lifts the row, and the pan moves it. Press `Escape` while dragging to put the row back.

<FileSource src="/framed/Gestures/LongPressReorder" />

Dragging is a gesture too, and success criterion 2.5.7 asks for a way that is not a drag. Each row has move up and move down buttons, and `Alt` with the arrow keys moves a focused row.

### With a drag engine

`gesture` and `pointerDrag` can share a page without fighting. Put each on the element that owns the press: `pointerDrag` on a handle and `gesture` on the card around it. Do not put both on one element.

- Presses that start on a button, link, form control or `[data-gesture-ignore]` are left alone. Set `ignore` to change the selector.
- A press that `pointerDrag` on an element inside has started is left alone. `pointerDrag` marks the `pointerdown` with `claimPointer`, which any drag engine can call from `src/utils/pointer-claim.js`. A press whose `pointerdown` was handled with `preventDefault()` is left alone too.
- If an element inside the node captures the pointer in some other way, the gesture ends with `reason: "claimed"`. The element that holds the pointer owns it.
- `cancel()` ends a press in progress, for a drag engine that wants to take over. The `startEvent` on every handler's event is the `pointerdown` to start it with.

## Swipe

A swipe is a quick flick along an axis. `pan` follows the finger and `swipe` decides at release, so the row can slide with the finger and leave for good on a flick. The directions are physical: left is left in a right-to-left page too.

<FileSource src="/framed/Gestures/SwipeToDismiss" />

A swipe to dismiss hides an action, so the same action must be visible. Each row here has a Dismiss button.

## A way in without the gesture

A gesture asks for more than a click does: two fingers, a timed hold, or a path. Give each its plain alternative in the same place.

| Gesture | Alternative | Success criterion |
| :--- | :--- | :--- |
| Pinch, wheel zoom | Zoom in, zoom out and fit buttons, and `+`, `-` and `0` | 2.5.1 Pointer Gestures |
| Double tap | The same buttons | 2.5.1 |
| Long press | A menu button, `Enter`, or the context menu key on the focused item | 2.5.1, 2.1.1 Keyboard |
| Pan | Arrow keys on the focused element | 2.1.1 |
| Drag to move | Move buttons, or `Alt` with the arrow keys | 2.5.7 Dragging Movements |
| Swipe | A visible button for the action | 2.5.1 |

| Do | Why |
| :--- | :--- |
| Put the button or key next to the gesture, in the same component. | A gesture handler that nobody can reach without a pointer is a bug in a keyboard user's eyes. |
| Keep targets of 24 by 24 CSS pixels or more. | Success criterion 2.5.8 asks for it, and a small button cannot stand in for a gesture. |
| Announce the result in a polite live region. | A pan and a swipe change the page without moving focus. |

## Touch details

A held finger does things the page did not ask for. While a press from a finger or pen is down on an element with `longPress`, the action prevents `contextmenu`, `selectstart` and `dragstart` on it, and sets `-webkit-touch-callout: none` on the element so iOS does not offer to copy a held link or image. A mouse's context menu is untouched. This is done by event for the length of the press, so no style is applied to the element's descendants.

To keep a held finger from scrolling, the action adds a non-passive `touchmove` listener to the element, only while a hold may go on to a pan. The browser waits for such a listener before it scrolls, so a finger down on the element scrolls less smoothly. An element without both `longPress` and `pan` has no such listener.

An idle element listens for `pointerdown` and nothing else. Move, up, cancel and `Escape` listeners exist on the document for one press. A `wheel` listener and the three Safari `gesture` listeners exist only when `pinch` is set.

## Reduced motion, right-to-left and the server

The action moves nothing, so it has no motion to reduce. Your handlers do. Read `prefers-reduced-motion` when a gesture ends, skip momentum and slide-out animation, and keep the result.

Swipe directions are physical. Swap `left` and `right` yourself for a swipe that means previous and next in a right-to-left page.

`gesture` touches `window` and `document` only when a press starts, so it imports on the server and runs after hydration. It works in Svelte 3, 4 and 5.

## Options

| Option | Type | Default | Notes |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | Off cancels the press in progress and restores `touch-action` |
| `tap` | `{ onTap, tolerance, maxDuration }` | | |
| `doubleTap` | `{ onDoubleTap, interval, distance }` | | |
| `longPress` | `{ onLongPress, onEnd, delay, tolerance }` | | |
| `pan` | `{ onStart, onMove, onEnd, axis, threshold, touchThreshold, touch }` | | `touch: "afterLongPress"` needs `longPress` |
| `pinch` | `{ onStart, onChange, onEnd, threshold, wheel }` | | `wheel: false` leaves `Ctrl` with a wheel to the page |
| `swipe` | `{ onSwipe, axis, minDistance, minVelocity }` | | |
| `pointerTypes` | `("mouse" \| "pen" \| "touch")[]` | all | Other types do not start a press |
| `ignore` | `string` | Controls and links | `""` turns the exclusion off |
| `touchAction` | `string \| false` | From the gestures | |
