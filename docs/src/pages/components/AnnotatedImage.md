---
components: ["AnnotatedImage"]
description: Annotated images place numbered pins on an image or diagram, such as a product tour, a labeled diagram or a floor plan, and open a popover for each pin.
---

<script>
  import { AnnotatedImage, ImageLoader, Link, Stack } from "carbon-components-svelte";

  // A floor plan, 1200 x 800, drawn as a data URI so the examples need no file.
  /** @type {[number, number, number, number, string][]} */
  const rooms = [
    [40, 40, 520, 360, "Living room"],
    [560, 40, 600, 360, "Kitchen"],
    [40, 400, 360, 360, "Bedroom"],
    [400, 400, 360, 360, "Study"],
    [760, 400, 400, 360, "Bathroom"],
  ];
  const plan = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" font-family="sans-serif" font-size="28">
      <rect width="1200" height="800" fill="#f4f4f4"/>
      ${rooms
        .map(
          ([x, y, w, h, name]) =>
            `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#525252" stroke-width="6"/><text x="${x + 24}" y="${y + 48}" fill="#525252">${name}</text>`,
        )
        .join("")}
    </svg>`,
  )}`;

  const pins = [
    { id: "living", x: 25, y: 28, label: "Living room", description: "A south-facing room with a bay window." },
    { id: "kitchen", x: 70, y: 30, label: "Kitchen", description: "Fitted in 2024, with an induction hob." },
    { id: "bedroom", x: 18, y: 72, label: "Bedroom", description: "Fits a double bed and a wardrobe." },
    { id: "study", x: 47, y: 72, label: "Study", description: "Wired for ethernet." },
    { id: "bathroom", x: 85, y: 72, label: "Bathroom", description: "A walk-in shower and a heated floor." },
  ];

  let openId = null;
  let editablePins = [
    { id: "p1", x: 25, y: 28, label: "Living room" },
    { id: "p2", x: 70, y: 30, label: "Kitchen" },
  ];
  let changes = [];
</script>

## Basic

Pass the image's natural size with `width` and `height`, and each pin's place as `x` and `y`: percentages of the image, from its top left corner. The pins stay on the same spot of the image at any size, because they are placed in the image's box, which keeps the image's shape.

Click a pin to open its popover. <DocKbd label="Escape" /> closes it and returns focus to the pin.

<AnnotatedImage src={plan} alt="A floor plan of a flat with five rooms" width={1200} height={800} {pins} />

The box has the image's shape from the server render on, so the pins are in place before any script runs and before the image loads. The image never grows past its natural width.

## Legend

Set `legend` to list the pins beside the image (`"end"`, below it in a narrow container) or under it (`"bottom"`). Each item opens the same popover as its pin, so the content has two ways in: the image, and the list. The list is the way in for people who can't aim at a pin, and for pins that overlap.

<AnnotatedImage src={plan} alt="A floor plan of a flat with five rooms" width={1200} height={800} {pins} legend="end" />

## Popover content

The popover shows each pin's `label` and `description`. Put any markup in the default slot instead, which gets the `pin` and its `index`. Bind `openId` to read or set the open pin.

<AnnotatedImage src={plan} alt="A floor plan of a flat with five rooms" width={1200} height={800} {pins} bind:openId let:pin>
  <Stack gap={3}>
    <strong>{pin.label}</strong>
    <span>{pin.description}</span>
    <Link href="#{pin.id}">See photos</Link>
  </Stack>
</AnnotatedImage>

Open pin: `{openId}`

## Pins

### Size

Pins are 32px by default. Set `size="sm"` for 24px, the smallest target that WCAG 2.2 allows. Pins closer together than their size overlap, so a crowded image needs the legend, or fewer pins.

<AnnotatedImage src={plan} alt="A floor plan of a flat with five rooms" width={1200} height={800} {pins} size="sm" />

### Marker

