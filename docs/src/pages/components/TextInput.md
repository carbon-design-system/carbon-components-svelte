---
components: ["TextInput", "TextInputSkeleton", "FluidTextInputSkeleton"]
description: Text inputs provide a single-line field for short text like usernames or search terms, with support for various sizes and states.
---

<script>
  import { AILabel, Box, FluidTextInputSkeleton, Layer, TextInput, TextInputSkeleton, TooltipIcon } from "carbon-components-svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";
</script>

## Basic

Create a basic text input with a label and placeholder text.

<TextInput labelText="Workspace name" placeholder="Enter workspace name..." />

## Helper text

Add helper text below the input to provide additional context or instructions.

<TextInput labelText="Workspace name" helperText="This name appears in your workspace URL and can be changed later in settings" placeholder="Enter workspace name..." />

## Hidden label

Hide the label visually by setting `hideLabel` to `true`. The label remains available to screen readers.

<TextInput hideLabel labelText="Workspace name" placeholder="Enter workspace name..." />

## Custom label

Use the `labelChildren` slot to provide custom label content.

<TextInput labelText="" placeholder="Enter workspace name...">
  <strong slot="labelChildren">Workspace name</strong>
</TextInput>

## Maximum character count

Specify the max character count with `maxCount`. A character counter appears to the right of the label. Use the native maxlength attribute instead if you prefer not to show a counter.

Screen readers hear the count read as words (for example, "3 of 10 characters"), and hear "Character limit reached" once typing pauses at the limit. Override either message with the `counterText` and `limitReachedText` props.

<TextInput labelText="Tag name" placeholder="Enter tag name..." maxCount={10} />

## Events

Respond to value changes.

### Value change

Use `on:input` to listen for every keystroke, and `on:change` to listen for
committed changes on blur. Both events dispatch the current value directly as
`event.detail`.

<TextInput
  labelText="Workspace name"
  placeholder="Enter workspace name..."
  on:input={(e) => console.log(e.detail)} // string | null
  on:change={(e) => console.log(e.detail)} // string | null
/>

### Numeric values

Set the native `type` attribute to `"number"` to parse `value` as a number.
The bound value—and the event detail dispatched by `on:input` and `on:change`—is
`null` when the input is empty, otherwise a `number`.

<TextInput type="number" labelText="Port number" placeholder="Enter port number..." />

## Select on focus

Set `selectTextOnFocus` to select the full value when the field receives focus.

<TextInput selectTextOnFocus labelText="Workspace name" value="acme-production" />

### Native text fields

`TextInput`, `TextArea`, `NumberInput`, `Search`, and the other text fields keep the selection after a click in Safari, where the `mouseup` that ends a click would collapse it. For a native field you build yourself, use the `preserveFocusSelection` action. It does not select anything itself: select the text in your own `focus` handler and pass `true` to turn the action on.

<FileSource src="/framed/TextInput/PreserveFocusSelectionBasic" />

The action takes a boolean, so pass an expression to turn it on and off. Pass `false` when the field is disabled or when selecting on focus is switched off, which mirrors how [TimePicker](/components/TimePicker) applies it.

<FileSource src="/framed/TextInput/PreserveFocusSelectionToggling" />

## Text layer

A native `<input>` or `<textarea>` cannot draw a fill under a word, color part of its text, or show a suggestion after the caret. `createInputLayer` adds a layer of text behind or over the field, lined up with the field's own text, to draw them. The field stays the field: its caret, selection, IME, spell check, undo and form value are the browser's, and the layer is `aria-hidden` and ignores the pointer.

Pass the field and a `segments` function that cuts the value into runs. Each run is a `<span>` of text with the classes you give it, and the runs join back to the value. The layer draws again on every `input`. Call `destroy()` to remove it.

`TextInput`, `TextArea` and `Search` give the field through `bind:ref`. Add the layer in `onMount`, which returns the cleanup.

### Behind the text

`position: "behind"` is the default. The layer holds the field's fill, the field's own is made transparent, and the field's text is drawn over what the layer paints. Use it for a fill or a rule under a run, such as a qualifier in a search.

