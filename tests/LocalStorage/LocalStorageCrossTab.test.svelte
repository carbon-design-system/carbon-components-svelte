<svelte:options accessors />

<script lang="ts">
  import { LocalStorage } from "carbon-components-svelte";

  export let value = "initial-value";
  export let key = "cross-tab-key";
  export let onUpdate: (e: CustomEvent) => void = () => {};
  export let onSave: () => void = () => {};
</script>

<LocalStorage {key} bind:value on:update={onUpdate} on:save={onSave} />
