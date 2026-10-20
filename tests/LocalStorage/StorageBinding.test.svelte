<svelte:options accessors />

<script lang="ts">
  import type LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";
  import type SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";

  export let Component: typeof LocalStorage | typeof SessionStorage;
  export let key = "storage-binding-key";
  export let value: unknown = "initial";
  export let ref: LocalStorage | SessionStorage | undefined = undefined;
  export let onUpdate: (detail: {
    prevValue: unknown;
    value: unknown;
  }) => void = () => undefined;
</script>

<svelte:component
  this={Component}
  bind:this={ref}
  {key}
  bind:value
  on:update={({ detail }) => onUpdate(detail)}
/>
