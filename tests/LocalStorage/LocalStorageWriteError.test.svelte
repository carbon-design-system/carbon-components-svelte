<svelte:options accessors />

<script lang="ts">
  import LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";

  export let value = "test-value";
  export let key = "test-key";
  export let onError: (e: CustomEvent) => void = () => {};
</script>

<LocalStorage {key} bind:value on:error={onError} />
