<script>
  import {
    Box,
    Button,
    PropertyInspector,
    Stack,
  } from "carbon-components-svelte";

  const properties = [
    { id: "name", label: "Name", type: "text" },
    {
      id: "domain",
      label: "Domain",
      type: "text",
      appliesTo: (item) => item.kind === "web",
    },
    {
      id: "queue",
      label: "Queue",
      type: "text",
      appliesTo: (item) => item.kind === "worker",
    },
    { id: "crn", label: "Resource ID", type: "text", readOnly: true },
  ];

  let items = [
    {
      id: "web",
      kind: "web",
      name: "billing-web",
      domain: "billing.example.com",
      crn: "crn:v1:billing-web",
    },
    {
      id: "docs",
      kind: "web",
      name: "billing-docs",
      domain: "docs.example.com",
      crn: "crn:v1:billing-docs",
    },
    {
      id: "jobs",
      kind: "worker",
      name: "billing-jobs",
      queue: "invoices",
      crn: "crn:v1:billing-jobs",
    },
  ];

  let selectedIds = ["web", "docs"];
  let scope = "all";

  $: selection = items.filter((item) => selectedIds.includes(item.id));

  function handleInput(event) {
    const byId = new Map();
    for (const change of event.detail.changes) {
      const entry = byId.get(change.targetId) ?? {};
      entry[change.property] = change.newValue;
      byId.set(change.targetId, entry);
    }
    items = items.map((item) =>
      byId.has(item.id) ? { ...item, ...byId.get(item.id) } : item,
    );
  }
</script>

<Stack gap={5}>
  <Stack gap={3} orientation="horizontal">
    <Button
      size="small"
      kind="tertiary"
      on:click={() => (selectedIds = ["web", "docs"])}
    >
      Two web services
    </Button>
    <Button
      size="small"
      kind="tertiary"
      on:click={() => (selectedIds = ["web", "docs", "jobs"])}
    >
      Web services and a worker
    </Button>
    <Button
      size="small"
      kind="ghost"
      on:click={() => (scope = scope === "all" ? "any" : "all")}
    >
      Scope: {scope}
    </Button>
  </Stack>
  <Box width="20rem" border="subtle">
    <PropertyInspector
      {properties}
      {selection}
      {scope}
      on:input={handleInput}
    />
  </Box>
</Stack>
