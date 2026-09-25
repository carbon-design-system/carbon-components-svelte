<script lang="ts">
  import Stack from "carbon-components-svelte/Stack/Stack.svelte";
  import type { ComponentProps } from "svelte";

  export let as: ComponentProps<Stack>["as"] = false;
  export let orientation: ComponentProps<Stack>["orientation"] = "vertical";
  export let gap: ComponentProps<Stack>["gap"] = 1;
</script>

{#if as}
  <Stack {as} {orientation} {gap} {...$$restProps} let:props>
    <header {...props}><slot /></header>
  </Stack>
{:else}
  <Stack {orientation} {gap} {...$$restProps}>
    <slot />
  </Stack>
{/if}
