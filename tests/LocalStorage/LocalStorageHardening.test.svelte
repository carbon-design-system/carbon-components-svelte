<svelte:options accessors />

<script lang="ts">
  import type LocalStorageComponent from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";
  import LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";

  export let value: unknown = "initial";
  export let key = "hardening-key";
  export let onUpdate: (e: CustomEvent) => void = () => {};
  export let onSave: () => void = () => {};

  export let storageRef: LocalStorageComponent | undefined = undefined;
</script>

<LocalStorage
  bind:this={storageRef}
  {key}
  bind:value
  on:update={onUpdate}
  on:save={onSave}
/>
