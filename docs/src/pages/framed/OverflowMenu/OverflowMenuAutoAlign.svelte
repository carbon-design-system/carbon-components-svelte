<script>
  import {
    OverflowMenu,
    OverflowMenuItem,
    Stack,
  } from "carbon-components-svelte";

  const services = ["Load balancer", "Kubernetes cluster", "Object storage"];
</script>

<Stack gap={3}>
  {#each services as service (service)}
    <div class="row">
      <span>{service}</span>
      <OverflowMenu autoAlign>
        <OverflowMenuItem text="Manage credentials" />
        <OverflowMenuItem text="API documentation" />
        <OverflowMenuItem danger text="Delete service" />
      </OverflowMenu>
    </div>
  {/each}
</Stack>

<style>
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--cds-border-subtle);
  }
</style>
