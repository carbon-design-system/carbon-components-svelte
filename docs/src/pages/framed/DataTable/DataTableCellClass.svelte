<script>
  import { DataTable } from "carbon-components-svelte";
</script>

<DataTable
  headers={[
    { key: "service", value: "Service" },
    { key: "region", value: "Region" },
    { key: "status", value: "Status" },
    { key: "latency", value: "Latency (ms)", columnAlign: "end" },
  ]}
  rows={[
    {
      id: "a",
      service: "api-gateway",
      region: "us-south",
      status: "Healthy",
      latency: 42,
    },
    {
      id: "b",
      service: "billing",
      region: "eu-de",
      status: "Failed",
      latency: 1280,
    },
    {
      id: "c",
      service: "notifications",
      region: "jp-tok",
      status: "Healthy",
      latency: 67,
    },
    {
      id: "d",
      service: "search",
      region: "us-east",
      status: "Failed",
      latency: 940,
    },
  ]}
  cellClass={({ cell }) => {
    if (cell.key !== "status") return undefined;
    return cell.value === "Failed"
      ? "bx--type-text-error bx--type-semibold"
      : "bx--type-text-success";
  }}
/>
