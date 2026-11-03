---
components: ["DurationInput"]
description: Duration inputs collect a length of time, such as a session timeout or a task estimate, as unit segments you step through or as free text such as 1h 30m.
---

<script>
  import { Box, DurationInput, Layer, Stack } from "carbon-components-svelte";
</script>

## Basic

The default field has a spinbutton for hours, minutes and seconds. `value` is the duration in milliseconds, or `null` when the field is empty.

<DurationInput labelText="Session timeout" value={5400000} />

Type digits to fill a segment; focus moves on once the segment cannot take another digit. Type `:`, `.`, a comma or a space to move on early. <DocKbd label="↑" /> and <DocKbd label="↓" /> step the focused segment and carry into the next one up, so one minute past `59` is `1h 0m`. See [Keyboard](#keyboard) for the full map.

## Value

Bind `value` to read the duration. It is a number of milliseconds, so it works with `setTimeout`, `Date` arithmetic and `Intl.DurationFormat`, and a `change` event fires for each edit the user makes.

<FileSource src="/framed/DurationInput/DurationInputBindable" />

Set `name` to include the duration in a form. A hidden input submits the milliseconds, or an empty string, and a form reset restores the segments.

## Format

Set `variant` to choose how the duration is entered. Both share the same value, range, states and form behavior.

| Variant | Use it when | Role |
| --- | --- | --- |
| `"segmented"` | People enter clock-like times, or step through a few values with the keyboard. | A group of spinbuttons, one for each unit. |
| `"text"` | People paste or type a length from elsewhere, or the range is wide. | One textbox. |

### Segmented

<DurationInput labelText="Time on task" />

### Text

The text variant reads `1h 30m`, `1 hour, 30 minutes`, `90m`, `1.5h`, `1:30`, `1:30:15` and ISO 8601 durations such as `PT1H30M` or `P1DT2H`. A bare number counts in `smallestUnit`. The field rewrites what it read as `1h 30m` once the text is committed with <DocKbd label="Enter" /> or when focus leaves, and announces the result in words. Text that is not a duration marks the field invalid, with `parseErrorText`, and keeps the previous value.

Months and years vary in length, so `P1M` and `P1Y` are not durations here. The unit words are English abbreviations in every locale.

<DurationInput variant="text" labelText="Time estimate" smallestUnit="minute" helperText="For example 1h 30m, 90m or PT1H30M" />

The segmented variant accepts the same text when pasted into any segment.

## Units

Set `largestUnit` and `smallestUnit` to choose the segments. The largest unit has no upper limit of its own, so `"hour"` takes `100` hours; use `"day"` for longer spans. Each smaller segment carries and borrows from the one above it.

<Stack gap={7}>
  <DurationInput labelText="Retention" largestUnit="day" smallestUnit="minute" value={93720000} />
  <DurationInput labelText="Timer" smallestUnit="millisecond" value={61005} />
  <DurationInput labelText="Meeting length" smallestUnit="minute" value={5400000} />
</Stack>

The largest segment takes two typed digits. Larger counts come from the arrow keys, a paste, the text variant, or a `max` that needs three digits.

### Step

Set `step` to the number of smallest units the arrow keys move by, and what typed values round to. Here the minutes move in quarter hours.

<DurationInput labelText="Reminder" smallestUnit="minute" step={15} value={900000} />

## Range

Set `min` and `max` in milliseconds. The arrow keys stop at the limits, typing stays under `max`, and a value under `min` rises to it when focus leaves. A `value` set from outside is shown as given.

<DurationInput labelText="Break length" smallestUnit="minute" step={5} min={300000} max={7200000} value={900000} />

## Localization

Unit labels come from `Intl.NumberFormat`, and the spoken duration from `Intl.DurationFormat` where the browser has it, with `Intl.ListFormat` joining the amounts otherwise. Set `locale` to write them in another language, and `unitDisplay` to choose `"narrow"`, `"short"` or `"long"` labels.

<Stack gap={7}>
  <DurationInput labelText="Dauer" locale="de" unitDisplay="short" value={3723000} />
  <DurationInput labelText="Durée" locale="fr" unitDisplay="long" value={3723000} />
</Stack>

The default `locale` is `"en"`, so the server and the browser render the same text. Pass the user's locale when you have it.

### Screen readers

Every segment announces the whole duration, such as "1 hour, 30 minutes", as its `aria-valuetext`, so a carry that changes the hours is heard while the minutes segment has focus. Override the wording with `durationText` and the segment names with `segmentLabelText`.

<DurationInput
  labelText="Duración"
  locale="es"
  durationText={(total, units, locale) => `${Math.round(total / 60000)} minutos en total`}
  segmentLabelText={(unit, label) => `Campo de ${label}`}
  value={5400000}
/>

Digits read left to right in every language, so the segments keep their order under `dir="rtl"` and the arrow keys keep their direction.

## States

Reflect validation and interaction states.

### Invalid

<DurationInput labelText="Timeout" invalid invalidText="The timeout must be under one hour" value={7200000} />

### Warning

<DurationInput labelText="Cache lifetime" warn warnText="Short lifetimes raise server load" value={5000} />

### Disabled

Set `disabled` to `true` to prevent user interaction.

<DurationInput labelText="Session timeout" disabled value={5400000} />

### Read-only

<DurationInput labelText="Session timeout" readonly value={5400000} />

## Sizes

Set `size` to control field height. The default is `"md"`.

<Stack gap={7}>
  <DurationInput labelText="Small" size="sm" value={5400000} />
  <DurationInput labelText="Extra large" size="xl" value={5400000} />
</Stack>

## Layering

The fields take their background from the nearest `Layer`.

<Layer>
  <Box padding={5}>
    <DurationInput labelText="Session timeout" value={5400000} />
  </Box>
</Layer>

## Keyboard

| Key | Segmented | Text |
| --- | --- | --- |
| <DocKbd label="0" />-<DocKbd label="9" /> | Fills the focused segment, then moves on. | Types. |
| <DocKbd label="↑" /> <DocKbd label="↓" /> | Steps the segment by one, or by `step` in the smallest segment, with carry. | Moves the caret. |
| <DocKbd label="PageUp" /> <DocKbd label="PageDown" /> | Steps the segment by ten. | None. |
| <DocKbd label="Home" /> <DocKbd label="End" /> | Sets the segment to its lowest or highest count. | Moves the caret. |
| <DocKbd label="←" /> <DocKbd label="→" /> | Moves between segments. | Moves the caret. |
| <DocKbd label="Backspace" /> <DocKbd label="Delete" /> | Clears the segment, or its last typed digit. Clearing every segment empties the value. | Deletes text. |
| <DocKbd label="Enter" /> | None. | Reads the text. |

Cleared segments count as zero in the value, and fill with `00` when focus leaves the field.

## Design

| Do | Why |
| --- | --- |
| Use the segmented variant for a few values that people adjust. | The arrow keys carry across units, so no one does the arithmetic. |
| Use the text variant for lengths people bring from elsewhere. | A pasted `1h 30m` or ISO 8601 value needs no unit boxes. |
| Set `smallestUnit` to the finest unit the task needs. | Seconds and milliseconds on a meeting length are noise to scan and to tab through. |
| Give `max` when a longer value is a mistake, and say why in `helperText`. | Typing then stays inside the range instead of failing afterward. |
| Keep `value` in milliseconds and format it for display with `Intl`. | One unit in your state; the field does the unit conversion. |
