<svelte:options accessors />

<script lang="ts">
  import { SessionStorage } from "carbon-components-svelte";

  export let value = "initial-value";
  export let key = "cross-tab-key";
</script>

<SessionStorage {key} bind:value on:update />
