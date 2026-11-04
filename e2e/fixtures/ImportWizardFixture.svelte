<script>
  import { ImportWizard } from "carbon-components-svelte";

  const fields = [
    { key: "name", label: "Full name", required: true, aliases: ["customer"] },
    {
      key: "email",
      label: "Email",
      type: "email",
      required: true,
      aliases: ["mail"],
    },
    {
      key: "role",
      label: "Role",
      type: "enum",
      options: [
        { value: "admin", label: "Administrator", aliases: ["owner"] },
        { value: "member", label: "Member" },
      ],
    },
    {
      key: "active",
      label: "Active",
      type: "boolean",
    },
    {
      key: "joined",
      label: "Joined",
      type: "date",
      dateFormats: ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"],
    },
    { key: "seats", label: "Seats", type: "integer", min: 1, max: 500 },
  ];

  window.__imported = [];
  window.__result = null;

  async function onImport(records, { signal }) {
    await new Promise((resolve) => setTimeout(resolve, window.__delay ?? 0));
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    window.__imported.push(...records);
  }
</script>

<div data-testid="import-wizard">
  <ImportWizard
    {fields}
    {onImport}
    keyField="email"
    worker={window.__worker ?? "auto"}
    chunkSize={window.__chunk ?? 500}
    on:complete={(event) => (window.__result = event.detail)}
  />
</div>
