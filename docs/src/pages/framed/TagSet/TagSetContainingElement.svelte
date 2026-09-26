<script>
  import { Box, Tag, TagSet } from "carbon-components-svelte";

  // An empty reference element whose width TagSet should fit within,
  // instead of its own (wider) wrapper — for example, to match the width
  // of an unrelated column elsewhere on the page.
  let target;
</script>

<Box maxWidth="20rem">
  <Box bind:ref={target} maxWidth="8rem" />
  <TagSet containingElement={target}>
    <Tag type="red">Production</Tag>
    <Tag type="blue">Staging</Tag>
    <Tag type="purple">Development</Tag>
    <Tag type="green">QA</Tag>
    <Tag type="magenta">Sandbox</Tag>
  </TagSet>
</Box>
