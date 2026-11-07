---
components: ["NumberRangeInput"]
description: A minimum and a maximum field for a filter or a setting, such as a price, a port range or a quota. It checks the pair together and can follow a slider.
keywords: ["range", "min max", "price filter", "between", "from to"]
---

<script>
  import { Box, FluidForm, NumberRangeInput, Stack } from "carbon-components-svelte";

  /** @type {[number | null, number | null]} */
  let price = [null, null];
  let priceValid = true;

  const translateFrench = (id, { limit }) =>
    id === "aboveMax" ? `Saisissez ${limit} ou moins.` : `Valeur invalide, ${limit}.`;
</script>

## Basic

The value is `[minimum, maximum]`. An empty field is an open end, `null`, for "no minimum" or "no maximum". Set `labelText` to name the pair, such as "Price"; it renders as the legend of a fieldset, and each field is named "Minimum Price" and "Maximum Price".

<NumberRangeInput labelText="Price" min={0} max={1000} value={[10, 250]} />

## Value

### Open ends

An end left empty is `null`, and reads as the placeholder, which defaults to the bound. Set `allowOpen` to `false` to require both ends; an empty end is then an error once the person leaves it.

<Stack gap={7}>
  <NumberRangeInput labelText="Price" min={0} max={1000} value={[null, 250]} />
  <NumberRangeInput labelText="Port range" min={1} max={65535} allowOpen={false} value={[8000, null]} />
</Stack>

### Bounds and step

`min` and `max` limit both ends, and `step` is the increment. A value must sit on a step counted from `min`, or from 0 without one.

<NumberRangeInput labelText="Seats" min={5} max={50} step={5} value={[10, 30]} />

### Binding

Bind to `value` for the range, and to `valid` to know whether it can be used. The value follows what is typed, valid or not, so check `valid` before applying it.

<Stack gap={7}>
  <NumberRangeInput labelText="Price" min={0} max={1000} bind:value={price} bind:valid={priceValid} />
  <div>value: {JSON.stringify(price)}, valid: {priceValid}</div>
</Stack>

## Validation

Each end is checked against the bounds and the step, then the two are checked against each other. A message waits until the person leaves the field, and goes as soon as they fix it.

| Do | Why |
| --- | --- |
| Show a minimum above the maximum as an error on the field edited last. | The person is looking there and can fix it. Nothing is rewritten, so they never lose what they typed. |
| Check `valid` before running a query on the range. | `value` holds what is typed, including a crossed pair, so the page can show it back. |
| Don't swap the ends, or clamp one to the other, on blur. | A swap hides a typo and changes two fields at once; a clamp throws away a number the person meant. |

Enter a maximum below the minimum, then leave the field.

<NumberRangeInput labelText="Price" value={[100, 50]} />

### Messages

`translateWithId` returns the text for each message. `values.limit` is the bound, step or other end, formatted for the `locale`.

<NumberRangeInput
  labelText="Prix"
  min={0}
  max={100}
  minLabelText="Minimum"
  maxLabelText="Maximum"
  locale="fr-FR"
  value={[null, 250]}
  translateWithId={translateFrench}
/>

### Range-wide state

Use `invalid` and `warn` for what the component cannot see, such as a query with no results. Both fields are marked and one message shows under them.

<Stack gap={7}>
  <NumberRangeInput labelText="Price" value={[10, 20]} invalid invalidText="No listings in this price range." />
  <NumberRangeInput labelText="Price" value={[10, 20]} warn warnText="Few listings in this price range." />
</Stack>

## Format

### Currency and unit

Set `locale` and `formatOptions` for a symbol in both fields, the slider and the messages. They use the same options as `NumberInput`.

<Stack gap={7}>
  <NumberRangeInput
    labelText="Price"
    min={0}
    max={1000}
    locale="en-US"
    formatOptions={{ style: "currency", currency: "USD" }}
    value={[10, 250]}
  />
  <NumberRangeInput
    labelText="Memory"
    min={1}
    max={64}
    locale="en-US"
    formatOptions={{ style: "unit", unit: "gigabyte" }}
    value={[2, 8]}
  />
</Stack>

