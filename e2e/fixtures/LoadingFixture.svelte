<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";

  let active = false;
</script>

<svelte:window on:stop-loading={() => (active = false)} />

<Button on:click={() => (active = true)}>Save changes</Button>
<Button kind="secondary">Cancel</Button>

<Loading {active} description="Saving changes" />
