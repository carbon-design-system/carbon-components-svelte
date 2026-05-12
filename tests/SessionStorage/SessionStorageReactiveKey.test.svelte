<script lang="ts">
  import { SessionStorage } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let storageKey: ComponentProps<SessionStorage>["key"] = "key-a";
  export let currentValue: ComponentProps<SessionStorage>["value"] = "";

  $: valueDisplay =
    typeof currentValue === "object"
      ? JSON.stringify(currentValue)
      : currentValue;
</script>

<SessionStorage key={storageKey} bind:value={currentValue} />
<div data-testid="value">{valueDisplay}</div>
