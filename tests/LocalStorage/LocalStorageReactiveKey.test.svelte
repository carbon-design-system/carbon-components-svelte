<svelte:options accessors />

<script lang="ts">
  import { LocalStorage } from "carbon-components-svelte";

  export let storageKey: string = "key-a";
  export let defaultValue: any = "";
  export let isObject: boolean = false;

  export let currentValue: any = defaultValue;
</script>

<LocalStorage key={storageKey} bind:value={currentValue} />
