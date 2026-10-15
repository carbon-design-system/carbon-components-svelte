<svelte:options accessors />

<script lang="ts">
  import AsyncButton from "carbon-components-svelte/AsyncButton/AsyncButton.svelte";
  import type { ComponentProps } from "svelte";

  export let onClick: ComponentProps<AsyncButton>["onClick"] = () => {};
  export let status: ComponentProps<AsyncButton>["status"] = "idle";
  export let disabled = false;
  export let finishes = 0;
</script>

<AsyncButton
  bind:status
  {onClick}
  {disabled}
  activeText="Reserving"
  finishedText="Room reserved"
  on:finish={() => (finishes += 1)}
>
  Reserve
</AsyncButton>
