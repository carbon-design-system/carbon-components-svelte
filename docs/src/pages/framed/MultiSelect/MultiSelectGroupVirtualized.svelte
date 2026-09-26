<script>
  import { MultiSelect } from "carbon-components-svelte";

  const regions = [
    "us-east-1",
    "us-west-2",
    "eu-west-1",
    "eu-central-1",
    "ap-northeast-1",
    "ap-southeast-2",
  ];

  const items = regions.flatMap((region) =>
    Array.from({ length: 500 }, (_, index) => ({
      id: `${region}-${index + 1}`,
      text: `${region}-node-${String(index + 1).padStart(3, "0")}`,
      group: region,
    })),
  );
</script>

<MultiSelect labelText="Nodes (3,000)" label="Select nodes..." {items} />
