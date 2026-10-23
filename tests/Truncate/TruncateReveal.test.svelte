<script lang="ts">
  import Truncate from "carbon-components-svelte/Truncate/Truncate.svelte";
  import type { ComponentProps } from "svelte";

  export let reveal: ComponentProps<Truncate>["reveal"] = "tooltip";
  export let lines: ComponentProps<Truncate>["lines"] = 1;
  export let expanded = false;
  export let labels: Pick<
    ComponentProps<Truncate>,
    "expandLabel" | "collapseLabel"
  > = {};
  export let id: string | undefined = undefined;
  export let text =
    "Failed to deploy revision 214: the payments-api image exceeded the memory limit.";

  let escapes = 0;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") escapes += 1;
  }
</script>

<div role="presentation" on:keydown={handleKeydown}>
  <Truncate {reveal} {lines} {id} {...labels} bind:expanded data-testid="text">
    {text}
  </Truncate>
</div>
<span data-testid="expanded">{expanded}</span>
<span data-testid="escapes">{escapes}</span>
