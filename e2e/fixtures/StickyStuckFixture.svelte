<script lang="ts">
  import {
    ActionSet,
    Button,
    PageHeader,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  let headerStuck = false;
  let toolbarStuck = false;
  let actionsStuck = false;
  let flexToolbarStuck = false;

  const rows = Array.from(
    { length: 12 },
    (_, index) => `Instance ${index + 1}`,
  );
</script>

<!-- At the top of the page, the header starts where it sticks. -->
<PageHeader
  sticky
  bind:stuck={headerStuck}
  data-testid="page-header"
  title="Databases"
  subtitle="Manage your database instances"
/>
<p data-testid="header-stuck">Header stuck: {headerStuck}</p>

<!-- A scroll container of its own, in a block parent. -->
<div data-testid="scroller" style:height="240px" style:overflow="auto">
  <Toolbar
    sticky
    stickyOffset={0}
    bind:stuck={toolbarStuck}
    data-testid="toolbar"
  >
    <ToolbarContent>
      <ToolbarSearch labelText="Filter instances" />
    </ToolbarContent>
  </Toolbar>
  {#each rows as row (row)}
    <p style:padding="12px 16px">{row}</p>
  {/each}
  <ActionSet sticky bind:stuck={actionsStuck} data-testid="action-set">
    <Button kind="secondary">Cancel</Button>
    <Button>Save</Button>
  </ActionSet>
</div>
<p data-testid="toolbar-stuck">Toolbar stuck: {toolbarStuck}</p>
<p data-testid="actions-stuck">Actions stuck: {actionsStuck}</p>

<!-- A flex parent puts the sentinel inside the toolbar. -->
<div
  data-testid="flex-scroller"
  style:height="240px"
  style:overflow="auto"
  style:display="flex"
  style:flex-direction="column"
>
  <p style:padding="12px 16px">Instances above the toolbar</p>
  <Toolbar
    sticky
    stickyOffset={0}
    bind:stuck={flexToolbarStuck}
    data-testid="flex-toolbar"
  >
    <ToolbarContent>
      <ToolbarSearch labelText="Filter archived instances" />
    </ToolbarContent>
  </Toolbar>
  {#each rows as row (row)}
    <p style:padding="12px 16px" style:flex="none">{row}</p>
  {/each}
</div>
<p data-testid="flex-toolbar-stuck">Flex toolbar stuck: {flexToolbarStuck}</p>

<!-- A narrow set in a flex parent: the sentinel inside doesn't count as a
     button, so the two buttons still stack. -->
<div style:display="flex" style:flex-direction="column" style:width="240px">
  <ActionSet sticky data-testid="flex-action-set">
    <Button kind="secondary">Cancel</Button>
    <Button>Save</Button>
  </ActionSet>
</div>

<div style:height="150vh"></div>
