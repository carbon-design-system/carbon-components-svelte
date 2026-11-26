<script>
  import { Button, InlineNotification, Stack } from "carbon-components-svelte";
  import { fade } from "svelte/transition";

  let timeout;
  $: showNotification = timeout !== undefined;
</script>

<Stack gap={5} align="start">
  <Button
    disabled={showNotification}
    on:click={() => {
      timeout = 3_000; // 3 seconds
    }}
  >
    Show notification
  </Button>

  {#if showNotification}
    <div transition:fade>
      <InlineNotification
        {timeout}
        pauseOnHover
        kind="success"
        title="Export complete:"
        subtitle="This notification will autoclose in {timeout.toLocaleString()} ms. Hover to pause the countdown."
        on:close={(e) => {
          timeout = undefined;
          console.log(e.detail.timeout); // true if closed via timeout
        }}
      />
    </div>
  {/if}
</Stack>
