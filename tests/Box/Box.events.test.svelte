<script lang="ts">
  import type Box from "carbon-components-svelte/Box/Box.svelte";
  import type Stack from "carbon-components-svelte/Stack/Stack.svelte";

  export let component: typeof Box | typeof Stack;
  export let onEvent: (event: string) => void;
</script>

<svelte:component
  this={component}
  data-testid="target"
  on:click={() => onEvent("click")}
  on:scroll={() => onEvent("scroll")}
  on:keydown={(e) => onEvent(`keydown:${e.key}`)}
  on:focusin={() => onEvent("focusin")}
  on:focusout={() => onEvent("focusout")}
>
  <button type="button">Inner</button>
</svelte:component>
