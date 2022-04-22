<script>
  import { Button, truncate, breakpoints } from "carbon-components-svelte";
  import { Airplane } from "carbon-pictograms-svelte";
  import { AutoComplete } from "carbon-components-svelte";
  import { Grid, Row, Column } from "carbon-components-svelte";

  let selectedId = 0;
  let selectedItem = undefined;
</script>

<Grid padding>
  <Row>
    <Column sm="{6}" md="{4}" lg="{4}">
      <AutoComplete
        titleText="Contact"
        bind:selectedId
        bind:selectedItem
        placeholder="Placeholder"
        items="{[
          { id: '0', text: 'Slack' },
          { id: '11', text: 'Email1' },
          { id: '12', text: 'Email2' },
          { id: '2', text: 'Fax' },
        ]}"
      />
    </Column>
    <Column sm="{6}" md="{4}" lg="{4}">
      Selected: {selectedItem?.text} ({selectedId})
    </Column>
  </Row>
  <Row>
    <Column>
      <Airplane />
    </Column>
    <Column>
      <div use:truncate>Text...</div>
    </Column>
    <Column>
      {JSON.stringify(breakpoints)}
    </Column>
    <Column>
      <Button>Primary button</Button>
    </Column>
  </Row>
</Grid>

<style>
  div {
    margin-top: var(--cds-spacing-07);
    padding: var(--cds-spacing-07);
  }
</style>
