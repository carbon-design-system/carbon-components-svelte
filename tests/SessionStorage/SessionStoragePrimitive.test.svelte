<svelte:options accessors />

<script lang="ts">
  import { SessionStorage } from "carbon-components-svelte";

  export let value = "test-value";
</script>

<div data-testid="primitive-storage">
  <SessionStorage
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
