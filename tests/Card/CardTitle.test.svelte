<script lang="ts">
  import CardTitle from "carbon-components-svelte/Card/CardTitle.svelte";
  import type { ComponentProps } from "svelte";

  export let titleTruncate: ComponentProps<CardTitle>["titleTruncate"] = false;
  export let maxWidth: ComponentProps<CardTitle>["maxWidth"] = "100%";
  export let labelTruncate: ComponentProps<CardTitle>["labelTruncate"] = false;
  export let descriptionTruncate: ComponentProps<CardTitle>["descriptionTruncate"] = false;
</script>

<CardTitle
  {titleTruncate}
  {maxWidth}
  {labelTruncate}
  {descriptionTruncate}
  data-testid="title"
>
  <svelte:fragment slot="label">Billing</svelte:fragment>
  Quarterly report
  <svelte:fragment slot="description">Updated 2 hours ago</svelte:fragment>
</CardTitle>
