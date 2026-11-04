<script>
  import { DataTable, LocalStorage } from "carbon-components-svelte";

  /** @type {Record<string, number>} */
  let columnWidths = {};
</script>

<LocalStorage key="docs-column-widths" bind:value={columnWidths} />

<DataTable
  resizable
  bind:columnWidths
  headers={[
    { key: "name", value: "Name", minWidth: "120px" },
    { key: "protocol", value: "Protocol", maxWidth: 160 },
    { key: "port", value: "Port", columnResizable: false, width: "80px" },
    { key: "rule", value: "Rule" },
  ]}
  rows={Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: i % 3 ? (i % 2 ? 3000 : 80) : 443,
    rule: i % 3 ? "Round robin" : "DNS delegation",
  }))}
  on:resize={(event) => console.log("resize", event.detail)}
/>
