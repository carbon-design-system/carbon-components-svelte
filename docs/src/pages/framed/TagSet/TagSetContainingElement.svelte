<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  // An empty reference element whose width TagSet should fit within,
  // instead of its own (wider) wrapper — for example, to match the width
  // of an unrelated column elsewhere on the page.
  let target;
</script>

<div style="max-width: 20rem;">
  <div bind:this={target} style="max-width: 8rem;"></div>
  <TagSet containingElement={target}>
    <Tag type="red">Production</Tag>
    <Tag type="blue">Staging</Tag>
    <Tag type="purple">Development</Tag>
    <Tag type="green">QA</Tag>
    <Tag type="magenta">Sandbox</Tag>
  </TagSet>
</div>
