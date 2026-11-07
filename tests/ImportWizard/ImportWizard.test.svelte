<script lang="ts">
  import ImportWizard from "carbon-components-svelte/ImportWizard/ImportWizard.svelte";
  import type { ImportField } from "carbon-components-svelte/ImportWizard/schema.js";
  import type { ImportResult } from "carbon-components-svelte/ImportWizard/session.js";

  export let onResult: ((result: ImportResult) => void) | undefined = undefined;
  export let imported: unknown[] = [];
  export let duplicates: "skip" | "error" | "keep" = "skip";
  export let fail = false;
  export let chunkSize = 2;

  const fields: ImportField[] = [
    { key: "name", label: "Full name", required: true, aliases: ["customer"] },
    { key: "email", label: "Email", type: "email", required: true },
    {
      key: "role",
      label: "Role",
      type: "enum",
      options: ["admin", "member"],
    },
  ];

  function onImport(
    records: Record<string, unknown>[],
    { chunk }: { chunk: number },
  ) {
    if (fail && chunk === 1) throw new Error("Server said no");
    imported.push(...records);
  }
</script>

<ImportWizard
  {fields}
  {onImport}
  {duplicates}
  keyField="email"
  {chunkSize}
  worker={false}
  on:complete={(event) => onResult?.(event.detail)}
/>
