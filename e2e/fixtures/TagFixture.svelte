<script>
  import { Tag, TagSet } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  let showTag = true;

  const longLabel = "status:active AND region:us-south AND service:storage";
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

<!-- A composite, such as a card that is one tab stop, passes tabindex="-1". -->
<div data-testid="tag-focus-order">
  <button type="button">Before</button>
  <TagSet multiline>
    <Tag tabindex="-1">{longLabel} one</Tag>
    <Tag tabindex="-1">{longLabel} two</Tag>
    <Tag>{longLabel} three</Tag>
  </TagSet>
  <button type="button">After</button>
</div>
