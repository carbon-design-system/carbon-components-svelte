<script lang="ts">
  import {
    Box,
    ExpandableTile,
    RadioTile,
    Stack,
    Text,
    TileGroup,
  } from "carbon-components-svelte";

  let computeSize = "medium";
</script>

<Box fill="layer-01" padding={7}>
  <Stack gap={6}>
    <Text tag="h3" type="productive-heading-03" color="primary">
      Choose a compute size
    </Text>
    <TileGroup
      legendText="Compute size"
      name="compute"
      bind:selected={computeSize}
    >
      <RadioTile value="small">
        <Stack gap={1}>
          <Text type="body-short-01" color="primary">Small</Text>
          <Text type="caption-01" color="secondary">
            2 vCPU · 4 GB RAM · $0.04/hr
          </Text>
        </Stack>
      </RadioTile>
      <RadioTile value="medium">
        <Stack gap={1}>
          <Text type="body-short-01" color="primary">Medium</Text>
          <Text type="caption-01" color="secondary">
            4 vCPU · 8 GB RAM · $0.08/hr
          </Text>
        </Stack>
      </RadioTile>
      <RadioTile value="large">
        <Stack gap={1}>
          <Text type="body-short-01" color="primary">Large</Text>
          <Text type="caption-01" color="secondary">
            8 vCPU · 16 GB RAM · $0.16/hr
          </Text>
        </Stack>
      </RadioTile>
    </TileGroup>
    <ExpandableTile
      tileCollapsedLabel="Show details"
      tileExpandedLabel="Hide details"
    >
      <div slot="above">
        <Text type="body-short-01" color="primary">What's included</Text>
      </div>
      <div slot="below">
        <Box paddingY={3}>
          <Text type="body-long-01" color="secondary" maxWidth="52ch">
            Every size includes automated daily backups, metrics and log
            retention, horizontal auto-scaling, and 24/7 support.
          </Text>
        </Box>
      </div>
    </ExpandableTile>
  </Stack>
</Box>
