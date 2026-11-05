<script lang="ts">
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
</script>

<!-- Each trigger sits at the end of a full-width row, against the window. -->
<div data-testid="rows">
  <div class="row" data-testid="row">
    <span>Load balancer</span>
    <OverflowMenu iconDescription="Row actions">
      <OverflowMenuItem text="Manage credentials" />
      <OverflowMenuItem text="API documentation" />
      <OverflowMenuItem danger text="Delete service" />
    </OverflowMenu>
  </div>
  <div class="row" data-testid="portal-row">
    <span>Object storage</span>
    <OverflowMenu portalMenu iconDescription="Portal row actions">
      <OverflowMenuItem text="Manage credentials" />
      <OverflowMenuItem text="API documentation" />
      <OverflowMenuItem danger text="Delete service" />
    </OverflowMenu>
  </div>
</div>

<!-- A card that clips, centered so the window has room past its end. -->
<div class="card" data-testid="card">
  <span>Kubernetes cluster</span>
  <OverflowMenu iconDescription="Card actions">
    <OverflowMenuItem text="Restart" />
    <OverflowMenuItem text="Stop" />
  </OverflowMenu>
</div>

<!-- Room on both sides: each menu keeps the alignment it asks for. -->
<div class="center" data-testid="center">
  <OverflowMenu iconDescription="Centered actions">
    <OverflowMenuItem text="Restart" />
    <OverflowMenuItem text="Stop" />
  </OverflowMenu>
  <OverflowMenu flipped iconDescription="Centered flipped actions">
    <OverflowMenuItem text="Restart" />
    <OverflowMenuItem text="Stop" />
  </OverflowMenu>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--cds-border-subtle);
  }

  .card {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    inline-size: 16rem;
    max-inline-size: 100%;
    block-size: 10rem;
    margin-block-start: 10rem;
    margin-inline: auto;
    overflow: hidden;
    border: 1px solid var(--cds-border-subtle);
  }

  .center {
    display: flex;
    justify-content: center;
    gap: 12rem;
    margin-block-start: 1rem;
  }
</style>
