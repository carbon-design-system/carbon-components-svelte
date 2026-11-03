<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";

  let saving = false;
</script>

<svelte:window on:stop-saving={() => (saving = false)} />

<Button on:click={() => (saving = true)}>Save changes</Button>

{#if saving}
  <InlineLoading transition description="Saving" data-testid="inline" />
  <Loading transition description="Saving changes" data-testid="overlay" />
{/if}
