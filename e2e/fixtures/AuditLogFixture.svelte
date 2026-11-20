<script lang="ts">
  import AuditLogExplorer from "../../src/AuditLogExplorer/AuditLogExplorer.svelte";
  import { AUDIT_FIELDS } from "../../src/AuditLogExplorer/audit-fields.js";
  import { createMemorySource } from "../../src/AuditLogExplorer/memory-source.js";

  // ?size, ?rate (live events per second) and ?latency (ms) tune the source.
  const params = new URLSearchParams(window.location.search);
  const source = createMemorySource({
    size: Number(params.get("size") ?? 1_000_000),
    liveRate: Number(params.get("rate") ?? 20),
    latency: Number(params.get("latency") ?? 0),
  });
</script>

<div data-testid="fixture" class="audit-log-fixture">
  <header>
    <h1 class="bx--visually-hidden">Audit events</h1>
  </header>
  <AuditLogExplorer
    {source}
    fields={AUDIT_FIELDS}
    syncUrl
    url={window.location.search}
    height="100%"
  />
</div>

<style>
  .audit-log-fixture {
    height: 100vh;
  }
</style>
