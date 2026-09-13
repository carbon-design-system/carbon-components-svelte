<script>
  import {
    Button,
    ButtonSet,
    filterTreeNodes,
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
          text: "Incidents",
          nodes: [
            { id: "1-1-1", text: "RCA-2024-041.docx" },
            { id: "1-1-2", text: "Postmortem Deck.pptx" },
            { id: "1-1-3", text: "Capacity Plan.xlsx" },
          ],
        },
        {
          id: "1-2",
          text: "Architecture",
          nodes: [
            { id: "1-2-1", text: "System Design.pdf" },
            { id: "1-2-2", text: "API Contract.pdf" },
          ],
        },
      ],
    },
    {
      id: "2",
      text: "Finance",
      nodes: [
        { id: "2-1", text: "Q1-Invoice.csv" },
        { id: "2-2", text: "Q2-Invoice.csv" },
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
            { id: "3-1-1", text: "Ticket-1042.log" },
            { id: "3-1-2", text: "Ticket-1043.log" },
          ],
        },
      ],
    },
  ];

  let filteredNodes = allNodes;
  let expandedIds = [];

  function filterByExtension() {
    filteredNodes = filterTreeNodes(
      allNodes,
      (node) => node.text?.endsWith(".pdf") || node.text?.endsWith(".docx"),
    );
    expandedIds = ["1", "1-1", "1-1-1", "1-2", "1-2-1"];
  }

  function filterLeafNodes() {
    filteredNodes = filterTreeNodes(
      allNodes,
      (node) => !node.nodes || node.nodes.length === 0,
    );
    expandedIds = [
      "1",
      "1-1",
      "1-1-1",
      "1-1-2",
      "1-1-3",
      "1-2",
      "1-2-1",
      "1-2-2",
      "2",
      "2-1",
      "2-2",
      "3",
      "3-1",
      "3-1-1",
      "3-1-2",
    ];
  }

  function filterWithChildren() {
    filteredNodes = filterTreeNodes(allNodes, (node) => node.id === "1-1", {
      includeChildren: true,
    });
    expandedIds = ["1", "1-1", "1-1-1", "1-1-2", "1-1-3"];
  }

  function resetFilter() {
    filteredNodes = allNodes;
    expandedIds = [];
  }
</script>

<Stack gap={6}>
  <ButtonSet>
    <Button size="small" on:click={filterByExtension}>
      Filter by extension (.pdf, .docx)
    </Button>
    <Button size="small" on:click={filterLeafNodes}>Filter leaf nodes</Button>
    <Button size="small" on:click={filterWithChildren}>
      Filter with children
    </Button>
    <Button size="small" kind="tertiary" on:click={resetFilter}>Reset</Button>
  </ButtonSet>
  <div>
    <TreeView labelText="Shared Drive" nodes={filteredNodes} {expandedIds} />
  </div>
</Stack>
