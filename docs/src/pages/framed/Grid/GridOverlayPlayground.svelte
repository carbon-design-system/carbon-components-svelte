<script>
  import {
    Checkbox,
    Column,
    Grid,
    GridOverlay,
    NumberInput,
    Row,
    Select,
    SelectItem,
    Stack,
    Tile,
  } from "carbon-components-svelte";

  let open = true;
  let columns = true;
  let gutters = true;
  let margins = true;
  let numbers = true;
  let label = true;
  let textBaselines = false;
  let condensed = false;
  let narrow = false;
  let fullWidth = false;
  let baseline = 8;
  let baselineEmphasis = 4;
  let baselineOffset = 0;
  let baselineAnchor = "page";
</script>

<Grid padding {condensed} {narrow} {fullWidth}>
  <Row>
    <Column sm={4} md={8} lg={6}>
      <Tile>
        <Stack gap={5}>
          <fieldset class="bx--fieldset">
            <legend class="bx--label">Overlay</legend>
            <Checkbox labelText="open" bind:checked={open} />
            <Checkbox labelText="columns" bind:checked={columns} />
            <Checkbox labelText="gutters" bind:checked={gutters} />
            <Checkbox labelText="margins" bind:checked={margins} />
            <Checkbox labelText="numbers" bind:checked={numbers} />
            <Checkbox labelText="label" bind:checked={label} />
            <Checkbox labelText="textBaselines" bind:checked={textBaselines} />
          </fieldset>
          <fieldset class="bx--fieldset">
            <legend class="bx--label">Grid (applied to both)</legend>
            <Checkbox labelText="condensed" bind:checked={condensed} />
            <Checkbox labelText="narrow" bind:checked={narrow} />
            <Checkbox labelText="fullWidth" bind:checked={fullWidth} />
          </fieldset>
          <Select labelText="baseline" bind:selected={baseline}>
            <SelectItem value={0} text="0 (off)" />
            <SelectItem value={2} text="2px" />
            <SelectItem value={4} text="4px" />
            <SelectItem value={8} text="8px" />
            <SelectItem value={16} text="16px" />
          </Select>
          <NumberInput
            labelText="baselineEmphasis"
            min={0}
            max={16}
            bind:value={baselineEmphasis}
          />
          <NumberInput
            labelText="baselineOffset (px)"
            min={0}
            step={4}
            bind:value={baselineOffset}
          />
          <Select labelText="baselineAnchor" bind:selected={baselineAnchor}>
            <SelectItem value="page" />
            <SelectItem value="viewport" />
          </Select>
        </Stack>
      </Tile>
    </Column>
    <Column sm={4} md={8} lg={10}>
      <Stack gap={5}>
        <Tile style="height: 12rem;">Content</Tile>
        <Tile style="height: 12rem;">Content</Tile>
        <Tile style="height: 12rem;">Content</Tile>
      </Stack>
    </Column>
  </Row>
</Grid>

<GridOverlay
  {open}
  {columns}
  {gutters}
  {margins}
  {numbers}
  {label}
  {textBaselines}
  {condensed}
  {narrow}
  {fullWidth}
  baseline={Number(baseline)}
  baselineEmphasis={baselineEmphasis ?? 0}
  baselineOffset={baselineOffset ?? 0}
  {baselineAnchor}
/>

<!-- docs-only:start -->
<style>
  /* The overlay is fixed to the viewport, so drop the frame's side padding
     to line the Grid up with it, and hide the frame's column guides. */
  :global(body.framed) {
    padding-inline: 0;
  }

  :global(body.framed :not(.bx--content) [class^="bx--col"]) {
    box-shadow: none;
  }
</style>
<!-- docs-only:end -->