<FileSource src="/framed/TextInput/InputLayerQualifiers" />

A fluid field changes its fill on hover and focus, which a layer behind it does not follow. Set `--ccs-input-layer-fill` where the fill is not `$field`, such as inside a `Layer`.

### Over the text

`position: "above"` draws over the field. The layer's text is transparent, so a run opts in with a color. Mark a run `ghost: true` for text that is not in the value, such as a suggestion after the caret. It is drawn after the value and is not counted by `caretRect` and `rangeRects`.

A suggestion cannot sit where the caret is when it would move the text the field already shows: Latin text in a right to left field sits against the right edge, and a word that no longer fits wraps. `ghostShifts()` reports that, so the suggestion can be left out.

<FileSource src="/framed/TextInput/InputLayerGhost" />

### Coloring the text

`ink: "layer"` makes the field's own glyphs transparent and draws them from the layer, in color. See [TextArea](/components/TextArea#text-layer) for a formula in a `TextArea`. In forced colors the glyphs go back to the field, so only what a color does not carry, such as a rule, stays on the layer.

### Native fields

`inputLayer` is the Svelte action of the same function. Add it to a native field you build yourself, with Carbon's markup around it. Pass `value` too, so the layer draws again when the app sets it.

<FileSource src="/framed/TextInput/InputLayerAction" />

### Where the text is

`caretRect(field, index)` and `rangeRects(field, start, end)` return where characters of a field's value are drawn, in viewport coordinates, as the field is scrolled now. They measure the field's layer, or a hidden copy that goes away two frames later, so they work on any field. Use them to anchor a menu or a marker to the caret.

<FileSource src="/framed/TextInput/InputLayerCaret" />

### Options

| Option | Default | Description |
| --- | --- | --- |
| `position` | `"behind"` | `"behind"` or `"above"` the field's text |
| `ink` | `"field"` | `"layer"` draws the glyphs from the layer and implies `"above"` |
| `segments` | the value as one run | `(value) => [{ text, className?, ghost? }]` |
| `className` | none | Classes for the layer's root |
| `container` | the field's parent | Where the layer is added. It must be positioned |

The layer has `render(segments)`, `update(segments?)`, `sync()`, `ghostShifts()`, `caretRect(index)`, `rangeRects(start, end)` and `destroy()`, and the elements `element` and `content`.

| Do | Why |
| --- | --- |
| Cut the value into runs that join back to it | The layer's text is the field's text. A different length drifts |
| Keep runs the width of plain text: no horizontal padding, bold or letter spacing | A glyph that changes width moves everything after it |
| Call `update()` after you set `value` from code | Setting `value` fires no event |
| Keep a layer to a few hundred runs | Chromium rounds each run's width up by about 0.01px, so a long line with thousands of runs drifts. Neighbours of one class are joined |
| Draw a rule or a fill, not a color alone | Forced colors drop colors and keep rules |
| Put the field in a positioned parent, as Carbon's field wrappers are | The layer is placed from measurements, in its parent's coordinates |
| Call `sync()` after you move the field with a script that fires no event | Nothing tells the layer a field moved without resizing |
| Do not use a layer on a password field | The layer holds the text the field hides |

## AI label