### Locale

The fields read and write decimals in the locale's own format, so `1.234,5` is 1234.5 in German.

<NumberRangeInput labelText="Gewicht" locale="de-DE" step={0.5} value={[1234.5, 2000]} />

### Pasting a range

Paste `10-250`, `10 – 250`, `10 to 250` or `8000..8100` into either field to fill both. The numbers are read in the field's format, so `1.234,5 – 2.000` works in German. A single number pastes into the field as usual.

## Slider

Set `slider` to show a dual-handle slider below the fields. It needs `min` and `max`, and stays in sync with the fields. An open end rests at its bound; moving the other handle keeps it open, and dragging a handle to a bound writes that number.

<Box maxWidth="20rem">
  <NumberRangeInput
    labelText="Price"
    slider
    min={0}
    max={1000}
    step={10}
    locale="en-US"
    formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
    value={[null, 400]}
  />
</Box>

## Labels and layout

### Separator

`separator` is the text between the fields, such as `"to"` or `"—"`. It is decoration and is hidden from assistive technology.

<NumberRangeInput labelText="Port range" separator="to" min={1} max={65535} value={[8000, 8100]} />

### Hidden labels

The fields carry "Minimum" and "Maximum" labels. Set `hideInputLabels` to hide them visually, and `hideLabel` to hide the legend. Both stay available to screen readers. Set `minLabelText` and `maxLabelText` to change the words.

<Stack gap={7}>
  <NumberRangeInput labelText="Price" hideInputLabels min={0} max={1000} value={[10, 250]} />
  <NumberRangeInput labelText="Price" minLabelText="From" maxLabelText="To" min={0} max={1000} value={[10, 250]} />
</Stack>

### Steppers

The steppers are hidden, because a range is typed or slid and the numbers need the room. Set `hideSteppers` to `false` to show them.

<NumberRangeInput labelText="Port range" hideSteppers={false} min={1} max={65535} value={[8000, 8100]} />

### Sizes

Set `size` on the range to size both fields. It inherits the `size` of a parent `Form`.

<Stack gap={7}>
  <NumberRangeInput size="sm" labelText="Price" value={[10, 250]} />
  <NumberRangeInput size="xl" labelText="Price" value={[10, 250]} />
</Stack>

### Narrow containers

The fields sit side by side, and stack when their container is under 14rem wide. A 288px sidebar keeps them side by side.

<Stack gap={7}>
  <Box width="18rem">
    <NumberRangeInput labelText="Price" min={0} max={1000} value={[10, 250]} />
  </Box>
  <Box width="12rem">
    <NumberRangeInput labelText="Price" min={0} max={1000} value={[10, 250]} />
  </Box>
</Stack>

### Fluid

Inside a `FluidForm`, or with `fluid`, each field is a fluid field, divided by a hairline in place of the separator.

<FluidForm>
  <NumberRangeInput labelText="Price" min={0} max={1000} value={[10, 250]} />
</FluidForm>

## Use cases

### Filter panel

A facet for a results page: currency fields over a slider in a 288px sidebar. Only a valid range is applied.

<FileSource src="/framed/NumberRangeInput/NumberRangeInputFilter" />

### Settings

Settings rows with a required range, and a quota with open ends.

<FileSource src="/framed/NumberRangeInput/NumberRangeInputSettings" />

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Moves through the minimum field, the maximum field, then the slider handles. |
| `Enter` | Commits the field and checks the pair. |
| `ArrowUp`, `ArrowDown` | Steps the focused field by `step`. |
| `ArrowLeft`, `ArrowRight` | Moves a slider handle by one step; `Shift` moves it by a larger step. In RTL they follow the arrow's direction. |
| `Home`, `End` | Moves a slider handle to the minimum or maximum bound. |

## States

### Disabled

<NumberRangeInput labelText="Price" disabled value={[10, 250]} />

### Read-only

<NumberRangeInput labelText="Price" readonly value={[10, 250]} />

## Form

Set `name` for the minimum and `nameUpper` for the maximum; an open end submits an empty string.

<NumberRangeInput labelText="Price" name="price_min" nameUpper="price_max" value={[10, null]} />
