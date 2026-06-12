<script lang="ts">
  import { Box, Button, Stack, Tag } from "carbon-components-svelte";
  import DocThemePicker from "../DocThemePicker.svelte";
</script>

<Box fill="layer-01" padding={7}>
  <Stack gap={6}>
    <DocThemePicker />
    <Stack orientation="horizontal" gap={3} align="center" wrap="wrap">
      <Button size="small">Primary</Button>
      <Button size="small" kind="secondary">Secondary</Button>
      <Button size="small" kind="tertiary">Tertiary</Button>
      <Tag type="blue" style="margin: 0">Blue</Tag>
      <Tag type="green" style="margin: 0">Green</Tag>
      <Tag type="purple" style="margin: 0">Purple</Tag>
    </Stack>
  </Stack>
</Box>
