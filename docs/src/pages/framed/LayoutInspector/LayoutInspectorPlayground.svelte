<script>
  import {
    Button,
    Checkbox,
    Column,
    Grid,
    LayoutInspector,
    NumberInput,
    Row,
    Stack,
    Tag,
    Text,
    TextInput,
    Tile,
  } from "carbon-components-svelte";

  let open = true;
  let spacing = true;
  let measure = true;
  let type = true;
  let colors = true;
  let contrast = false;
  let overflow = false;
  let lint = true;
  let includeCarbon = false;
  let targets = true;
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
            <Checkbox labelText="type" bind:checked={type} />
            <Checkbox labelText="colors" bind:checked={colors} />
            <Checkbox labelText="lint" bind:checked={lint} />
            <Checkbox
              labelText="lint Carbon too"
              bind:checked={includeCarbon}
            />
            <Checkbox labelText="targets" bind:checked={targets} />
            <Checkbox labelText="contrast" bind:checked={contrast} />
            <Checkbox labelText="overflow" bind:checked={overflow} />
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
        <Text type="productive-heading-03">Invite a teammate</Text>
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
  {type}
  {colors}
  {contrast}
  {overflow}
  {lint}
  lintCarbon={includeCarbon}
  {targets}
  targetSize={targetSize ?? 24}
/>

<style>
  .card {
    display: grid;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--cds-layer, #f4f4f4);
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
