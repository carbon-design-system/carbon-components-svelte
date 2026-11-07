---
components: ["ErrorSummary"]
description: An error summary lists every error of a form at its top after a failed submit, with a link to each field. It takes focus so screen readers read it, and a link brings the field and its label into view.
keywords: ["validation", "GOV.UK", "form errors"]
---

<script>
  import { ErrorSummary, Stack } from "carbon-components-svelte";
</script>

## Basic

Pass `errors`, one entry per message with the id of its field. Submit the
form with errors to show the summary. It takes focus, and each link moves
focus to its field and scrolls the field's label into view, so the user sees
what the field asks for.

Give each field an `id`. A group such as a radio group takes its `id` on the
group, and the link focuses the first control inside it (the checked radio,
if any).

<FileSource src="/framed/ErrorSummary/ErrorSummarySignUp" />

## Collect errors from the form

Fields that show their own messages (through `invalid` and `invalidText`)
already say which field is invalid and why. `collectFormErrors` reads that
back from the form, in document order, so the app does not keep a second
list of ids and messages. Call it after the fields render their messages.

It reads `aria-invalid="true"` and the message each control points to with
`aria-errormessage` or `aria-describedby`. A field with several controls
that share one message, such as a slider's thumb and number input, a pin
code, or a checkbox group, is listed once at its first control.

<FileSource src="/framed/ErrorSummary/ErrorSummaryCollect" />

## Server-side validation

The summary renders on the server like any other markup, and its links are
plain `#id` links, so they work before the page hydrates. When the errors
come from a form action, map the field names to ids and pass them to
`errors`. The summary takes focus when it appears and `focus()` moves focus
to it again on a repeated failed submit.

Prefix the page title with "Error:" while errors show, so a screen reader
announces the problem as the page loads.

<FileSource src="/framed/ErrorSummary/ErrorSummaryServer" />

## Title and description

Set `title` to name the summary for screen readers. "There is a problem" is
the default; a count such as "Fix 3 errors" tells users how much is left. Set
`description` for a line of guidance under the title.

<Stack gap={6}>
  <ErrorSummary
    focusOnShow={false}
    title="Fix 2 errors"
    description="Your changes are not saved until these are fixed."
    errors={[
      { message: "Enter a service name" },
      { message: "Choose a region" },
    ]}
  />
</Stack>

An entry without a `fieldId` is text, for an error that belongs to the whole
form, such as a failed request.

## Focus

The summary is a `group` named by its heading. It takes focus when it
appears, so a screen reader reads the title, and the list of links follows.
Set `focusOnShow` to `false` to keep focus where it is, as for live
validation while the user types. The summary then becomes an `alert`, which
a screen reader announces without a move of focus.

When the summary already shows and the user submits again, `errors` may not
change, so call `focus()` after a failed submit.

## Usage

| Do | Why |
| --- | --- |
| Put the summary at the top of the form, above the first field. | Screen reader users and keyboard users meet it before the fields, and it sits where focus lands. |
| Write each message so it makes sense out of context, such as "Enter a date of birth", and match the field's own message. | The link text is read on its own in a list of links. |
| List the errors in the order of the fields. | Users fix a form from the top, so the links follow the page. |
| Keep the summary until the errors are fixed, then remove it by emptying `errors`. | A summary that disappears while the user reads it moves the form under them. |
| Prefix the page title with "Error:" while the summary shows. | The title is the first thing a screen reader announces on a new page. |
| Do not use the summary alone. Keep `invalid` and `invalidText` on each field. | The summary points to the problem; the field's message sits next to the control and names it for assistive technology. |

## Link targets

A link moves focus to the control, not to the element with the id. After the
jump the label is at the top of the view, as GOV.UK does it: for a group of
radios or checkboxes, the legend, so the question and its options show
together; for any other field, its label. Focus moves without a second
scroll.

| Field | Focus lands on |
| --- | --- |
| `TextInput`, `PasswordInput`, `TextArea`, `NumberInput`, `Select`, `TimePicker`, `Search`, `TagInput` | The input |
| `Dropdown`, `MultiSelect` | The combobox button |
| `ComboBox`, filterable `MultiSelect` | The filter input |
| `DatePicker` | The input (each input of a range has its own link) |
| `Slider`, `RangeSlider` | The thumb |
| `Checkbox`, `Toggle` | The checkbox or switch |
| `CheckboxGroup`, `RadioButtonGroup` | The first checkbox, or the checked radio, with the legend scrolled into view |
| `PinCodeInput` | The first segment |

Pass the id of the field, or of the element that holds it, as `fieldId`.
Listen for `select` to take over, for example to open the tab or accordion
panel that holds the field before focus moves. Call `event.preventDefault()`
and call `focusField(fieldId)` when the field is ready.

```svelte
<ErrorSummary
  {errors}
  on:select={(event) => {
    if (event.detail.error.fieldId === "billing-address") {
      event.preventDefault();
      selectedTab = 1;
      tick().then(() => focusField("billing-address"));
    }
  }}
/>
```

## Fixed header

A fixed header, such as the `UIShell` header, covers the top of the view
where the label scrolls to. Set `scrollMargin` to the header's height in
pixels.

```svelte
<ErrorSummary {errors} scrollMargin={48} />
```
