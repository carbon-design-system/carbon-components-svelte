<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import Card from "carbon-components-svelte/Card/Card.svelte";
  import CardBody from "carbon-components-svelte/Card/CardBody.svelte";
  import CardMedia from "carbon-components-svelte/Card/CardMedia.svelte";
  import type { ComponentProps } from "svelte";

  export let horizontal: ComponentProps<Card>["horizontal"] = false;
  export let mediaPosition: ComponentProps<Card>["mediaPosition"] = "start";
  export let media = false;
</script>

<Card
  clickable
  href="/reports"
  {horizontal}
  {mediaPosition}
  aria-label="Quarterly report"
>
  <svelte:fragment slot="media">
    {#if media}
      <CardMedia ratio="16x9" mediaWidth="40%">
        <img src="/chart.png" alt="Usage chart" />
      </CardMedia>
    {/if}
  </svelte:fragment>
  <AILabel slot="decorator" />
  <CardBody>Usage grew 12% over the last quarter.</CardBody>
</Card>
