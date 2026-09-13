---
description: Disclosures show and hide a section of content from a single, always-visible trigger.
---

<script>
  import { Disclosure } from "carbon-components-svelte";
</script>

## Basic

Create a disclosure with `summary` for the always-visible trigger text and a
default slot for the content it shows or hides.

<Disclosure summary="Show deployment details">
  <p>Build #4213 deployed to production at 2:14 PM UTC. Rollback available for the next 24 hours.</p>
</Disclosure>

## Left-aligned chevron

Align the chevron icon to the left side of the trigger by setting `align` to
`"start"`. The default is `"end"`.

<Disclosure align="start" summary="Show deployment details">
  <p>Build #4213 deployed to production at 2:14 PM UTC. Rollback available for the next 24 hours.</p>
</Disclosure>

## Custom summary slot

Customize the trigger content with the summary slot instead of `summary`
for more complex layouts with multiple elements.

<Disclosure>
  <svelte:fragment slot="summary">
    <strong>Deployment details</strong>
    <span>Build #4213 &middot; Production</span>
  </svelte:fragment>
  <p>Build #4213 deployed to production at 2:14 PM UTC. Rollback available for the next 24 hours.</p>
</Disclosure>

## Open state

Control whether the disclosure starts open, and read or drive its state
programmatically.

### Open by default

Set `open` to `true` to render the disclosure expanded.

<Disclosure open summary="Show deployment details">
  <p>Build #4213 deployed to production at 2:14 PM UTC. Rollback available for the next 24 hours.</p>
</Disclosure>

### Reactive (two-way binding)

Bind to `open` to control and read the disclosure state outside the component.
Listen for `toggle` to react to state changes, such as when the trigger is
activated with a click or the keyboard.

<FileSource src="/framed/Disclosure/ReactiveDisclosure" />
