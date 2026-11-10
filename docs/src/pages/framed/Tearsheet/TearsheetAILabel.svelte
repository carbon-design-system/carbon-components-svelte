<script>
  import {
    AILabel,
    Button,
    Content,
    Tearsheet,
  } from "carbon-components-svelte";

  let open = true;
</script>

<Content>
  <Button on:click={() => (open = true)}>Review summary</Button>
</Content>

<Tearsheet
  bind:open
  titleText="Incident summary"
  descriptionText="Generated from the last hour of logs."
>
  <AILabel slot="decorator">
    <p>Summarized by a language model. Check it against the logs.</p>
  </AILabel>
  <p>
    p95 latency on checkout-api rose to 2.4s after the 14:05 deploy. The new
    build opens a database connection per request.
  </p>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (open = false)}>Dismiss</Button>
    <Button on:click={() => (open = false)}>Roll back</Button>
  </svelte:fragment>
</Tearsheet>
