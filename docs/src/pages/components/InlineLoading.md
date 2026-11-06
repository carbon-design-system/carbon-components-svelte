---
components: ["InlineLoading"]
description: Inline loading indicators are compact, embeddable indicators ideal for showing progress during inline operations like form submissions or data updates.
---

<script>
  import { InlineLoading } from "carbon-components-svelte";
</script>

## Basic

Display a basic loading indicator with the default configuration.

<InlineLoading />

## With description

Add a descriptive text to provide context about the loading operation.

<InlineLoading description="Loading metrics..." />

## Small size

Set `size="sm"` for a status in a line of small text, such as "Saving…" in a toolbar or list row: 12px text and no minimum height.

<InlineLoading size="sm" description="Saving…" />

## Statuses

The component supports different status states to indicate progress:

| Status       | Description                         |
| ------------ | ----------------------------------- |
| **active**   | Shows an animated loading indicator |
| **inactive** | Displays a static state           |
| **finished** | Shows a success state             |
| **error**    | Displays an error state           |

<InlineLoading status="active" description="Submitting..." />
<InlineLoading status="inactive" description="Cancelling..." />
<InlineLoading status="finished" description="Changes saved" />
<InlineLoading status="error" description="Failed to save changes" />

### Icon description

Set `iconDescription` to override the accessible label announced for the status icon. For the `"finished"` and `"error"` states, it defaults to the `status` value if not set.

<InlineLoading status="error" iconDescription="Upload failed" description="Failed to upload file" />

### Live region roles

The `"error"` status renders `role="alert"`, interrupting the screen reader immediately, as demonstrated by the four `<InlineLoading>` examples above. Every other status renders `role="status"`, announced politely so it doesn't interrupt. Pass `role` through rest props to override either default.

## Delay

Set `delay` to wait a number of milliseconds after `status` becomes `"active"` before showing the spinner. Work that finishes within the delay goes straight to the next status. Once shown, the spinner stays for at least 500 ms so it does not flash. A status that arrives in that time waits for it, and the spinner keeps the description it had, so a spinner never blinks before "Saved". The `success` event fires `successDelay` milliseconds after the checkmark shows.

`"inactive"`, `"finished"`, and `"error"` render at once when no spinner is showing. While the spinner waits, it is in the page but hidden, so the server HTML holds it too.

<FileSource src="/framed/InlineLoading/InlineLoadingDelay" />

## Events

Listen for `on:success`, dispatched `successDelay` milliseconds (default `1500`) after `status` is set to `"finished"`.

<InlineLoading
  status="finished"
  description="Changes saved"
  successDelay={1000}
  on:success={() => console.log("success")}
/>

## UX example

See how to integrate the loading indicator in a real-world scenario.

<FileSource src="/framed/InlineLoading/InlineLoadingUx" />