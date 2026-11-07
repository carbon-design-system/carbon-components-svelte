<script>
  import { Button, Stack, SurveyScale } from "carbon-components-svelte";

  let satisfaction;
  let sent = false;
</script>

<Stack gap={5}>
  <SurveyScale
    preset="csat"
    legendText="How satisfied are you with the support you received for ticket #48213?"
    disabled={sent}
    bind:value={satisfaction}
  />
  <Stack gap={5} orientation="horizontal">
    <Button
      kind="primary"
      size="small"
      disabled={satisfaction === undefined || sent}
      on:click={() => (sent = true)}
    >
      Submit
    </Button>
    {#if sent}
      <p>Thanks. We shared your answer with the support team.</p>
    {/if}
  </Stack>
</Stack>