A pin shows its number. Set `marker` on a pin to show other text, such as a letter. The `marker` slot replaces the number with any markup, such as an icon. Screen readers read the number or marker and the pin's `label` either way, so a pin is always named.

<AnnotatedImage src={plan} alt="A floor plan of a flat with five rooms" width={1200} height={800} pins={pins.map((pin, i) => ({ ...pin, marker: "ABCDE"[i] }))} />

### Placement

A popover opens below its pin. Set `align` to change that, for example `"top"` or `"right"`. Near a window edge, a popover moves to the side or edge where it fits.

A pin near the edge of the image hangs half its size outside it, so leave room around the image, or keep such pins a few percent in.

## Cropping

Set `ratio` to show the image in a box of another shape. `fit` picks `"cover"` (fill the box and crop) or `"contain"` (fit all of it), and `focalPoint` says which part stays in view, as percentages of the image. The pins stay on the same spot of the image, and a pin outside the crop is hidden with the rest of it, so put the pins you need inside the crop, or list them in the legend.

<AnnotatedImage src={plan} alt="A floor plan of a flat, cropped to its upper left" width={1200} height={800} {pins} ratio="1x1" focalPoint={{ x: 0, y: 0 }} legend="bottom" />

## Keyboard

By default, every pin is a tab stop, in the order of `pins`. A popover's content follows its pin, so Tab moves into the content, then to the next pin. Tabbing out of a pin closes its popover.

Set `keyboard="roving"` for one tab stop: the arrow keys (and <DocKbd label="Home" /> and <DocKbd label="End" />) move between the pins in the order of `pins`. In a right-to-left page, the Left and Right arrows swap.

<AnnotatedImage src={plan} alt="A floor plan of a flat with five rooms" width={1200} height={800} {pins} keyboard="roving" />

| Do | Why |
| --- | --- |
| Use the default for a few pins, and when a popover holds links or buttons. | Tab reaches every pin and the content after it, with no keys to learn. |
| Use `keyboard="roving"` for a long run of pins. | One tab stop keeps the page's Tab order short. |

## Editable

Set `editable` to let people place pins. Click the image to add a pin, and drag a pin to move it. For the keyboard, an "Add pin" button adds one at the center, the arrow keys move a focused pin one percent (<DocKbd label="Shift" /> ten), and <DocKbd label="Delete" /> removes it. The `change` event reports each add, move and remove, and a bound `pins` holds the result.

<AnnotatedImage src={plan} alt="A floor plan of a flat" width={1200} height={800} editable bind:pins={editablePins} on:change={(event) => (changes = [...changes, event.detail.action])} legend="bottom" />

Pins: `{JSON.stringify(editablePins.map(({ x, y }) => [x, y]))}`. Changes: `{changes.join(", ")}`

## Loading

`AnnotatedImage` draws a plain `<img>`, so the image and the pins are in the server's HTML. To show a loading state or an error, put an `ImageLoader` in the `image` slot. The box already has the image's shape, so the pins don't move while it loads.

<AnnotatedImage src={plan} alt="A floor plan of a flat with five rooms" width={1200} height={800} {pins}>
  <ImageLoader slot="image" src={plan} alt="A floor plan of a flat with five rooms" />
</AnnotatedImage>

## Usage

| Do | Why |
| --- | --- |
| Give the image an `alt` that describes the whole image, and every pin a `label`. | A pin's number and label are its name; the `alt` is not repeated for each pin. |
| Provide a `legend`, or the same content as text elsewhere on the page. | A pin shows only where someone aims, and information must not exist only in an image. |
| Give `width` and `height` the image's natural size. | They set the box's shape. The wrong ones put every pin in the wrong place. |
| Keep pins at least 32px apart at the smallest size the image shows. | Pins that overlap are hard to hit, and the one on top hides the other. |
| Keep each popover short. | It is a toggletip, not a dialog: it doesn't trap focus. For a long task, link to a page or open a modal. |
| Don't hide an essential control behind a pin. | A pin is a disclosure. People may never open it. |
