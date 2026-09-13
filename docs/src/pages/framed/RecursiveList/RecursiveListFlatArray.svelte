<script>
  import { RecursiveList, toHierarchy } from "carbon-components-svelte";

  const nodesFlat = [
    { id: 1, text: "Infrastructure" },
    { id: 2, text: "Deployment runbooks", pid: 1 },
    { id: 3, html: "<h5>Last updated: Q3 2026</h5>", pid: 2 },
    { id: 4, text: "Incident response" },
    { id: 5, href: "https://status.example.com/incidents", pid: 4 },
    {
      id: 6,
      href: "https://status.example.com/incidents",
      text: "View incident history",
      pid: 4,
    },
    { id: 7, text: "Billing" },
  ];
</script>

<RecursiveList nodes={toHierarchy(nodesFlat, (node) => node.pid)} />
