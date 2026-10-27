<script>
  import { Tag } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

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

<Tag data-testid="tag-icon" icon={Add}>With icon</Tag>
<Tag data-testid="tag-icon-lg" size="lg" icon={Add}>Large with icon</Tag>
