<script lang="ts">
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

  export let dir: "ltr" | "rtl" = "rtl";
  export let context = true;
  export let virtualize = false;

  const nodes = [
    {
      id: "analytics",
      text: "Analytics",
      nodes: [
        {
          id: "engine",
          text: "Analytics Engine",
          nodes: [{ id: "spark", text: "Apache Spark" }],
        },
        { id: "runbook", text: "Runbook", href: "#runbook" },
      ],
    },
  ];
</script>

{#if context}
  <LayoutDirection {dir}>
    <TreeView labelText="Services" {nodes} {virtualize} />
  </LayoutDirection>
{:else}
  <TreeView labelText="Services" {nodes} {virtualize} />
{/if}
