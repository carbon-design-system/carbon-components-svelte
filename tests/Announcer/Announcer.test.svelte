<script lang="ts">
  import Announcer from "carbon-components-svelte/Announcer/Announcer.svelte";
  import { announce } from "../../src/utils/announcer.js";

  export let show = true;
  export let ssrCall = false;

  // A call at init: on the server it has nowhere to write.
  if (ssrCall) announce("at init");
</script>

{#if show}
  <Announcer data-testid="announcer" />
{/if}
<button type="button" on:click={() => announce("Saved")}>Save</button>
