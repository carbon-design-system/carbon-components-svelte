<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  // Query: `count`, `width` (px), `type` (`container`), `dir`, `size`,
  // `dismissible` and `reorderable` (on; `=0` turns one off),
  // `menu` (the "more tabs" menu; `menu=0` turns it off),
  // `unbound` (a `reorder` handler that moves nothing), `cancel` (a handler
  // that cancels).
  const params = new URLSearchParams(location.search);
  const count = Number(params.get("count") ?? 8);
  const width = Number(params.get("width") ?? 480);
  const type = params.get("type") === "container" ? "container" : "default";
  const dir = params.get("dir");
  const size = params.get("size") ?? undefined;
  const dismissible = params.get("dismissible") !== "0";
  const reorderable = params.get("reorderable") !== "0";
  const menu = params.get("menu") !== "0";
  const unbound = params.has("unbound");
  const cancel = params.has("cancel");

  let docs = Array.from({ length: count }, (_, i) => ({
    id: `doc-${i + 1}`,
    label: `File ${i + 1}.ts`,
  }));
  let selectedId = "doc-1";
  let events = [];

  function handleReorder(event) {
    const { id, label, oldIndex, newIndex, source } = event.detail;
    events = [
      ...events,
      { type: "reorder", id, label, oldIndex, newIndex, source },
    ];
    if (cancel) return event.preventDefault();
    if (unbound) return;
    const next = [...docs];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    docs = next;
  }

  function handleDismiss(event) {
    events = [...events, { type: "dismiss", id: event.detail.id }];
    docs = docs.filter((doc) => doc.id !== event.detail.id);
  }
</script>

<div style:inline-size="min({width}px, 100%)" {dir} data-testid="document-tabs">
  <Tabs
    bind:selectedId
    {type}
    {size}
    {dismissible}
    {reorderable}
    overflowMenu={menu}
    on:reorder={handleReorder}
    on:dismiss={handleDismiss}
  >
    {#each docs as doc (doc.id)}
      <Tab id={doc.id} label={doc.label} />
    {/each}
    <svelte:fragment slot="content">
      {#each docs as doc (doc.id)}
        <TabContent>{doc.label} content</TabContent>
      {/each}
    </svelte:fragment>
  </Tabs>
</div>

<pre
  data-testid="order"
  style="white-space: pre-wrap; overflow-wrap: anywhere;">{docs
    .map((doc) => doc.id)
    .join(",")}</pre>
<pre
  data-testid="events"
  style="white-space: pre-wrap; overflow-wrap: anywhere;">{JSON.stringify(
    events,
  )}</pre>
