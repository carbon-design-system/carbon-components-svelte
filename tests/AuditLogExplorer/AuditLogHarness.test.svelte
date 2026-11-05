<script lang="ts">
  import AuditLogExplorer from "../../src/AuditLogExplorer/AuditLogExplorer.svelte";
  import { AUDIT_FIELDS } from "../../src/AuditLogExplorer/audit-fields.js";
  import type {
    AuditPage,
    AuditSource,
  } from "../../src/AuditLogExplorer/audit-source";

  export let source: AuditSource;
  export let url = "";
  export let initialPage: AuditPage | undefined = undefined;
  export let height = 600;
</script>

<AuditLogExplorer
  {source}
  fields={AUDIT_FIELDS}
  {url}
  {initialPage}
  {height}
  pageSize={20}
/>
