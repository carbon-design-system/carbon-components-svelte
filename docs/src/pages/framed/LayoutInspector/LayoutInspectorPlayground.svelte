<script>
  import {
    Button,
    Checkbox,
    Column,
    Grid,
    NumberInput,
    Row,
    Stack,
    Tag,
    Text,
    TextInput,
    Tile,
  } from "carbon-components-svelte";
  import { LayoutInspector } from "carbon-components-svelte/devtools";

  let open = true;
  let spacing = true;
  let measure = true;
  let typography = true;
  let colors = true;
  let checkSpacing = true;
  let checkContrast = false;
  let checkTargets = true;
  let checkOverflow = false;
  let checkCarbon = false;
  let targetSize = 24;
</script>

<Grid padding>
  <Row>
    <Column sm={4} md={3} lg={4}>
      <Tile>
        <Stack gap={5}>
          <fieldset class="bx--fieldset">
            <legend class="bx--label">Inspector</legend>
            <Checkbox labelText="open" bind:checked={open} />
            <Checkbox labelText="spacing" bind:checked={spacing} />
            <Checkbox labelText="measure" bind:checked={measure} />
            <Checkbox labelText="typography" bind:checked={typography} />
            <Checkbox labelText="colors" bind:checked={colors} />
          </fieldset>
          <fieldset class="bx--fieldset">
            <legend class="bx--label">Checks</legend>
            <Checkbox labelText="checkSpacing" bind:checked={checkSpacing} />
            <Checkbox labelText="checkContrast" bind:checked={checkContrast} />
            <Checkbox labelText="checkTargets" bind:checked={checkTargets} />
            <Checkbox labelText="checkOverflow" bind:checked={checkOverflow} />
            <Checkbox labelText="checkCarbon" bind:checked={checkCarbon} />
          </fieldset>
          <NumberInput
            labelText="targetSize"
            min={8}
            max={64}
            bind:value={targetSize}
          />
        </Stack>
      </Tile>
    </Column>
    <Column sm={4} md={5} lg={8}>
      <div class="card">
        <Text type="heading-03">Invite a teammate</Text>
        <p class="lead">They get an email with a link to join.</p>
        <TextInput labelText="Email" placeholder="name@example.com" />
        <div class="row">
          <Tag type="blue">Viewer</Tag>
          <a class="small-link" href="/">Change role</a>
        </div>
        <Button size="small">Send invite</Button>
      </div>
    </Column>
  </Row>
</Grid>

<LayoutInspector
  {open}
  {spacing}
  {measure}
  {typography}
  {colors}
  {checkSpacing}
  {checkContrast}
  {checkTargets}
  {checkOverflow}
  {checkCarbon}
  targetSize={targetSize ?? 24}
/>

<style>
  .card {
    display: grid;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--cds-layer);
  }

  /* Off the type and spacing scales on purpose. */
  .lead {
    margin-top: -10px;
    font-size: 15px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .small-link {
    display: inline-block;
    font-size: 12px;
  }
</style>
