<script lang="ts">
import { LocalStorage } from "carbon-components-svelte";

const primitiveValue = "test-value";
</script>

<div data-testid="primitive-storage">
  <LocalStorage
    key="test-key"
    value={primitiveValue}
    on:save={() => {
      console.log("save event");
    }}
    on:update={({ detail }) => {
      console.log("update event", detail);
    }}
  />
</div>
