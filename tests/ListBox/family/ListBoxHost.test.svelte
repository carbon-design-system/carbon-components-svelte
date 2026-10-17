<script lang="ts">
  import type { ComponentType } from "svelte";

  type Trigger = CustomEvent<{ trigger: string }>;
  type ScrollMetrics = CustomEvent<{
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
  }>;

  export let component: ComponentType;
  export let fieldProps: Record<string, unknown> = {};
  export let open = false;
  export let onOpen: (e: Trigger) => void = () => {};
  export let onClose: (e: Trigger) => void = () => {};
  export let onScroll: (e: Event) => void = () => {};
  export let onScrollend: (e: ScrollMetrics) => void = () => {};
</script>

<svelte:component
  this={component}
  {...fieldProps}
  bind:open
  on:open={onOpen}
  on:close={onClose}
  on:scroll={onScroll}
  on:scrollend={onScrollend}
/>
