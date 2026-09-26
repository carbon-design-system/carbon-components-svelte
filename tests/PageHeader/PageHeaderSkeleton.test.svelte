<script lang="ts">
  import PageHeaderSkeleton from "carbon-components-svelte/PageHeader/PageHeaderSkeleton.svelte";
</script>

<PageHeaderSkeleton data-testid="default" />

<PageHeaderSkeleton
  data-testid="full"
  breadcrumb
  actions
  tabs={3}
  grid
  fill="layer-01"
  hideDivider
/>

<PageHeaderSkeleton data-testid="no-subtitle" subtitle={false} size="sm" />
