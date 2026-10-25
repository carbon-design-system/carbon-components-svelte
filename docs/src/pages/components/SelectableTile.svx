---
components: ["SelectableTileGroup", "SelectableTile"]
description: Selectable tiles provide a tile-based interface for choosing multiple options, with built-in keyboard navigation and accessibility.
---

<script>
  import { AILabel, Box, Layer, SelectableTile, SelectableTileGroup } from "carbon-components-svelte";
</script>

## Basic

Group multiple selectable tiles together for multi-selection scenarios. Each tile shows a checkbox in its top-right corner: empty until the tile is selected, then checked.

<SelectableTileGroup legendText="Deployment regions" name="options" selected={["us-east-1", "us-west-2"]}>
  <SelectableTile value="us-east-1">
    US East (N. Virginia)
  </SelectableTile>
  <SelectableTile value="us-west-2">
    US West (Oregon)
  </SelectableTile>
  <SelectableTile value="eu-central-1">
    EU Central (Frankfurt)
  </SelectableTile>
</SelectableTileGroup>

## Values

| Do | Why |
| --- | --- |
| Give every tile a unique `value` | Tiles that share a value, including tiles that leave out `value`, select together. The group logs a warning when it finds a shared value. |
| Remove a value from `selected` yourself when its tile goes away | Unmounting a tile, for example while filtering a list, keeps its value in `selected`, so the choice survives the filter. |

## Selection

Hold <DocKbd label="Shift" /> while clicking a tile, or while pressing <DocKbd label="Enter" /> or <DocKbd label="Space" /> on a focused tile, to apply its new checked state to every tile between it and the last tile toggled. Disabled tiles are skipped.

<SelectableTileGroup legendText="Deployment regions" name="options-range">
  <SelectableTile value="us-east-1">
    US East (N. Virginia)
  </SelectableTile>
  <SelectableTile value="us-west-2">
    US West (Oregon)
  </SelectableTile>
  <SelectableTile value="eu-central-1">
    EU Central (Frankfurt)
  </SelectableTile>
  <SelectableTile value="ap-south-1">
    Asia Pacific (Mumbai)
  </SelectableTile>
</SelectableTileGroup>

## Reactive

### One-way binding

Pass `selected` to `SelectableTileGroup` and update it from the `change` event, which fires once per toggle or range with every selected value. For per-tile reactions, `select` and `deselect` fire once for each tile that changes, including every tile in a range.

Inside a group, the group's `selected` is the source of truth. A tile's own `selected` prop only sets its initial state, so update the group's array rather than each tile.

<FileSource src="/framed/SelectableTile/SelectableTileReactiveOneWay" />

### Two-way binding

Bind to `selected` for simpler state management.

<FileSource src="/framed/SelectableTile/SelectableTileReactive" />

## Legend

### Custom content

Use the `legendChildren` slot on `SelectableTileGroup` to provide custom legend content instead of `legendText`.

<SelectableTileGroup name="options-legend-slot" selected={["us-east-1", "us-west-2"]}>
  <strong slot="legendChildren">Deployment regions</strong>
  <SelectableTile value="us-east-1">
    US East (N. Virginia)
  </SelectableTile>
  <SelectableTile value="us-west-2">
    US West (Oregon)
  </SelectableTile>
  <SelectableTile value="eu-central-1">
    EU Central (Frankfurt)
  </SelectableTile>
</SelectableTileGroup>

### Hidden

Hide the legend visually by setting `hideLegend` to `true`. The legend remains available to screen readers.

<SelectableTileGroup hideLegend legendText="Deployment regions" name="options-hidden-legend" selected={["us-east-1"]}>
  <SelectableTile value="us-east-1">
    US East (N. Virginia)
  </SelectableTile>
  <SelectableTile value="us-west-2">
    US West (Oregon)
  </SelectableTile>
  <SelectableTile value="eu-central-1">
    EU Central (Frankfurt)
  </SelectableTile>
</SelectableTileGroup>

