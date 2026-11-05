<script>
  import {
    Box,
    Button,
    PropertyInspector,
    Stack,
  } from "carbon-components-svelte";

  const properties = [
    { id: "name", label: "Name", type: "text" },
    { id: "replicas", label: "Replicas", type: "number", min: 0, max: 20 },
    { id: "public", label: "Public", type: "boolean" },
    { id: "autoscale", label: "Autoscale", type: "toggle" },
    {
      id: "region",
      label: "Region",
      type: "select",
      options: [
        { value: "us-south", label: "Dallas" },
        { value: "eu-de", label: "Frankfurt" },
      ],
    },
    {
      id: "plan",
      label: "Plan",
      type: "dropdown",
      options: [
        { value: "lite", label: "Lite" },
        { value: "standard", label: "Standard" },
      ],
    },
    {
      id: "tier",
      label: "Tier",
      type: "radio",
      options: [
        { value: "dev", label: "Dev" },
        { value: "prod", label: "Prod" },
      ],
    },
    { id: "accent", label: "Accent", type: "color" },
  ];

  let services = [
    {
      id: "api",
      name: "billing-api",
      replicas: 3,
      public: true,
      autoscale: true,
      region: "us-south",
      plan: "standard",
      tier: "prod",
      accent: "#0f62fe",
    },
    {
      id: "worker",
      name: "billing-worker",
      replicas: 6,
      public: false,
      autoscale: true,
      region: "eu-de",
      plan: "standard",
      tier: "prod",
      accent: "#0f62fe",
    },
    {
      id: "docs",
      name: "billing-docs",
      replicas: 1,
      public: true,
      autoscale: false,
      region: "us-south",
      plan: "lite",
      tier: "dev",
      accent: "#198038",
    },
  ];

  let selectedIds = ["api", "worker", "docs"];

  $: selection = services.filter((service) => selectedIds.includes(service.id));

  function handleInput(event) {
    const byId = new Map();
    for (const change of event.detail.changes) {
      const entry = byId.get(change.targetId) ?? {};
      entry[change.property] = change.newValue;
      byId.set(change.targetId, entry);
    }
    services = services.map((service) =>
      byId.has(service.id) ? { ...service, ...byId.get(service.id) } : service,
    );
  }
</script>

<Stack gap={5}>
  <Stack gap={3} orientation="horizontal">
    <Button
      size="small"
      kind="tertiary"
      on:click={() => (selectedIds = ["api"])}
    >
      One service
    </Button>
    <Button
      size="small"
      kind="tertiary"
      on:click={() => (selectedIds = ["api", "worker"])}
    >
      Two services
    </Button>
    <Button
      size="small"
      kind="tertiary"
      on:click={() => (selectedIds = ["api", "worker", "docs"])}
    >
      All three
    </Button>
  </Stack>
  <Box width="20rem" border="subtle">
    <PropertyInspector
      labelText="Service properties"
      selectionText={(count) =>
        count === 1 ? "1 service selected" : `${count} services selected`}
      {properties}
      {selection}
      on:input={handleInput}
    />
  </Box>
</Stack>
