<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  // Query: `count`, `width` (px), `type` (`container`), `dir`, `size`,
  // `dismissible` and `reorderable` (on; `=0` turns one off),
  // `menu` (the "more tabs" menu; `menu=0` turns it off),
  // `modified` (1-based numbers of the modified tabs, default `2,4`; `0` for
  // none), `ask` (keeps a modified tab until `Discard` is pressed),
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
  const ask = params.has("ask");
  const dirty = new Set(
    (params.get("modified") ?? "2,4").split(",").map((n) => `doc-${n}`),
  );

  let docs = Array.from({ length: count }, (_, i) => ({
    id: `doc-${i + 1}`,
    label: `File ${i + 1}.ts`,
    modified: dirty.has(`doc-${i + 1}`),
  }));
  let selectedId = "doc-1";
  let events = [];
  let pending = null;

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

  function remove(id) {
    docs = docs.filter((doc) => doc.id !== id);
  }

  function handleDismiss(event) {
    const { id } = event.detail;
    events = [...events, { type: "dismiss", id }];
    if (ask && docs.find((doc) => doc.id === id)?.modified) {
      event.preventDefault();
      pending = id;
      return;
    }
    remove(id);
  }

  function discard() {
    remove(pending);
    pending = null;
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
      <Tab id={doc.id} label={doc.label} modified={doc.modified} />
    {/each}
    <svelte:fragment slot="content">
      {#each docs as doc (doc.id)}
        <TabContent>{doc.label} content</TabContent>
      {/each}
    </svelte:fragment>
  </Tabs>
</div>

{#if pending}
  <button type="button" data-testid="discard" on:click={discard}>
    Discard {pending}
  </button>
{/if}
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
