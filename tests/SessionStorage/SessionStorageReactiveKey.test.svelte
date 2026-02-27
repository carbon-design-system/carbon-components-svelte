<script lang="ts">
  import { SessionStorage } from "carbon-components-svelte";

  export let storageKey: string = "key-a";
  export let currentValue: string | object = "";

  $: valueDisplay =
    typeof currentValue === "object"
      ? JSON.stringify(currentValue)
      : currentValue;
</script>

<SessionStorage key={storageKey} bind:value={currentValue} />
<div data-testid="value">{valueDisplay}</div>
