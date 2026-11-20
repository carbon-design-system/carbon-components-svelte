<script lang="ts">
  import { FileManager } from "carbon-components-svelte";
  import { createSeed } from "./file-manager-data";

  const query = new URLSearchParams(window.location.search);
  const adapter = createSeed({
    big: Number(query.get("big") ?? 0),
    wide: Number(query.get("wide") ?? 0),
    latency: Number(query.get("latency") ?? 0),
    failList: query.get("failList") ?? undefined,
    failUpload: query.get("failUpload") ?? undefined,
  });

  let path = query.get("path") ?? "/";
  let view: "list" | "grid" = query.get("view") === "grid" ? "grid" : "list";
  let selectedIds: string[] = [];
  let detailsOpen = query.get("details") === "1";
  let log: string[] = [];
  window.__fm = { adapter };

  function record(name: string, detail: unknown) {
    log = [...log, `${name}: ${JSON.stringify(detail)}`];
    window.__fmLog = log;
  }
</script>

<div data-testid="host">
  <FileManager
    {adapter}
    bind:path
    bind:view
    bind:selectedIds
    bind:detailsOpen
    height={query.get("height") ?? "32rem"}
    on:navigate={(event) => record("navigate", event.detail)}
    on:move={(event) => record("move", event.detail)}
    on:remove={(event) => record("remove", event.detail)}
    on:rename={(event) => record("rename", event.detail)}
    on:open={(event) => record("open", event.detail.entry.path)}
  />
  <p data-testid="state">{path}|{view}|{selectedIds.join(",")}</p>
</div>
