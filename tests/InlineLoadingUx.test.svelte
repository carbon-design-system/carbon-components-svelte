<script lang="ts">
  import { Button, ButtonSet, InlineLoading } from "carbon-components-svelte";
  import { onDestroy } from "svelte";

  type State = "dormant" | "active" | "finished" | "inactive";

  const descriptionMap = {
    active: "Submitting...",
    finished: "Success",
    inactive: "Cancelling...",
    dormant: "Submit",
  } as const satisfies Record<State, string>;

  const stateMap = {
    active: "finished",
    inactive: "dormant",
    finished: "dormant",
    dormant: "inactive",
  } as const satisfies Record<State, State>;

  let timeout: NodeJS.Timeout | undefined = undefined;
  let state: State= "dormant";

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
