<script>
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Card from "carbon-components-svelte/Card/Card.svelte";
  import CardAction from "carbon-components-svelte/Card/CardAction.svelte";
  import CardActions from "carbon-components-svelte/Card/CardActions.svelte";
  import CardBody from "carbon-components-svelte/Card/CardBody.svelte";
  import CardFooter from "carbon-components-svelte/Card/CardFooter.svelte";
  import CardHeader from "carbon-components-svelte/Card/CardHeader.svelte";
  import CardMedia from "carbon-components-svelte/Card/CardMedia.svelte";
  import CardTitle from "carbon-components-svelte/Card/CardTitle.svelte";
</script>

<!-- A clickable card without a CardTitle is left out: the server can't
  know a title is missing, so the client drops `aria-labelledby` on mount. -->

<Card>
  <CardHeader>
    <CardTitle>Quarterly report</CardTitle>
    <CardActions slot="actions">
      <CardAction>
        <Button kind="ghost" size="sm" iconDescription="Share" />
      </CardAction>
    </CardActions>
  </CardHeader>
  <CardBody>Usage grew 12% over the last quarter.</CardBody>
  <CardFooter>
    <Button kind="ghost" size="sm">View report</Button>
  </CardFooter>
</Card>
<Card clickable href="/reports">
  <CardMedia slot="media" ratio="2x1">
    <img src="/chart.png" alt="" />
  </CardMedia>
  <AILabel slot="decorator" />
  <CardHeader>
    <CardTitle>Usage forecast</CardTitle>
  </CardHeader>
  <CardBody>Spend is projected to grow 12% next month.</CardBody>
</Card>
<Card horizontal mediaPosition="end">
  <CardMedia slot="media" mediaWidth="40%">
    <img src="/chart.png" alt="" />
  </CardMedia>
  <CardHeader>
    <CardTitle>Coastal sensors</CardTitle>
  </CardHeader>
</Card>
