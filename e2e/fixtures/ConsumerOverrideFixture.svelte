<script>
  import {
    Button,
    DataTable,
    InlineNotification,
    Link,
    Tab,
    Tabs,
    Tag,
    ToastNotification,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  const headers = [{ key: "name", value: "Name" }];
  const rows = [
    { id: "r1", name: "First" },
    { id: "r2", name: "Second" },
    { id: "r3", name: "Third" },
  ];
</script>

<!--
  One instance of each component a consumer most often restyles, each
  carrying a single consumer class. e2e/fixtures/consumer-override.css
  restyles them; e2e/consumer-override.test.ts asserts the consumer wins.
-->
<Button class="my-btn" data-testid="btn">Primary</Button>
<Button class="my-btn" data-testid="btn-disabled" disabled>Disabled</Button>
<Button
  class="my-icon-btn"
  data-testid="icon-btn"
  kind="ghost"
  icon={Add}
  iconDescription="Add"
/>
<Button class="my-text-icon-btn" data-testid="text-icon-btn" icon={Add}>
  Add
</Button>

<p>
  <Link class="my-link" data-testid="link" href="#">Link</Link>
  <Link class="my-link" data-testid="link-inline" inline href="#">
    Inline link
  </Link>
</p>

<Tag class="my-tag" data-testid="tag" type="red">Tag</Tag>

<div data-testid="table">
  <DataTable
    {headers}
    {rows}
    rowClass={() => "my-row"}
    selectable
    selectedRowIds={["r2"]}
  />
</div>

<div data-testid="tabs">
  <Tabs>
    <Tab class="my-tab" label="One" />
    <Tab class="my-tab" label="Two" />
  </Tabs>
</div>

<div data-testid="tabs-container">
  <Tabs type="container">
    <Tab class="my-container-tab" label="One" />
    <Tab class="my-container-tab" label="Two" />
  </Tabs>
</div>

<div data-testid="table-zebra">
  <DataTable {headers} {rows} zebra rowClass={() => "my-row"} />
</div>

<ToastNotification
  class="my-toast"
  data-testid="toast"
  kind="success"
  title="Saved"
  hideCloseButton
>
  <svelte:fragment slot="subtitleChildren">
    Done. <Link data-testid="toast-link" href="#"> Undo </Link>
  </svelte:fragment>
</ToastNotification>

<ToastNotification
  class="my-toast-low"
  data-testid="toast-low"
  kind="info"
  lowContrast
  title="Heads up"
  hideCloseButton
/>

<InlineNotification
  class="my-inline"
  data-testid="inline"
  kind="error"
  title="Failed"
  hideCloseButton
/>
