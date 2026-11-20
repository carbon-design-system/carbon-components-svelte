<script lang="ts">
  import JsonViewer from "carbon-components-svelte/JsonViewer/JsonViewer.svelte";
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<JsonViewer>["value"] = {
    name: "carbon",
    tags: ["a", "b", "c"],
    nested: { deep: { deeper: "needle" } },
    count: 3,
  };
  export let query = "";
  export let path = "";
  export let dir: "ltr" | "rtl" | undefined = undefined;
  export let options: Partial<ComponentProps<JsonViewer>> = {};
  export let onSelect: (detail: unknown) => void = () => {};
  export let onToggle: (detail: unknown) => void = () => {};
  export let onCopy: (detail: unknown) => void = () => {};

  export let onViewer: (viewer: JsonViewer) => void = () => {};

  let viewer: JsonViewer | undefined;
  $: if (viewer) onViewer(viewer);
</script>

{#if dir}
  <LayoutDirection {dir}>
    <JsonViewer
      bind:this={viewer}
      bind:query
      bind:path
      {value}
      labelText="Data"
      {...options}
      on:select={(event) => onSelect(event.detail)}
      on:toggle={(event) => onToggle(event.detail)}
      on:copy={(event) => onCopy(event.detail)}
    />
  </LayoutDirection>
{:else}
  <JsonViewer
    bind:this={viewer}
    bind:query
    bind:path
    {value}
    labelText="Data"
    {...options}
    on:select={(event) => onSelect(event.detail)}
    on:toggle={(event) => onToggle(event.detail)}
    on:copy={(event) => onCopy(event.detail)}
  />
{/if}
