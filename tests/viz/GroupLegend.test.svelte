<script lang="ts">
  import type { ComponentType, SvelteComponent } from "svelte";

  export let component: ComponentType<SvelteComponent>;
  export let chartProps: Record<string, unknown> = {};
  export let hidden: ReadonlyArray<string | number> = [];
  export let ontoggle: (detail: unknown) => void = () => {};
</script>

<svelte:component
  this={component}
  {...chartProps}
  bind:hidden
  on:legend:toggle={(e) => ontoggle(e.detail)}
/>
<output data-testid="hidden">{hidden.join(",")}</output>