## AI label

Put an `AILabel` in the `decorator` slot to mark the tile's content as AI-generated. The tile shows the AI surface, and the label sits in the top-right corner, beside the checkbox at the `"xs"` size.

<SelectableTile>
  Recommended plan: Team
  <AILabel slot="decorator">
    <p>Recommended for a workspace with 8 to 20 active members.</p>
  </AILabel>
</SelectableTile>

### Rounded corners

Set `rounded` to `true` to round the corners of a tile with a decorator. Carbon reserves rounded tiles for AI content, so a tile without a decorator stays square.

<SelectableTile rounded>
  Recommended plan: Team
  <AILabel slot="decorator">
    <p>Recommended for a workspace with 8 to 20 active members.</p>
  </AILabel>
</SelectableTile>

## Small size

Set `size="sm"` on the SelectableTileGroup for compact tiles, such as rows in a list of choices: less padding, no minimum height, and the checkbox pulled in. A tile's own `size` overrides the group's.

<SelectableTileGroup legendText="Extras" name="extras" selected={["breakfast"]} size="sm">
  <SelectableTile value="breakfast">Breakfast</SelectableTile>
  <SelectableTile value="parking">Parking</SelectableTile>
  <SelectableTile value="late-checkout">Late checkout</SelectableTile>
</SelectableTileGroup>

## On a layer

Place the component in a [`Layer`](/components/Layer) to put it on the next surface, so it contrasts with the surface below. `Layer` replaces the v10 `light` prop.

<Layer withBackground>
  <Box padding={5}>
    <SelectableTileGroup legendText="Deployment regions" name="options-layer" selected={["us-east-1", "us-west-2"]}>
      <SelectableTile value="us-east-1">
        US East (N. Virginia)
      </SelectableTile>
      <SelectableTile value="us-west-2">
        US West (Oregon)
      </SelectableTile>
      <SelectableTile value="eu-central-1">
        EU Central (Frankfurt)
      </SelectableTile>
    </SelectableTileGroup>
  </Box>
</Layer>

## Disabled

Disable specific tiles, or the entire group, to prevent selection.

### Individual tiles

Disable specific tiles to prevent interaction.

<SelectableTileGroup legendText="Deployment regions" name="options-disabled" selected={["us-east-1"]}>
  <SelectableTile value="us-east-1">
    US East (N. Virginia)
  </SelectableTile>
  <SelectableTile disabled value="us-west-2">
    US West (Oregon)
  </SelectableTile>
  <SelectableTile disabled value="eu-central-1">
    EU Central (Frankfurt)
  </SelectableTile>
</SelectableTileGroup>

### Entire group

Disable every tile at once by setting `disabled` on `SelectableTileGroup`. The underlying `fieldset` prevents selection, and each tile takes the disabled styling.

<SelectableTileGroup legendText="Deployment regions" name="options-disabled-group" selected={["us-east-1", "us-west-2"]} disabled>
  <SelectableTile value="us-east-1">
    US East (N. Virginia)
  </SelectableTile>
  <SelectableTile value="us-west-2">
    US West (Oregon)
  </SelectableTile>
  <SelectableTile value="eu-central-1">
    EU Central (Frankfurt)
  </SelectableTile>
</SelectableTileGroup>

## Checkbox label

Set `iconDescription` to change the checkbox icon's tooltip, shown on hover. Defaults to `"Tile checkmark"`. Screen readers skip the icon and announce the checked state from the tile's checkbox.

<SelectableTileGroup legendText="Deployment regions" name="options-checkbox-label" selected={["us-east-1"]}>
  <SelectableTile iconDescription="US East (N. Virginia) selected" value="us-east-1">
    US East (N. Virginia)
  </SelectableTile>
  <SelectableTile value="us-west-2">
    US West (Oregon)
  </SelectableTile>
  <SelectableTile value="eu-central-1">
    EU Central (Frankfurt)
  </SelectableTile>
</SelectableTileGroup>
