<script>
  import { OperationalTag, Tag, TagSet } from "carbon-components-svelte";

  let tags = ["Production", "Staging", "Development", "QA", "Sandbox"];
</script>

<OperationalTag type="blue">
  3 policies
  <button slot="content" type="button">Retention</button>
</OperationalTag>

<div style="max-width: 16rem; margin-top: 2rem">
  <TagSet
    overflowMode="popover"
    maxVisible={2}
    on:close:tag={({ detail }) =>
      (tags = tags.filter((tag) => tag !== detail.tag.value))}
  >
    {#each tags as tag (tag)}
      <Tag filter value={tag} type="blue">{tag}</Tag>
    {/each}
  </TagSet>
</div>
<div data-testid="tags">{tags.join(",")}</div>
