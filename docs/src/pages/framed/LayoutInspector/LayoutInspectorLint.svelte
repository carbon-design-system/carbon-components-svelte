<script>
  import {
    Button,
    Column,
    Grid,
    LayoutInspector,
    Row,
    Toggle,
  } from "carbon-components-svelte";

  let includeCarbon = false;
</script>

<Grid padding>
  <Row>
    <Column>
      <Toggle
        labelText="Check Carbon components too"
        size="sm"
        bind:toggled={includeCarbon}
      />
    </Column>
  </Row>
  <Row>
    <Column>
      <section class="panel">
        <h3 class="title">Billing</h3>
        <div class="actions">
          <Button size="small">Pay now</Button>
          <Button size="small" kind="secondary">Download invoice</Button>
        </div>
      </section>
    </Column>
  </Row>
</Grid>

<LayoutInspector open spacing={false} lint lintCarbon={includeCarbon} />

<style>
  /* Each rule here has one value off the spacing scale. */
  .panel {
    margin-top: 1.5rem;
    padding: 15px 1rem;
    background: var(--cds-layer, #f4f4f4);
  }

  .title {
    margin-bottom: 10px;
  }

  .actions {
    display: flex;
    gap: 6px;
  }
</style>
