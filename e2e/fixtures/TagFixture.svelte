<script>
  import { Tag } from "carbon-components-svelte";

  let showTag = true;
</script>

{#if showTag}
  <Tag
    data-testid="tag-filter"
    filter={true}
    title="Clear filter"
    on:close={() => (showTag = false)}
  >
    Carbon
  </Tag>
{/if}

<Tag data-testid="tag-static">Static tag</Tag>
