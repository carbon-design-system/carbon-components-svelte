<script>
  import { Disclosure, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={5}>
  <div>Open: <strong>{open}</strong></div>
  <Disclosure
    bind:open
    summary="Show deployment details"
    on:toggle={(e) => console.log("toggle", e.detail)}
  >
    <p>
      Build #4213 deployed to production at 2:14 PM UTC. Rollback available for
      the next 24 hours.
    </p>
  </Disclosure>
</Stack>
