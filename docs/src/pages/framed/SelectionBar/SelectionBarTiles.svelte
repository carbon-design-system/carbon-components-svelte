<script>
  import {
    Box,
    Button,
    SelectableTile,
    SelectableTileGroup,
    SelectionBar,
    Text,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Deploy from "carbon-icons-svelte/lib/Deploy.svelte";

  const templates = [
    {
      id: "pipeline",
      name: "Deployment pipeline",
      description: "Build, test and roll out a container on every merge.",
    },
    {
      id: "database",
      name: "Managed database",
      description: "PostgreSQL with daily backups and two read replicas.",
    },
    {
      id: "queue",
      name: "Event queue",
      description: "A message queue with a dead-letter topic and retries.",
    },
    {
      id: "static-site",
      name: "Static site",
      description: "Object storage behind a CDN with a custom domain.",
    },
    {
      id: "api",
      name: "Serverless API",
      description: "Functions behind an API gateway with rate limits.",
    },
    {
      id: "monitoring",
      name: "Monitoring",
      description: "Dashboards and alerts for latency, errors and saturation.",
    },
  ];

  let selected = [];
</script>

<!-- Room at the end of the page, so the bar never covers the last row. -->
<Box paddingBottom={10}>
  <SelectableTileGroup legendText="Starter templates" bind:selected>
    <Box display="grid" columns="repeat(auto-fill, minmax(16rem, 1fr))" gap={5}>
      {#each templates as template (template.id)}
        <SelectableTile value={template.id} fullHeight>
          <Text type="heading-compact-01">{template.name}</Text>
          <Text type="body-compact-01" color="secondary">
            {template.description}
          </Text>
        </SelectableTile>
      {/each}
    </Box>
  </SelectableTileGroup>
</Box>

<SelectionBar
  count={selected.length}
  placement="viewport-end"
  transition
  selectedText={(count) =>
    `${count} ${count === 1 ? "template" : "templates"} selected`}
  on:clear={() => (selected = [])}
>
  <svelte:fragment slot="actions">
    <Button icon={Add}>Add to project</Button>
    <Button icon={Deploy}>Deploy</Button>
  </svelte:fragment>
</SelectionBar>
