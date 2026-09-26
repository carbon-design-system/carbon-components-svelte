<script lang="ts">
  import Column from "carbon-components-svelte/Grid/Column.svelte";
  import Row from "carbon-components-svelte/Grid/Row.svelte";
  import PageHeader from "carbon-components-svelte/PageHeader/PageHeader.svelte";
</script>

<PageHeader data-testid="grid" grid title="Grid">
  <Row>
    <Column data-testid="column">Column content</Column>
  </Row>
</PageHeader>

<PageHeader data-testid="full-width" grid="full-width" title="Full width" />

<PageHeader data-testid="no-grid" title="No grid" />
