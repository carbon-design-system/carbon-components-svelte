<script>
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Card from "carbon-components-svelte/Card/Card.svelte";
  import CardAction from "carbon-components-svelte/Card/CardAction.svelte";
  import CardActions from "carbon-components-svelte/Card/CardActions.svelte";
  import CardBody from "carbon-components-svelte/Card/CardBody.svelte";
  import CardFooter from "carbon-components-svelte/Card/CardFooter.svelte";
  import CardHeader from "carbon-components-svelte/Card/CardHeader.svelte";
  import CardTitle from "carbon-components-svelte/Card/CardTitle.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import Star from "carbon-icons-svelte/lib/Star.svelte";
</script>

<main>
  <h1>Billing</h1>
  <h2>Reports</h2>
  <Card data-testid="static">
    <CardHeader>
      <CardTitle>
        <svelte:fragment slot="labelChildren">Billing</svelte:fragment>
        Quarterly report
        <svelte:fragment slot="description">Updated 2 hours ago</svelte:fragment
        >
      </CardTitle>
      <CardActions slot="actions">
        <CardAction>
          <Button
            kind="ghost"
            size="sm"
            icon={Star}
            iconDescription="Add to favorites"
          />
        </CardAction>
      </CardActions>
    </CardHeader>
    <CardBody>Usage grew 12% over the last quarter.</CardBody>
    <CardFooter data-testid="footer">
      <CardAction>
        <Button kind="secondary">Share</Button>
      </CardAction>
      <CardAction>
        <Button>Open</Button>
      </CardAction>
      <CardAction>
        <OverflowMenu size="xl" flipped iconDescription="More options">
          <OverflowMenuItem text="Rename" />
          <OverflowMenuItem danger text="Delete" />
        </OverflowMenu>
      </CardAction>
    </CardFooter>
  </Card>
  <Card>
    <CardBody>The deprecated props still lay out the footer.</CardBody>
    <CardFooter actionSet data-testid="footer-props">
      <CardAction>
        <Button kind="secondary">Share</Button>
      </CardAction>
      <CardAction>
        <Button>Open</Button>
      </CardAction>
      <CardAction iconOnly>
        <OverflowMenu size="xl" flipped iconDescription="Legacy options">
          <OverflowMenuItem text="Rename" />
        </OverflowMenu>
      </CardAction>
    </CardFooter>
  </Card>
  <Card clickable href="#reports" data-testid="link">
    <AILabel slot="decorator">
      <p>Generated from 90 days of billing data.</p>
    </AILabel>
    <CardHeader>
      <CardTitle>Usage forecast</CardTitle>
    </CardHeader>
    <CardBody>Spend is projected to grow 12% next month.</CardBody>
  </Card>
  <Card clickable data-testid="button">
    <CardHeader>
      <CardTitle>Project settings</CardTitle>
    </CardHeader>
    <CardBody>Manage members and permissions.</CardBody>
  </Card>
  <Card clickable disabled data-testid="disabled">
    <CardHeader>
      <CardTitle>Archived report</CardTitle>
    </CardHeader>
  </Card>
</main>
