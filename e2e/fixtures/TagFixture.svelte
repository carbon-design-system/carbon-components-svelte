<script>
  import { Tag } from "carbon-components-svelte";

  let showTag = true;
</script>

<div class="fixture-container">
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
</div>

<style>
  .fixture-container {
    padding: 2rem;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
</style>
