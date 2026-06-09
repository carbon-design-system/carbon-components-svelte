<svelte:options accessors />

<script lang="ts">
  import LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";

  export let value: unknown = "initial-value";
  export let key = "cross-tab-key";
  export let onUpdate: (detail: {
    prevValue: unknown;
    value: unknown;
  }) => void = () => undefined;
</script>

<LocalStorage {key} bind:value on:update={({ detail }) => onUpdate(detail)} />
