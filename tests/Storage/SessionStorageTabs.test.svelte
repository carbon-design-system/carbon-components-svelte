<svelte:options accessors />

<script lang="ts">
  import SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";

  export let value: unknown = "initial";
</script>

<SessionStorage key="tabs-key" bind:value sync="tabs" />
