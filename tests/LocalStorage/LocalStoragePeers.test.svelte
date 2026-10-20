<svelte:options accessors />

<script lang="ts">
  import LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";

  export let a: unknown = "a";
  export let storageA: LocalStorage | undefined = undefined;
  export let b: unknown = "b";
  export let onUpdateB: (detail: {
    prevValue: unknown;
    value: unknown;
  }) => void = () => undefined;
</script>

<LocalStorage bind:this={storageA} key="peer-key" bind:value={a} />
<LocalStorage
  key="peer-key"
  bind:value={b}
  on:update={({ detail }) => onUpdateB(detail)}
/>
