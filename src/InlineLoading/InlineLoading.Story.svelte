<script>
  export let story = undefined;
  export let status = undefined;
  export let iconDescription = undefined;
  export let description = undefined;
  export let successDelay = undefined;

  import { Button } from "../Button";
  import InlineLoading from "./InlineLoading.svelte";

  const props = { status, iconDescription, description, successDelay };

  let isSubmitting = false;
  let success = false;
  let ariaLive = "off";
  let loadingDescription = "Submitting...";

  function handleSubmit() {
    isSubmitting = true;
    ariaLive = "assertive";

    setTimeout(() => {
      isSubmitting = false;
      loadingDescription = "Submitted!";
      success = true;
      setTimeout(() => {
        success = false;
        isSubmitting = false;
        loadingDescription = "Submitting...";
        ariaLive = "off";
      }, 1500);
    }, 2000);
  }

  $: disabled = isSubmitting || success;
</script>

{#if story === 'ux-example'}
  <div style="display: flex; width: 300px">
    <Button kind="secondary" {disabled}>Cancel</Button>
    {#if disabled}
      <InlineLoading
        style="margin-left: 1rem;"
        description={loadingDescription}
        status={success ? 'finished' : 'active'}
        aria-live={ariaLive} />
    {:else}
      <Button on:click={handleSubmit}>Submit</Button>
    {/if}
  </div>
{:else}
  <InlineLoading {...props} />
{/if}
