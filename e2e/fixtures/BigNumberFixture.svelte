<script>
  import { BigNumber, Button, Link } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";

  const sizes = /** @type {const} */ (["default", "lg", "xl"]);
  const dirs = /** @type {const} */ (["ltr", "rtl"]);
</script>

{#each sizes as size (size)}
  <BigNumber
    {size}
    labelText="Requests"
    value={1200}
    total={5000}
    data-testid="total-{size}"
  />
  <BigNumber
    {size}
    labelText="Availability"
    value={99.9}
    percentage
    data-testid="percentage-{size}"
  />
{/each}

{#each dirs as dir (dir)}
  <div {dir}>
    {#each sizes as size (size)}
      <BigNumber
        {size}
        labelText="p95 latency"
        value={182}
        tooltipDescription="95th percentile over the last hour"
        data-testid="icon-action-{size}-{dir}"
      >
        <Button
          slot="action"
          kind="ghost"
          size="small"
          iconOnly
          icon={Launch}
          iconDescription="Open latency report"
        />
      </BigNumber>
      <BigNumber
        {size}
        labelText="Open incidents"
        value={3}
        total={12}
        trend="up"
        delta={2}
        data-testid="link-action-{size}-{dir}"
      >
        <Link slot="action" href="#incidents">View all</Link>
      </BigNumber>
    {/each}
  </div>
{/each}
