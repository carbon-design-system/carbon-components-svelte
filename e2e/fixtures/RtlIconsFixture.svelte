<script lang="ts">
  import {
    AILabel,
    Button,
    Card,
    CardBody,
    Carousel,
    CarouselItem,
    ClickableTile,
    LayoutDirection,
    Pagination,
    PaginationNav,
    Stepper,
    Tab,
    Tabs,
  } from "carbon-components-svelte";
  import ArrowRight from "carbon-icons-svelte/lib/ArrowRight.svelte";
  import ChevronLeft from "carbon-icons-svelte/lib/ChevronLeft.svelte";
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
</script>

<div class="column">
  <div data-testid="clickable-tile">
    <ClickableTile href="#" icon={ArrowRight}>Billing settings</ClickableTile>
  </div>
  <div data-testid="card">
    <Card clickable href="#" aria-label="Billing settings">
      <CardBody>Billing settings</CardBody>
    </Card>
  </div>
  <div data-testid="pagination">
    <Pagination totalItems={40} page={2} />
  </div>
  <div data-testid="pagination-nav">
    <PaginationNav total={5} page={2} />
  </div>
  <div data-testid="carousel">
    <Carousel labelText="What's new">
      <CarouselItem>Scheduled deployments</CarouselItem>
      <CarouselItem>Faster log search</CarouselItem>
    </Carousel>
  </div>
  <div data-testid="carousel-counter">
    <Carousel labelText="What's new" showCounter>
      <CarouselItem>Scheduled deployments</CarouselItem>
      <CarouselItem>Faster log search</CarouselItem>
      <CarouselItem>Audit trail</CarouselItem>
    </Carousel>
  </div>
  <div data-testid="tabs" class="narrow">
    <Tabs>
      <Tab label="Overview" />
      <Tab label="Deployments" />
      <Tab label="Environment" />
      <Tab label="Logs" />
      <Tab label="Settings" />
    </Tabs>
  </div>
  <div data-testid="stepper">
    <Stepper steps={["Plan", "Region", "Review"]} currentIndex={1}>
      Pick a region.
    </Stepper>
  </div>
  <div data-testid="ai-label">
    <AILabel edited />
  </div>
  <div data-testid="own-icon">
    <ArrowRight class="bx--icon--mirror-rtl" />
    <Launch />
  </div>
  <div data-testid="own-button-icon">
    <Button
      kind="ghost"
      icon={ChevronLeft}
      iconProps={{ class: "bx--icon--mirror-rtl" }}
      iconDescription="Previous"
    />
    <Button kind="ghost">
      Next
      <ChevronRight slot="icon" class="bx--icon--mirror-rtl" />
    </Button>
  </div>
  <LayoutDirection dir="ltr" data-testid="ltr-island">
    <ArrowRight class="bx--icon--mirror-rtl" />
    <Button
      kind="ghost"
      icon={ChevronLeft}
      iconProps={{ class: "bx--icon--mirror-rtl" }}
      iconDescription="Previous"
    />
    <PaginationNav total={3} />
  </LayoutDirection>
</div>

<style>
  .column {
    max-width: 40rem;
    padding: 1rem;
  }

  .column > :global(*) {
    margin-bottom: 1.5rem;
  }

  .narrow {
    max-width: 12rem;
  }
</style>
