<script lang="ts">
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import TreeViewGrid from "carbon-components-svelte/TreeViewGrid/TreeViewGrid.svelte";

  export let dir: "ltr" | "rtl" = "rtl";
  export let context = true;

  const nodes = [
    {
      id: "analytics",
      text: "Analytics",
      owner: "Ana",
      nodes: [{ id: "engine", text: "Engine", owner: "Ben" }],
    },
  ];
  const headers = [
    { key: "text", value: "Name" },
    { key: "owner", value: "Owner" },
  ];
</script>

{#if context}
  <LayoutDirection {dir}>
    <TreeViewGrid labelText="Services" {nodes} {headers} />
  </LayoutDirection>
{:else}
  <TreeViewGrid labelText="Services" {nodes} {headers} />
{/if}
