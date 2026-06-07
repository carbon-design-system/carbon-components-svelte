<svelte:options accessors />

<script lang="ts">
  import { SessionStorage } from "carbon-components-svelte";

  export let value: unknown = "initial-value";
  export let key = "cross-tab-key";
  export let onUpdate: (detail: {
    prevValue: unknown;
    value: unknown;
  }) => void = () => undefined;
</script>

<SessionStorage {key} bind:value on:update={({ detail }) => onUpdate(detail)} />