Put an `AILabel` in the `decorator` slot to mark the value as AI-generated. The field shows the AI gradient. See [AI label](/components/AILabel#fields) for the revert flow.

<TextInput labelText="Workspace name" value="analytics-prod">
  <AILabel slot="decorator">
    <p>Suggested from the project you selected.</p>
  </AILabel>
</TextInput>

## On a layer

Place the component in a [`Layer`](/components/Layer) to put it on the next surface, so it contrasts with the surface below. `Layer` replaces the v10 `light` prop.

<Layer withBackground>
  <Box padding={5}>
    <TextInput labelText="Workspace name" placeholder="Enter workspace name..." />
  </Box>
</Layer>

## Fluid

Use the fluid variant with `fluid`, which embeds the label
inside the field. Fluid text inputs can be used standalone or inside
[FluidForm](/components/FluidForm), where the fluid variant is applied
automatically. The fluid variant cannot be combined with the inline variant.

<TextInput fluid labelText="Workspace name" placeholder="Enter workspace name..." />

### Maximum character count

The character counter sits at the trailing edge of the field, opposite the
embedded label.

<TextInput fluid labelText="Region code" placeholder="Enter region code..." maxCount={10} />

### Custom label

Use the `labelChildren` slot to render custom label content, such as a
tooltip icon.

<TextInput fluid labelText="Workspace name" placeholder="Enter workspace name...">
  <svelte:fragment slot="labelChildren">
    Workspace name
    <TooltipIcon tooltipText="This name is also used to generate your workspace's URL." icon={Information} />
  </svelte:fragment>
</TextInput>

### Invalid

Fluid text inputs display the error message inside the field boundary. Long
messages wrap to multiple lines.

<TextInput fluid invalid invalidText="This workspace name is already taken. Please choose a different name that is not in use by another organization on this platform." labelText="Workspace name" placeholder="Enter workspace name..." />

### Warning

<TextInput fluid warn warnText="This name will appear in your workspace URL and cannot be changed after creation." labelText="Workspace name" placeholder="Enter workspace name..." />

### Disabled

Invalid and warning states are not displayed while the input is disabled.

<TextInput fluid disabled invalid invalidText="Workspace name is already taken." labelText="Workspace name" placeholder="Enter workspace name..." />

### Read-only

Invalid and warning states are not displayed while the input is read-only.

<TextInput fluid readonly warn warnText="This name will appear in your workspace URL and cannot be changed after creation." labelText="Workspace name" value="acme-production" />

### Skeleton

Display a loading skeleton for the fluid text input variant.

<FluidTextInputSkeleton />

## Inline

Use the inline variant to display the label and input on the same line with `inline`.

<TextInput inline labelText="Workspace name" placeholder="Enter workspace name..." />

### Custom label

Use the `labelChildren` slot to provide custom inline label content.

<TextInput inline labelText="" placeholder="Enter workspace name...">
  <strong slot="labelChildren">Workspace name</strong>
</TextInput>

## Sizes

Set `size` to control input height. The default is `md`.

Carbon v11's names also work. `"md"` sets the 40px default explicitly, even inside a sized `Form`, and `"lg"` renders as `"xl"`.

### Extra-large

Use the extra-large size for more prominent inputs by setting `size` to `"xl"`.

<TextInput size="xl" labelText="Workspace name" placeholder="Enter workspace name..." />

### Small

Use the small size for more compact inputs by setting `size` to `"sm"`.

<TextInput size="sm" labelText="Workspace name" placeholder="Enter workspace name..." />

### Extra-small

Use the extra-small size for the most compact inputs by setting `size` to `"xs"`.

<TextInput size="xs" labelText="Workspace name" placeholder="Enter workspace name..." />

## States

Reflect validation and interaction states.

### Invalid

Indicate an invalid state with an error message by setting `invalid` and providing `invalidText`.

<TextInput invalid invalidText="Workspace name is already taken. Please try another." labelText="Workspace name" placeholder="Enter workspace name..." />

### Warning

Indicate a warning state with a message by setting `warn` and providing `warnText`.

<TextInput warn warnText="This name will appear in your workspace URL and cannot be changed after creation." labelText="Workspace name" placeholder="Enter workspace name..." />

### Disabled

Set `disabled` to `true` to prevent user interaction.

<TextInput disabled labelText="Workspace name" placeholder="Enter workspace name..." />

### Read-only

Display a non-editable value with `readonly`.

<TextInput readonly labelText="Workspace name" value="acme-production" />

## Skeleton

Show a loading state with the default skeleton variant.

<TextInputSkeleton />

### Sizes

Set `size` to match the field the skeleton stands in for.

<TextInputSkeleton size="xs" />

### Without label

Show a loading state without a label by setting `hideLabel` to `true`.

<TextInputSkeleton hideLabel />
