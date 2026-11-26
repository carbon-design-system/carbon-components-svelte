<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

  export let virtualize = false;

  type Service = {
    id: string;
    text: string;
    status?: string;
    badge?: number;
    nodes?: Service[];
  };

  const nodes: Service[] = [
    {
      id: "deployments",
      text: "Deployments",
      nodes: [
        { id: "api", text: "api-gateway", status: "Failed", badge: 3 },
        { id: "web", text: "web-frontend" },
      ],
    },
  ];
</script>

<TreeView
  labelText="Services"
  {nodes}
  {virtualize}
  expandedIds={["deployments"]}
>
  <svelte:fragment slot="badgeChildren" let:node>
    {#if node.status}<span data-testid="status">{node.status}</span>{/if}
  </svelte:fragment>
</TreeView>
