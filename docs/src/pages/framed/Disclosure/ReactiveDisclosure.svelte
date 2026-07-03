<script>
  import { Disclosure, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={5}>
  <div>Open: <strong>{open}</strong></div>
  <Disclosure
    bind:open
    summary="Show shipping details"
    on:toggle={(e) => console.log("toggle", e.detail)}
  >
    <p>Orders ship within 2 business days and arrive in 3-5 business days.</p>
  </Disclosure>
</Stack>
