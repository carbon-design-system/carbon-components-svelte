<svelte:options accessors />

<script lang="ts">
  import SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";

  export let value: unknown = "initial-value";
  export let key = "sync-key";
  export let sync: "on" | "off" = "off";
  export let onUpdate: (detail: {
    prevValue: unknown;
    value: unknown;
  }) => void = () => undefined;
</script>

<SessionStorage
  {key}
  {sync}
  bind:value
  on:update={({ detail }) => onUpdate(detail)}
/>
