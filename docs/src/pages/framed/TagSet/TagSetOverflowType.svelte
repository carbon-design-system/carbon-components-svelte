<script>
  import { Box, Stack, Tag, TagSet } from "carbon-components-svelte";

  const environments = [
    { id: "prod", label: "Production", type: "red" },
    { id: "staging", label: "Staging", type: "blue" },
    { id: "dev", label: "Development", type: "purple" },
    { id: "qa", label: "QA", type: "green" },
    { id: "sandbox", label: "Sandbox", type: "magenta" },
  ];
</script>

<Box minHeight="14rem">
  <Stack gap={5}>
    <Box maxWidth="16rem">
      <TagSet overflowMode="popover" overflowType="default">
        {#each environments as tag (tag.id)}
          <Tag type={tag.type}>{tag.label}</Tag>
        {/each}
      </TagSet>
    </Box>
    <Box maxWidth="16rem">
      <TagSet overflowType="tag">
        {#each environments as tag (tag.id)}
          <Tag type={tag.type}>{tag.label}</Tag>
        {/each}
      </TagSet>
    </Box>
  </Stack>
</Box>
