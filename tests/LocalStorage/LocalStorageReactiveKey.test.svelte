<svelte:options accessors />

<script lang="ts">
  import { LocalStorage } from "carbon-components-svelte";

  export let storageKey: string = "key-a";
  export let currentValue: any = "";
</script>

<LocalStorage key={storageKey} bind:value={currentValue} />
