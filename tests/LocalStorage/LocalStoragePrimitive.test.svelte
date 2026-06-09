<svelte:options accessors />

<script lang="ts">
  import LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";

  export let value = "test-value";
</script>

<div data-testid="primitive-storage">
  <LocalStorage
    key="test-key"
    bind:value
    on:save={() => {
      console.log("save event");
    }}
    on:update={({ detail }) => {
      console.log("update event", detail);
    }}
  />
</div>
