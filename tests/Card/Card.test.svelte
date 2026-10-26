<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Card from "carbon-components-svelte/Card/Card.svelte";
  import CardAction from "carbon-components-svelte/Card/CardAction.svelte";
  import CardActions from "carbon-components-svelte/Card/CardActions.svelte";
  import CardBody from "carbon-components-svelte/Card/CardBody.svelte";
  import CardFooter from "carbon-components-svelte/Card/CardFooter.svelte";
  import CardHeader from "carbon-components-svelte/Card/CardHeader.svelte";
  import CardMedia from "carbon-components-svelte/Card/CardMedia.svelte";
  import CardTitle from "carbon-components-svelte/Card/CardTitle.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import Share from "carbon-icons-svelte/lib/Share.svelte";
  import type { ComponentProps } from "svelte";

  export let clickable: ComponentProps<Card>["clickable"] = false;
  export let href: ComponentProps<Card>["href"] = undefined;
  export let target: string | undefined = undefined;
  export let disabled: ComponentProps<Card>["disabled"] = false;
  export let density: ComponentProps<Card>["density"] = "productive";
  export let horizontal: ComponentProps<Card>["horizontal"] = false;
  export let mediaPosition: ComponentProps<Card>["mediaPosition"] = "start";
  export let customIcon = false;
  export let label: string | undefined = "Quarterly report";
  export let media = false;
  export let actions = false;
  export let footer = false;
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
</script>

<Card
  {clickable}
  {href}
  {target}
  {disabled}
  {density}
  {horizontal}
  {mediaPosition}
  {...customIcon ? { icon: Launch } : {}}
  aria-label={label}
  data-testid="card"
  on:click={(event) => onclick?.(event)}
>
  <svelte:fragment slot="media">
    {#if media}
      <CardMedia ratio="16x9" mediaWidth="40%" data-testid="media">
        <img src="/chart.png" alt="Usage chart" />
      </CardMedia>
    {/if}
  </svelte:fragment>
  {#if actions}
    <CardHeader data-testid="header">
      <CardTitle>Quarterly report</CardTitle>
      <CardActions slot="actions">
        <CardAction iconOnly>
          <Button kind="ghost" size="sm" icon={Share} iconDescription="Share" />
        </CardAction>
      </CardActions>
    </CardHeader>
  {:else}
    <CardHeader data-testid="header">
      <CardTitle>Quarterly report</CardTitle>
    </CardHeader>
  {/if}
  <CardBody>Usage grew 12% over the last quarter.</CardBody>
  {#if footer}
    <CardFooter actionSet data-testid="footer">
      <CardAction>
        <Button kind="secondary">Dismiss</Button>
      </CardAction>
    </CardFooter>
  {/if}
</Card>
