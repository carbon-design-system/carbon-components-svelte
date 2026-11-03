<script>
  import { Box, PickerGrid } from "carbon-components-svelte";

  const services = [
    { id: "kafka", label: "Event Streams", keywords: ["kafka", "messaging"] },
    { id: "postgres", label: "Databases for PostgreSQL", keywords: ["sql"] },
    { id: "redis", label: "Databases for Redis", keywords: ["cache"] },
    { id: "cos", label: "Cloud Object Storage", keywords: ["s3", "bucket"] },
    { id: "kms", label: "Key Protect", keywords: ["secrets", "encryption"] },
    { id: "log", label: "Log Analysis", keywords: ["logging", "audit"] },
    { id: "mon", label: "Monitoring", keywords: ["metrics", "alerts"] },
    { id: "func", label: "Code Engine", keywords: ["serverless", "functions"] },
  ];
</script>

<Box maxWidth="26rem">
  <PickerGrid
    items={services}
    labelText="Services"
    searchLabelText="Search services"
    searchPlaceholder="Try “cache” or “s3”"
    noResultsText="No service matches"
    columns={2}
    cellSize={48}
    height={192}
  />
</Box>
