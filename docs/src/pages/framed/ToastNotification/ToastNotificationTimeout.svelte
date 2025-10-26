<script>
  import { Button, ToastNotification } from "carbon-components-svelte";
  import { fade } from "svelte/transition";

  let timeout;
  $: showNotification = timeout !== undefined;
</script>

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
    <ToastNotification
      {timeout}
      kind="success"
      title="Success"
      subtitle="This notification will autoclose in {timeout.toLocaleString()} ms."
      caption={new Date().toLocaleString()}
      on:close={(e) => {
        timeout = undefined;
        console.log(e.detail.timeout); // true if closed via timeout
      }}
    />
  </div>
{/if}
