---
components: ["SessionTimeoutModal"]
description: A session timeout modal warns signed-in users before they are signed out, counts down the time left, and lets them stay signed in or sign out.
keywords: ["idle", "inactivity", "session expiry", "auto logout", "WCAG 2.2.1"]
---

## Basic

Create the timer with `createIdleTimer` and pass it to the dialog. The timer watches for activity and decides when to warn and when to end the session. The dialog opens for the warning and again once the session has ended, and starts the timer on mount. This one lasts 15 minutes and warns 2 minutes before the end.

The dialog is an alert dialog. The time on screen changes every second, but screen readers are told only at 1 minute, 30 seconds and 10 seconds. <DocKbd label="Escape" /> and a click outside do not close it, and activity does not dismiss it: the user chooses to stay signed in or to sign out. Before a user has to sign in again, WCAG 2.2.1 (Timing Adjustable) asks for a warning and at least 20 seconds to extend the session.

<FileSource src="/framed/SessionTimeoutModal/SessionTimeoutBasic" />

```svelte
<script>
  import { createIdleTimer, SessionTimeoutModal } from "carbon-components-svelte";

  const timer = createIdleTimer({
    timeout: 15 * 60 * 1000,
    warnBefore: 2 * 60 * 1000,
    onExpire: ({ remote }) => {
      if (!remote) fetch("/logout", { method: "POST" });
      location.href = "/signed-out";
    },
  });
</script>

<SessionTimeoutModal {timer} />
```

## Timing

### Idle session

Set `timeout` to the idle time in milliseconds and `warnBefore` to how long before the end the warning starts. Pointer presses, key presses, scrolling and a tab becoming visible count as activity. Set `events` to change the list, or to `[]` and call `timer.activity()` for input the page cannot see, such as a video call.

Activity is ignored once the warning has started. It is also ignored when it arrives after the end, so waking a laptop never revives a session that has already ended.

### Server-driven expiry

Set `expiresAt` to a `Date` or a timestamp, such as a token's `exp`, when the server decides. Activity then does not move the end. Move it with `timer.setExpiresAt(date)` when a new token arrives, which also closes a warning.

A device clock that is off by minutes would warn at the wrong time. Pass the server's current time as `serverNow`, from a `Date` response header or the token's `iat`, to correct for it. Or compute the end from a lifetime (`Date.now() + expires_in * 1000`), which needs no correction.

```svelte
const timer = createIdleTimer({ expiresAt: token.exp * 1000, serverNow: Date.parse(response.headers.get("Date")) });
```

<FileSource src="/framed/SessionTimeoutModal/SessionTimeoutServer" />

### Extending on the server

Pass `onExtend` to tell the server the user is here. It runs when the user chooses to stay signed in, and the warning stays up until it resolves. Return the new end of the session (`{ expiresAt }`) when the server sets it, or nothing to add `timeout` from now. If it throws, the dialog stays open with an error and `onError` runs.

With `onExtend`, activity also calls it, at most once per `heartbeat` milliseconds (by default half the time before the warning), so a server that slides its own session stays in step with the page. Set `heartbeat` to `false` to call it only when the user chooses to stay.

## Tabs

Set `crossTab` to share the session between the tabs of an origin. Activity in one tab extends all of them, a choice to stay closes the warning in all, and signing out of one signs out all. A tab uses a `BroadcastChannel`, or `storage` events where there is none. Use `channelName` to keep two apps on one origin apart.

`onExpire` runs in every tab, so call the server once, for `remote: false`, and let the other tabs only leave the page.

<FileSource src="/framed/SessionTimeoutModal/SessionTimeoutTabs" />

## Sleep and hidden tabs

The timer compares the clock with the end time at every check, so it never counts timers. A laptop that sleeps through the end shows the ended dialog on waking, and one that wakes inside the warning shows the real time left. A hidden tab can run its timers only about once a minute; it catches up as soon as it is shown or another tab reports the end. The server stays the authority: sign the user out there as well.

## Text and announcements

Replace any text with a prop. `description` holds `{time}`, which is replaced by the live countdown. `announceAt` lists the seconds left at which screen readers hear `announcement`; a threshold already passed when the dialog opens is skipped, because the dialog reads its text on opening. Translate `announcement` too.

<FileSource src="/framed/SessionTimeoutModal/SessionTimeoutText" />

## Keyboard

Focus moves to the stay signed in button when the dialog opens, and returns to the control that had it when the warning is closed.

| Key | Action |
| --- | --- |
| <DocKbd label="Tab" />, <DocKbd label="Shift+Tab" /> | Move between the buttons; focus stays in the dialog |
| <DocKbd label="Enter" />, <DocKbd label="Space" /> | Press the focused button |
| <DocKbd label="Escape" /> | Does nothing: the user chooses |

## Server rendering

Nothing runs on the server. `createIdleTimer` sets no timer and adds no listener until `start()`, which does nothing without a window, and the dialog starts it on mount. The server renders a closed dialog.

## Guidance

| Do | Why |
| --- | --- |
| Warn at least 20 seconds before the end, and 2 minutes or more for a long form | WCAG 2.2.1 requires time to extend; people using assistive technology need more |
| Call the server once from `onExpire`, for `remote: false` | Every tab runs it, and the others only need to leave the page |
| Keep the stay signed in button as the first and primary action | It takes initial focus, so a keyboard user can extend with one key |
| Save drafts before the session ends | Signing out loses form input; the warning is the last chance to keep it |
| Return the new end from `onExtend` when the server sets it | The page then follows the server's clock, not a guess |
