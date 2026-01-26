<script>
  import { DataTable } from "carbon-components-svelte";

  const rows = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    name: "Load Balancer " + (i + 1),
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
    description:
      "This is a longer description for row " +
      (i + 1) +
      " that spans multiple lines.",
  }));
</script>

<DataTable
  sortable
  virtualize={{ itemHeight: 64 }}
  title="Custom row height (64px)"
  description="Specify a custom row height when using custom cell content with different heights."
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
    { key: "description", value: "Description" },
  ]}
  {rows}
/>
