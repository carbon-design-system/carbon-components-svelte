---
components: ["Announcer"]
description: Announcer is the page's shared live region, and announce() sends a short message to screen readers through it.
---

## Basic

Call `announce(message)` for the result of something the person did that nothing on the page tells a screen reader: a save, a copy, a count of results. The message is read politely, after what is being read now, and does not move focus.

`announce()` works without `<Announcer />`: it makes the region on the first message and holds that message back for 150 ms, so a screen reader sees the region before it changes. Place one `<Announcer />` near the root of the app, outside any container that is `inert` or `aria-hidden`, to have the region in the server HTML and the first paint instead.

<FileSource src="/framed/Announcer/AnnouncerBasic" />

| Do | Why |
| --- | --- |
| Announce the result of an action: "Saved", "3 files uploaded". | The page may not show it to a screen reader. |
| Announce counts and the edges of a process: "Loading", "12 results". | They tell the person the state changed. |
| Don't announce text as it grows, such as a streaming reply. Announce that it started and that it finished. | A reader that follows every word falls behind, and the person cannot get ahead of it. |
| Don't announce what a focused control already says. | The person hears it twice. |

## Channels and debounce

Every message belongs to a `channel`, `"default"` unless set. A newer message on a channel replaces the channel's earlier one. Different channels do not replace each other.

Set `debounce` for a message that changes while someone types or clicks, such as a result count. The announcer waits that many milliseconds after the channel's last message, then says the latest, so a count that changes ten times in a second is said once.

<FileSource src="/framed/Announcer/AnnouncerDebounce" />

The same message sent twice is read twice. Each message is its own element in the region, so no pause between messages and no invisible suffix is needed to make a screen reader say it again.

An empty message clears its channel: a message still waiting is dropped and the one in the region is removed. Send one when the thing the message was about is gone.

```js
announce("", { channel: "results" });
```

## In a dialog

A native `<dialog>` opened with `showModal()` removes everything outside it from the accessibility tree, and a screen reader that honors `aria-modal` ignores the page behind `Modal` and `ComposedModal`. A message in a region outside the dialog is not heard.

Pass `source`, the element the message is about. A message about an element in an open modal dialog goes to a region inside that dialog. Components that announce, such as `ComboBox`, `MultiSelect` and `Search`, pass their own element.

<FileSource src="/framed/Announcer/AnnouncerDialog" />

## Translations

The announcer says what it is given. Build the message with your translation function before the call.

```js
announce(t("saved", { count: 3 }), { channel: "save" });
```

## Notes

The region is `role="status"` with `aria-atomic="false"` and `aria-relevant="additions"`, so a reader says only the message that was added. It is visually hidden with `bx--visually-hidden`. A message is removed after 7 seconds, and a region the announcer made leaves the page once nothing holds it and its last message is gone. The server renders nothing, and `announce()` does nothing there.
