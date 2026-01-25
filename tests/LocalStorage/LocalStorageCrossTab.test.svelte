<svelte:options accessors />

<script lang="ts">
  import { LocalStorage } from "carbon-components-svelte";

  export let value = "initial-value";
  export let key = "cross-tab-key";
</script>

<LocalStorage {key} bind:value on:update />
