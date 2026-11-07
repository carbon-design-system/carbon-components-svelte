<script lang="ts">
  import CardTitle from "carbon-components-svelte/Card/CardTitle.svelte";
  import Section from "carbon-components-svelte/Heading/Section.svelte";
  import type { ComponentProps } from "svelte";

  export let titleTruncate: ComponentProps<CardTitle>["titleTruncate"] = false;
  export let maxWidth: ComponentProps<CardTitle>["maxWidth"] = "100%";
  export let labelTruncate: ComponentProps<CardTitle>["labelTruncate"] = false;
  export let descriptionTruncate: ComponentProps<CardTitle>["descriptionTruncate"] = false;
  export let headingLevel: ComponentProps<CardTitle>["headingLevel"] =
    undefined;
  /** Wrap the title in a `Section` at this level. */
  export let sectionLevel: ComponentProps<Section>["level"] | undefined =
    undefined;
</script>

{#if sectionLevel}
  <Section level={sectionLevel}>
    <CardTitle {headingLevel} data-testid="title">Quarterly report</CardTitle>
  </Section>
{:else}
  <CardTitle
    {titleTruncate}
    {maxWidth}
    {labelTruncate}
    {descriptionTruncate}
    {headingLevel}
    data-testid="title"
  >
    <svelte:fragment slot="labelChildren">Billing</svelte:fragment>
    Quarterly report
    <svelte:fragment slot="description">Updated 2 hours ago</svelte:fragment>
  </CardTitle>
{/if}
