<svelte:options accessors />

<script lang="ts">
  import { SessionStorage } from "carbon-components-svelte";

  export let value = "initial-value";
  export let key = "cross-tab-key";
  export let onUpdate: (e: CustomEvent) => void = () => {};
  export let onSave: () => void = () => {};
</script>

<SessionStorage {key} bind:value on:update={onUpdate} on:save={onSave} />
