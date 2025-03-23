<script lang="ts">
import { LocalStorage } from "carbon-components-svelte";

const objectValue = { theme: "dark", fontSize: 16 };
</script>

<div data-testid="object-storage">
  <LocalStorage
    key="theme-settings"
    value={objectValue}
    on:update={({ detail }) => {
      console.log("update event", detail);
    }}
  />
</div>
