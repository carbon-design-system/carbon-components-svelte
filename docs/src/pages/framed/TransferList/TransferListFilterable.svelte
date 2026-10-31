<script>
  import { TransferList } from "carbon-components-svelte";

  const items = [
    { id: "us-east", text: "US East (Virginia)", zone: "Americas" },
    { id: "us-west", text: "US West (Oregon)", zone: "Americas" },
    { id: "sa-east", text: "South America (Sao Paulo)", zone: "Americas" },
    { id: "eu-west", text: "Europe (Ireland)", zone: "Europe" },
    { id: "eu-central", text: "Europe (Frankfurt)", zone: "Europe" },
    { id: "ap-south", text: "Asia Pacific (Mumbai)", zone: "Asia Pacific" },
    { id: "ap-northeast", text: "Asia Pacific (Tokyo)", zone: "Asia Pacific" },
    { id: "ap-southeast", text: "Asia Pacific (Sydney)", zone: "Asia Pacific" },
  ];

  let selectedIds = ["eu-west"];
</script>

<TransferList
  {items}
  bind:selectedIds
  filterable
  legendText="Replicate to regions"
  helperText="Search matches the region name or its zone."
  shouldFilterItem={(item, value) =>
    `${item.text} ${item.zone}`.toLowerCase().includes(value.toLowerCase())}
/>
