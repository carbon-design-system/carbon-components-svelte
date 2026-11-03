---
components: ["Loading"]
description: Loading indicators display a full-screen or inline spinner, ideal for showing progress during page loads or data fetching.
---

<script>
  import { Loading } from "carbon-components-svelte";
</script>

## Basic

Display a loading indicator with a semi-transparent overlay that covers the entire viewport. While active, the overlay holds keyboard focus. Focus returns to the previous element when loading stops.

<FileSource src="/framed/Loading/Loading" />

## No overlay

Show a loading indicator without the overlay, allowing interaction with the underlying content.

<Loading withOverlay={false} />

## Small

Display a more compact loading indicator.

<Loading withOverlay={false} small />

## Description

Set `description` to name the spinner for screen readers. The overlay also uses it as the name of its dialog. Defaults to `"loading"`. The spinner is not a live region: the overlay is announced when its dialog takes focus, and a spinner inside a control, such as Button's, is read with that control.

<Loading description="Loading metrics..." withOverlay={false} />

## Delay

Set `delay` to wait a number of milliseconds after `active` becomes `true` before showing the spinner. Work that finishes within the delay shows no spinner. Once shown, the spinner stays for at least 500 ms so it does not flash.

While it waits, the spinner is in the page but hidden. The server HTML holds it too, and CSS shows it after the delay even before the page's script runs. This also covers a `Loading` that mounts when the work starts, as in `{#if loading}`.

<FileSource src="/framed/Loading/LoadingDelay" />

## Stop state

Set `active` to `false` to play the spinner's end-of-loading animation. Useful when transitioning out of a loading state before removing the component.

<Loading active={false} withOverlay={false} />
