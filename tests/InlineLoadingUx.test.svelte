<script lang="ts">
  import { Button, ButtonSet, InlineLoading } from "../types";
  import { onDestroy } from "svelte";

  type State = "dormant" | "active" | "finished" | "inactive";

  const descriptionMap = {
    active: "Submitting...",
    finished: "Success",
    inactive: "Cancelling...",
  };

  const stateMap = {
    active: "finished",
    inactive: "dormant",
    finished: "dormant",
  };

  let timeout = undefined;
  let state: State = "dormant";

  function reset(incomingState?: State) {
    if (typeof timeout === "number") {
      clearTimeout(timeout);
    }

    if (incomingState) {
      timeout = setTimeout(() => {
        state = incomingState;
      }, 2000);
    }
  }

  onDestroy(reset);

  $: reset(stateMap[state]);
</script>

<ButtonSet>
  <Button
    kind="ghost"
    disabled="{state === 'dormant' || state === 'finished'}"
    on:click="{() => (state = 'inactive')}"
  >
    Cancel
  </Button>
  {#if state !== "dormant"}
    <InlineLoading status="{state}" description="{descriptionMap[state]}" />
  {:else}
    <Button on:click="{() => (state = 'active')}">Submit</Button>
  {/if}
</ButtonSet>
