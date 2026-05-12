<script lang="ts">
  import { LocalStorage } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let storageKey: ComponentProps<LocalStorage>["key"] = "key-a";
  export let currentValue: ComponentProps<LocalStorage>["value"] = "";

  $: valueDisplay =
    typeof currentValue === "object"
      ? JSON.stringify(currentValue)
      : currentValue;
</script>

<LocalStorage key={storageKey} bind:value={currentValue} />
<div data-testid="value">{valueDisplay}</div>
