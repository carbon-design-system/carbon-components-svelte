---
components: ["SignaturePad"]
description: Signature pads capture a signature for approvals and delivery confirmations, by drawing it, typing a name, or uploading a picture, and return it as SVG or PNG.
keywords: ["e-sign", "signature", "approval", "sign"]
---

<script>
  import { Box, SignaturePad, Stack } from "carbon-components-svelte";
</script>

## Basic

The pad has two ways to sign. Draw with a mouse, a pen or a finger, or switch to the Type tab and type a name, which is shown in a script font. Typing is the way for a keyboard or a screen reader, so keep it.

<SignaturePad labelText="Signature" />

## Modes

Set `modes` to choose the ways to sign, in tab order. The default is `["draw", "type"]`.

### Draw, type and upload

Add `"upload"` to let people choose a picture of their signature. The picture is fitted to the pad and re-encoded as a PNG, so metadata and scripts in the file are dropped.

<SignaturePad labelText="Signature" modes={["draw", "type", "upload"]} />

### Type only

A single mode hides the tabs. A typed name works for everyone, so it is the safe choice when drawing is not needed.

<SignaturePad labelText="Signature" modes={["type"]} />

## Drawing

Strokes are smooth curves. A pen is thicker the harder it presses, and a mouse or a finger is thinner the faster it moves. Use Undo to remove the last stroke and Clear to start over.

### Shape

Set `aspectRatio` to the width over the height of the signing area. It fills the width it is given, so a squarer area suits a phone.

<SignaturePad labelText="Signature" aspectRatio={2} />

### Line width

`minWidth` and `maxWidth` are the thinnest and thickest line, as a share of a 600-unit-wide pad.

<SignaturePad labelText="Signature" minWidth={1.5} maxWidth={5} />

## Typing

The typed name is drawn with the script fonts the operating system ships, so nothing is downloaded and no request leaves the page. Set `fontFamily` for another stack. A web font must be loaded before it is used, because the name is measured to fit.

<SignaturePad labelText="Signature" mode="type" fontFamily="'Brush Script MT', cursive" />

## Value

`value` is `null` until the pad has a signature, then an object for the active mode. Set it to `null` to clear the pad.

| Mode | `type` | Holds |
| --- | --- | --- |
| Draw | `"drawn"` | `svg` |
| Type | `"typed"` | `text` and `svg` |
| Upload | `"uploaded"` | `png` |

<FileSource src="/framed/SignaturePad/SignaturePadValue" />

### Export formats

The SVG is the signature itself: one filled path per stroke on a 600-unit-wide viewBox, with no background. Add `"png"` to `formats` for a PNG data URL as well, drawn at `pngScale` pixels per unit (2 by default, 1200 by 400). The pad draws in the theme's text color, so a signature on a dark theme is light on screen, and the export keeps a dark `inkColor`. Set `exportBackground` for an opaque background.

`toSVG()` and `toPNG({ scale })` export on demand. The PNG's size comes from the pad's units, not the screen, so it is the same on a high-density display.

<FileSource src="/framed/SignaturePad/SignaturePadExport" />

An SVG of a typed name uses a `<text>` element, which a viewer draws in its own fonts. Use the PNG, or the `text`, when the signature must look the same everywhere.

## Form

Set `name` to submit the value in a hidden input as JSON, and `required` to block a form until there is a signature. The pad shows `requiredInvalidText` instead of the browser's error bubble, and a form `reset` clears it.

### Sign to approve

<FileSource src="/framed/SignaturePad/SignaturePadApproval" />

### Delivery confirmation

On a phone, a finger drawing in the pad does not scroll the page, and a finger anywhere else still does.

<FileSource src="/framed/SignaturePad/SignaturePadDelivery" />

## States

Reflect validation and interaction states.

### Helper text

<SignaturePad labelText="Signature" helperText="Sign to approve this invoice" />

### Invalid

<SignaturePad labelText="Signature" invalid invalidText="Signature is required" />

### Warning

<SignaturePad labelText="Signature" warn warnText="A typed name is easier to read than a drawn one" />

### Disabled

Set `disabled` to `true` to prevent interaction.

<SignaturePad labelText="Signature" disabled />

### Read-only

Set `readonly` to show a signature without letting it change.

<SignaturePad labelText="Signature" readonly />

## Hidden label

Hide the label visually by setting `hideLabel` to `true`. The label remains available to screen readers.

<SignaturePad labelText="Signature" hideLabel />

## Translations

`translateWithId` returns the text for each id, such as `"padEmpty"` for the pad's name and `"drawInstructions"` for the text under it.

<SignaturePad
  labelText="Firma"
  translateWithId={(id) =>
    ({
      draw: "Dibujar",
      type: "Escribir",
      padEmpty: "Panel de firma, dibuje su firma",
      padCaptured: "Firma capturada",
      signHere: "Firme aquí",
      drawInstructions: "Dibuje con el ratón, un lápiz o el dedo. Con teclado o lector de pantalla, use la pestaña Escribir.",
      undo: "Deshacer",
      clear: "Borrar",
      typeLabel: "Escriba su nombre",
    })[id] ?? id}
/>

## Usage

| Do | Why |
| --- | --- |
| Keep the Type tab. | Drawing needs a pointer, so a keyboard or screen reader user can sign only by typing (WCAG 2.5.1 and 2.1.1). |
| Say what signing means next to the pad, such as "By signing, I approve this invoice." | In many e-sign laws a typed name is as binding as a drawn one, so the words around the pad are what make it a signature. |
| Store the SVG, or the PNG, with the time and who signed. | The signature alone does not show when or by whom it was made. |
| Use `required` and a submit button, not a button that checks `value`. | The form blocks submission and names the problem, and a user can reach it from the keyboard. |
| Leave `inkColor` dark. | The file is placed on white paper, so light ink from a dark theme would vanish. |
| Give a phone a squarer area with `aspectRatio`. | A thumb needs more height than a mouse. |

## Accessibility

The signing area is an image named "Signature pad, draw your signature" while it is empty and "Signature captured" after a stroke. Its description points a keyboard user to the Type tab, and a live region announces a captured, undone or cleared signature. The tabs and the typed name are ordinary controls.

| Key | Action |
| --- | --- |
| <DocKbd label="Tab" /> | Moves to the tabs, then to the active tab's content |
| <DocKbd label="←" /> / <DocKbd label="→" /> | Switches between the tabs |
| <DocKbd label="Ctrl" />+<DocKbd label="Z" /> | Undoes the last stroke, from a button in the pad |
