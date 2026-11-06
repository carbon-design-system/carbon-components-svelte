---
components: ["BadgeIndicator", "Button", "HeaderGlobalAction"]
description: Badge indicators draw attention to unread counts and new activity on icon-only buttons.
---

<script>
  import { BadgeIndicator, Button, Stack } from "carbon-components-svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
</script>

## Basic

Compose a `BadgeIndicator` in the `badge` slot of an icon-only [Button](/components/Button) to overlay a badge on it. Omit `count`, or set it to `0`, to render an empty dot that signals presence without a number.

<Button
  kind="ghost"
  icon={Notification}
  iconDescription="Notifications"
>
  <BadgeIndicator slot="badge" />
</Button>

## Count

Control the badge content with `count`.

### Numeric

Set `count` to a number. Values greater than `999` display as `999+`.

<Stack orientation="horizontal" gap={7}>
  <Button
    kind="ghost"
    icon={Notification}
    iconDescription="Notifications"
  >
    <BadgeIndicator slot="badge" count={4} />
  </Button>
  <Button
    kind="ghost"
    icon={Notification}
    iconDescription="Notifications"
  >
    <BadgeIndicator slot="badge" count={25} />
  </Button>
  <Button
    kind="ghost"
    icon={Notification}
    iconDescription="Notifications"
  >
    <BadgeIndicator slot="badge" count={1000} />
  </Button>
</Stack>

### Formatted

Pass a string to `count` to override the built-in numeric display. String values bypass the `999+` cap.

<FileSource src="/framed/BadgeIndicator/FormattedCount" />

## In UI Shell

Use the [UI Shell](/components/UIShell) for header notifications and other utility indicators.

<FileSource src="/framed/UIShell/HeaderUtilities" />
