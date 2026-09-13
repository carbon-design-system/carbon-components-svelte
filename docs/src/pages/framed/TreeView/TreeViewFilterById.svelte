<script>
  import {
    Button,
    ButtonSet,
    filterTreeById,
    Stack,
    TreeView,
  } from "carbon-components-svelte";

  const allNodes = [
    {
      id: "1",
      text: "Engineering",
      nodes: [
        {
          id: "1-1",
          text: "Runbooks",
          nodes: [
            { id: "1-1-1", text: "Incident Response.md" },
            { id: "1-1-2", text: "Deployment Playbook.md" },
            { id: "1-1-3", text: "On-Call Rotation.md" },
          ],
        },
        {
          id: "1-2",
          text: "Architecture",
          nodes: [
            { id: "1-2-1", text: "System Design.pdf" },
            { id: "1-2-2", text: "API Contracts.pdf" },
          ],
        },
      ],
    },
    {
      id: "2",
      text: "Finance",
      nodes: [
        { id: "2-1", text: "Q1-Invoice.pdf" },
        { id: "2-2", text: "Q2-Invoice.pdf" },
      ],
    },
    {
      id: "3",
      text: "Support",
      nodes: [
        {
          id: "3-1",
          text: "Tier 1",
          nodes: [
            { id: "3-1-1", text: "Ticket-1042.md" },
            { id: "3-1-2", text: "Ticket-1043.md" },
          ],
        },
      ],
    },
  ];

  let filteredNodes = allNodes;
  let expandedIds = [];

  function filterBySingleId() {
    filteredNodes = filterTreeById(allNodes, "1-1-1");
    expandedIds = ["1", "1-1", "1-1-1"];
  }

  function filterByMultipleIds() {
    filteredNodes = filterTreeById(allNodes, ["1-1-1", "1-2-1", "2-1"]);
    expandedIds = ["1", "1-1", "1-1-1", "1-2", "1-2-1", "2", "2-1"];
  }

  function resetFilter() {
    filteredNodes = allNodes;
    expandedIds = [];
  }
</script>

<Stack gap={6}>
  <ButtonSet>
    <Button size="small" on:click={filterBySingleId}>Filter single ID</Button>
    <Button size="small" on:click={filterByMultipleIds}>
      Filter multiple IDs
    </Button>
    <Button size="small" kind="tertiary" on:click={resetFilter}>Reset</Button>
  </ButtonSet>
  <div>
    <TreeView labelText="Shared Drive" nodes={filteredNodes} {expandedIds} />
  </div>
</Stack>
