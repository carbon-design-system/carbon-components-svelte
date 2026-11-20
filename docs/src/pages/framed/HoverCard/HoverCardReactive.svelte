<script>
  import { Button, HoverCard, Link, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={5} align="start">
  <p>
    Owned by
    <HoverCard bind:open aria-label="Team Platform">
      <Link slot="trigger" href="#platform">Platform</Link>
      The team that runs the build pipeline and the production clusters.
    </HoverCard>
  </p>
  <Button kind="tertiary" size="sm" on:click={() => (open = !open)}>
    {open ? "Close card" : "Open card"}
  </Button>
</Stack>
