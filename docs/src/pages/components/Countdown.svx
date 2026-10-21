---
components: ["Countdown"]
description: Countdowns show the time left on a hold, a session or a meter, counting down every second and announcing only a warning and the end.
---

<script>
  import { Countdown } from "carbon-components-svelte";
</script>

## Basic

Set `seconds` to the length of the countdown. The time is written as m:ss, or h:mm:ss from an hour up, in a `role="timer"` element. The `end` event fires at zero, and right away if the time is already up.

<Countdown seconds={125} />

## Format

Set `format` to `"h:mm:ss"` to always show hours.

<Countdown seconds={1800} format="h:mm:ss" />

## Deadline

Set `until` to a `Date` or timestamp when the end comes from the server, such as a session timeout or a seat hold. The time left follows the clock, so it stays right after a reload and agrees across tabs. Set `seconds` to the full length too if a slot uses `fraction`.

```svelte
<Countdown until={hold.expiresAt} seconds={600} on:end={releaseSeats} />
```

## Announcements

Screen readers hear `warnDescription` when `warnAt` seconds are left, and `expiredDescription` at zero, not every second. Neither is shown. For a session that times out, warn early enough to act: at least 20 seconds, and more when the page holds a long form.

```svelte
<Countdown until={session.expiresAt} warnAt={120} warnDescription="Two minutes until you're signed out" />
```

## Extend and pause

Bind `remaining` and add to it to extend the time, which also restarts a countdown that already reached zero. Bind `running` and set it to `false` to pause.

With `until`, the deadline sets the time left and changing `remaining` has no lasting effect. Extend by setting a later `until` instead, which restarts the countdown the same way.

## Custom rendering

The default slot receives `remaining`, `formatted` and `fraction` (the share of `seconds` left), such as for a ProgressBar.

<FileSource src="/framed/Countdown/CountdownProgress" />
