<script lang="ts">
  import Guidebanner from "carbon-components-svelte/InlineTip/Guidebanner.svelte";
  import type { ComponentProps } from "svelte";

  export let tips: ComponentProps<Guidebanner>["tips"] = [
    { id: "filters", title: "Filter by owner", text: "Narrow the table." },
    {
      id: "export",
      title: "Export a view",
      text: "Save a view as CSV.",
      href: "/docs/export",
    },
    { id: "share", title: "Share a view", text: "Send a link." },
  ];
  export let current = 0;
  export let store: ComponentProps<Guidebanner>["store"] = undefined;
  export let onChange: (
    e: CustomEvent<{ index: number; id: string }>,
  ) => void = () => {};
  export let onDismiss: (e: CustomEvent<{ ids: string[] }>) => void = () => {};
</script>

<button type="button">Before</button>
<Guidebanner
  {tips}
  bind:current
  {store}
  data-testid="banner"
  on:change={onChange}
  on:dismiss={onDismiss}
/>
<span data-testid="current">{current}</span>
