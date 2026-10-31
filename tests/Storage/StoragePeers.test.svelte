<svelte:options accessors />

<script lang="ts">
  import type LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";
  import type SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";

  export let Component: typeof LocalStorage | typeof SessionStorage;
  export let a: unknown = "a";
  export let storageA: LocalStorage | SessionStorage | undefined = undefined;
  export let b: unknown = "b";
  export let onUpdateB: (detail: {
    prevValue: unknown;
    value: unknown;
  }) => void = () => undefined;
</script>

<svelte:component
  this={Component}
  bind:this={storageA}
  key="peer-key"
  bind:value={a}
/>
<svelte:component
  this={Component}
  key="peer-key"
  bind:value={b}
  on:update={({ detail }) => onUpdateB(detail)}
/>
