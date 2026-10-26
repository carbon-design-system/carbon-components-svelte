<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Card from "carbon-components-svelte/Card/Card.svelte";
  import CardAction from "carbon-components-svelte/Card/CardAction.svelte";
  import CardActions from "carbon-components-svelte/Card/CardActions.svelte";
  import CardBody from "carbon-components-svelte/Card/CardBody.svelte";
  import CardHeader from "carbon-components-svelte/Card/CardHeader.svelte";
  import CardMedia from "carbon-components-svelte/Card/CardMedia.svelte";
  import CardTitle from "carbon-components-svelte/Card/CardTitle.svelte";
  import type { ComponentProps } from "svelte";

  export let horizontal = false;
  export let mediaPosition: ComponentProps<Card>["mediaPosition"] = "start";
</script>

<Card
  clickable
  href="/reports"
  {horizontal}
  {mediaPosition}
  aria-label="Quarterly report"
>
  <CardMedia slot="media" mediaWidth="40%">
    <img src="/chart.png" alt="Usage chart" />
  </CardMedia>
  <AILabel slot="decorator" />
  <CardBody>Usage grew 12% over the last quarter.</CardBody>
</Card>

<Card data-testid="actions">
  <CardHeader>
    <CardTitle>Quarterly report</CardTitle>
    <CardActions slot="actions">
      <CardAction>
        <Button kind="ghost" size="sm" iconDescription="Share" />
      </CardAction>
    </CardActions>
  </CardHeader>
</Card>
