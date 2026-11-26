<script>
  import { IconIndicator, TreeView } from "carbon-components-svelte";
  import Application from "carbon-icons-svelte/lib/Application.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";

  const nodes = [
    {
      id: "production",
      text: "Production",
      icon: Folder,
      nodes: [
        {
          id: "gateway",
          text: "api-gateway",
          icon: Application,
          status: { kind: "failed", label: "Failed" },
        },
        {
          id: "frontend",
          text: "web-frontend",
          icon: Application,
          status: { kind: "succeeded", label: "Running" },
        },
        {
          id: "worker",
          text: "worker",
          icon: Application,
          status: { kind: "in-progress", label: "Deploying" },
        },
      ],
    },
    {
      id: "staging",
      text: "Staging",
      icon: Folder,
      nodes: [
        {
          id: "staging-gateway",
          text: "api-gateway",
          icon: Application,
          status: { kind: "succeeded", label: "Running" },
        },
      ],
    },
  ];
</script>

<TreeView labelText="Deployments" {nodes} expandedIds={["production"]}>
  <svelte:fragment slot="badgeChildren" let:node>
    {#if node.status}
      <IconIndicator
        kind={node.status.kind}
        label={node.status.label}
        hideLabel
      />
    {/if}
  </svelte:fragment>
</TreeView>
