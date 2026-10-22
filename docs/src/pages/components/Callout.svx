---
components: ["Callout", "NotificationActionButton"]
description: Callouts show static guidance next to the content it is about. They stay on the page, can't be dismissed, and screen readers don't announce them.
---

<script>
  import {
    Button,
    Callout,
    Form,
    Link,
    NotificationActionButton,
    Stack,
    TextInput,
    Tile,
  } from "carbon-components-svelte";
</script>

## Basic

Place a callout next to the content it explains. The default kind is
`"info"`. See [detailed usage](https://carbondesignsystem.com/components/notification/usage)
for Carbon's guidance.

<Callout
  title="Scheduled downtime"
  subtitle="Billing is read-only on Saturday from 02:00 to 04:00 UTC."
/>

## Callout or InlineNotification

Use a callout for information that is true for as long as the page is
open: a limit, a prerequisite, or a side effect of the form below it.
It renders when the page renders, so it has no live region and no close
button.

Use an [InlineNotification](/components/InlineNotification) for the
result of something the user just did, such as a failed save. Its
`role="status"` makes screen readers announce it when it appears, and
the user can close it.

| Need | Use |
| :-- | :-- |
| Guidance that is part of the page | Callout |
| Feedback on an action, announced when it appears | InlineNotification |
| Feedback that floats over the page and can time out | [ToastNotification](/components/ToastNotification) |

## Kinds

Set `kind` to match the message. Callouts are mostly `"info"` or
`"warning"`. The status icon has a label, such as "Warning", so screen
readers convey the kind without color.

<Stack gap={5}>
  <Callout
    kind="info"
    title="Read-only role"
    subtitle="You can view this project. Ask a workspace admin for edit access."
  />
  <Callout
    kind="warning"
    title="Shared credentials"
    subtitle="Changing this key signs out every service that uses it."
  />
  <Callout
    kind="success"
    title="Verified domain"
    subtitle="Mail from acme.com passes SPF and DKIM checks."
  />
  <Callout
    kind="error"
    title="Unsupported region"
    subtitle="GPU instances aren't available in eu-west-3."
  />
  <Callout
    kind="info-square"
    title="Beta feature"
    subtitle="Usage-based alerts may change before general availability."
  />
  <Callout
    kind="warning-alt"
    title="Retention limit"
    subtitle="Logs older than 30 days are deleted on the Starter plan."
  />
</Stack>

## Low contrast

Set `lowContrast` to `true` for a lighter callout that sits inside page
content without drawing as much attention.

<Stack gap={5}>
  <Callout
    lowContrast
    kind="info"
    title="Read-only role"
    subtitle="You can view this project. Ask a workspace admin for edit access."
  />
  <Callout
    lowContrast
    kind="warning"
    title="Shared credentials"
    subtitle="Changing this key signs out every service that uses it."
  />
  <Callout
    lowContrast
    kind="success"
    title="Verified domain"
    subtitle="Mail from acme.com passes SPF and DKIM checks."
  />
  <Callout
    lowContrast
    kind="error"
    title="Unsupported region"
    subtitle="GPU instances aren't available in eu-west-3."
  />
</Stack>

## Title only

Leave out `subtitle` when the title says it all.

<Callout kind="warning" title="This workspace is archived." />

## Subtitle with a link

Use the "subtitleChildren" slot for rich content, such as a link. Set
`titleId` and point the link's `aria-describedby` at it, so screen
readers read the title along with the link.

<Callout
  kind="warning"
  title="Storage almost full"
  titleId="storage-callout-title"
>
  <svelte:fragment slot="subtitleChildren">
    Builds stop at 100%.
    <Link href="/settings/billing" aria-describedby="storage-callout-title">
      Upgrade your plan
    </Link>
  </svelte:fragment>
</Callout>

## Actions

Add a `NotificationActionButton` in the "actions" slot. The callout's
title describes the button for screen readers, with no extra setup.

<Callout
  kind="info"
  title="New audit log format"
  subtitle="Exports now include the actor's IP address and session id."
>
  <svelte:fragment slot="actions">
    <NotificationActionButton>View changes</NotificationActionButton>
  </svelte:fragment>
</Callout>

## Status icon label

Translate the status icon's label with `statusIconDescription`.

<Callout
  kind="warning"
  title="Maintenance planifiée"
  subtitle="La facturation est en lecture seule samedi de 02:00 à 04:00 UTC."
  statusIconDescription="Avertissement"
/>

## In a form

Put a callout above the fields it explains. Set `fullWidth` to `true` so
it lines up with the fields instead of the page's width limits.

<Form on:submit={(e) => e.preventDefault()}>
  <Stack gap={6}>
    <Callout
      fullWidth
      lowContrast
      kind="warning"
      title="Changing the domain"
      subtitle="Members sign in again, and old invite links stop working."
    />
    <TextInput name="domain" labelText="Workspace domain" value="acme" />
    <Button type="submit">Save domain</Button>
  </Stack>
</Form>

## In a tile

Set `fullWidth` to `true` to fill a tile or card.

<Tile>
  <Stack gap={5}>
    <h4>Payments API</h4>
    <p>Handles card and bank transfers for every workspace.</p>
    <Callout
      fullWidth
      lowContrast
      kind="info"
      title="Rate limit"
      subtitle="Each key can make 100 requests per second."
    />
  </Stack>
</Tile>
