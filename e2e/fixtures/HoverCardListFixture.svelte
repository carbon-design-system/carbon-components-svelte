<script>
  import { HoverCard, Link } from "carbon-components-svelte";

  const rows = Array.from({ length: 100 }, (_, index) => index + 1);
</script>

<ul style="padding: 1rem" data-testid="list">
  {#each rows as row (row)}
    <li style="height: 24px">
      <HoverCard openDelay={150} closeDelay={100}>
        <Link slot="trigger" href="#user-{row}" data-testid="trigger-{row}"
          >user-{row}</Link
        >
        <p data-testid="card-{row}">Card for user-{row}</p>
      </HoverCard>
    </li>
  {/each}
</ul>
