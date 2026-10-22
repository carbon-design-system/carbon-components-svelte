<script lang="ts">
  import Column from "carbon-components-svelte/Grid/Column.svelte";
</script>

<Column as sm={4} aria-label="Custom column" let:props>
  <article data-testid="content" {...props}>Column Content</article>
</Column>
