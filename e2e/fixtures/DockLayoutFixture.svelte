<script>
  import { DockLayout, normalizeDockLayout } from "carbon-components-svelte";

  // Query: `preset` (`basic`: three groups; `single`: one; `grid`: 4 by 4;
  // `stack`: a column of two), `count` (documents; default 6, 50 for `grid`),
  // `width` and `height` (px), `type` (`default` for line tabs), `dir`,
  // `size`, `dismissible` (`=0` hides the close buttons), `cancel` (a handler that refuses every move, split and close),
  // `ask` (keeps a modified document until `Discard` is pressed), `restore`
  // (a layout, as JSON, to read back), `maximized` (a group id).
  const params = new URLSearchParams(location.search);
  const preset = params.get("preset") ?? "basic";
  const width = Number(params.get("width") ?? 960);
  const height = Number(params.get("height") ?? 480);
  const type = params.get("type") === "default" ? "default" : "container";
  const dir = params.get("dir");
  const size = params.get("size") ?? undefined;
  const dismissible = params.get("dismissible") !== "0";
  const cancel = params.has("cancel");
  const ask = params.has("ask");
  const count = Number(params.get("count") ?? (preset === "grid" ? 50 : 6));

  const documents = Array.from({ length: count }, (_, i) => ({
    id: `doc-${i + 1}`,
    label: `File ${i + 1}.ts`,
    modified: i === 1,
  }));
  const ids = documents.map((doc) => doc.id);
  const group = (id, tabs) => ({ type: "group", id, tabs, activeId: tabs[0] });

  function initial() {
    if (preset === "single") return group("group-1", ids);
    if (preset === "stack") {
      return {
        type: "column",
        children: [
          group("group-1", ids.slice(0, Math.ceil(ids.length / 2))),
          group("group-2", ids.slice(Math.ceil(ids.length / 2))),
        ],
        sizes: [50, 50],
      };
    }
    if (preset === "grid") {
      // 16 groups; documents dealt out in turn.
      const cells = Array.from({ length: 16 }, () => []);
      for (const [i, id] of ids.entries()) cells[i % 16].push(id);
      const column = (c) => ({
        type: "column",
        children: [0, 1, 2, 3].map((r) =>
          group(`group-${c * 4 + r + 1}`, cells[c * 4 + r]),
        ),
        sizes: [25, 25, 25, 25],
      });
      return {
        type: "row",
        children: [0, 1, 2, 3].map(column),
        sizes: [25, 25, 25, 25],
      };
    }
    // basic: File 1-3 | File 4-5 over File 6 (and the rest in the first).
    return {
      type: "row",
      children: [
        group(
          "group-1",
          [ids[0], ids[1], ids[2], ...ids.slice(6)].filter(Boolean),
        ),
        {
          type: "column",
          children: [
            group("group-2", [ids[3], ids[4]].filter(Boolean)),
            group("group-3", [ids[5]].filter(Boolean)),
          ],
          sizes: [50, 50],
        },
      ],
      sizes: [60, 40],
    };
  }

  const restored = params.get("restore");
  let layout = restored
    ? normalizeDockLayout(JSON.parse(restored), { known: ids })
    : normalizeDockLayout(initial(), { known: ids });
  let maximized = params.get("maximized");
  let activeGroupId = null;
  let events = [];
  let pending = null;
  let allDocuments = documents;

  function handleChange(event) {
    const { type, tabId, groupId, source } = event.detail;
    events = [...events, { type, tabId, groupId, source }];
    if (cancel && event.cancelable) event.preventDefault();
    if (
      ask &&
      type === "close" &&
      documents.find((doc) => doc.id === tabId)?.modified
    ) {
      event.preventDefault();
      pending = tabId;
    }
  }

  function discard() {
    const id = pending;
    pending = null;
    layout = normalizeDockLayout(layout, {
      known: ids.filter((other) => other !== id),
    });
  }
</script>

<div
  style:inline-size="min({width}px, 100%)"
  style:block-size="{height}px"
  dir={dir ?? undefined}
  data-testid="dock-fixture"
>
  <DockLayout
    bind:layout
    bind:maximized
    bind:activeGroupId
    documents={allDocuments}
    {type}
    {size}
    {dismissible}
    aria-label="Workspace"
    on:layoutchange={handleChange}
  >
    <svelte:fragment slot="panel" let:document>
      <p>{document.label} content</p>
      <button type="button">Edit {document.label}</button>
    </svelte:fragment>
  </DockLayout>
</div>

{#if pending}
  <button type="button" data-testid="discard" on:click={discard}>
    Discard {pending}
  </button>
{/if}
<pre
  data-testid="layout"
  style="white-space: pre-wrap; overflow-wrap: anywhere;">{JSON.stringify(
    layout,
  )}</pre>
<pre data-testid="active">{activeGroupId}</pre>
<pre
  data-testid="events"
  style="white-space: pre-wrap; overflow-wrap: anywhere;">{JSON.stringify(
    events,
  )}</pre>
