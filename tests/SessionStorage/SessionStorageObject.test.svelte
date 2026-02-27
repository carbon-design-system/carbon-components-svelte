<script lang="ts">
  import { SessionStorage } from "carbon-components-svelte";

  const objectValue = { theme: "dark", fontSize: 16 };
</script>

<div data-testid="object-storage">
  <SessionStorage
    key="theme-settings"
    value={objectValue}
    on:update={({ detail }) => {
      console.log("update event", detail);
    }}
  />
</div>
