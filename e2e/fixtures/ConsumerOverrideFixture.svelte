<script>
  import {
    Button,
    DataTable,
    Link,
    Tab,
    Tabs,
    Tag,
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
