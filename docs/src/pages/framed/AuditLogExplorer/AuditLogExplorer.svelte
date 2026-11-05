<script>
  // The pieces are drafts that the library does not export yet.
  import AuditLogExplorer from "../../../../../src/AuditLogExplorer/AuditLogExplorer.svelte";
  import { AUDIT_FIELDS } from "../../../../../src/AuditLogExplorer/audit-fields.js";
  import { createMemorySource } from "../../../../../src/AuditLogExplorer/memory-source.js";

  // One million events, made on demand and queried through cursors. A real
  // screen passes a source that calls its own API.
  const source = createMemorySource({ size: 1_000_000, latency: 120 });
</script>

<header>
  <h1 class="bx--visually-hidden">Audit events</h1>
</header>
<AuditLogExplorer {source} fields={AUDIT_FIELDS} height="100vh" />
