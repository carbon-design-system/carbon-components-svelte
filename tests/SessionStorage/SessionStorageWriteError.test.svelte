<svelte:options accessors />

<script lang="ts">
  import SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";

  export let value = "test-value";
  export let key = "test-key";
  export let onError: (e: CustomEvent) => void = () => {};
</script>

<SessionStorage {key} bind:value on:error={onError} />
