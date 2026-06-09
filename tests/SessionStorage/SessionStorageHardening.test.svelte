<svelte:options accessors />

<script lang="ts">
  import type SessionStorageComponent from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";
  import SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";

  export let value: unknown = "initial";
  export let key = "hardening-key";
  export let onUpdate: (e: CustomEvent) => void = () => {};
  export let onSave: () => void = () => {};

  export let storageRef: SessionStorageComponent | undefined = undefined;
</script>

<SessionStorage
  bind:this={storageRef}
  {key}
  bind:value
  on:update={onUpdate}
  on:save={onSave}
/>
