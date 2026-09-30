<script>
  import {
    filterTreeByText,
    Search,
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
            { id: "1-1-4", text: "Postmortem Template.md" },
          ],
        },
        {
          id: "1-2",
          text: "Architecture",
          nodes: [
            { id: "1-2-1", text: "System Design.pdf" },
            { id: "1-2-2", text: "API Contracts.pdf" },
            { id: "1-2-3", text: "Data Model.pdf" },
          ],
        },
        {
          id: "1-3",
          text: "Projects",
          nodes: [
            {
              id: "1-3-1",
              text: "Website",
              nodes: [
                { id: "1-3-1-1", text: "index.html" },
                { id: "1-3-1-2", text: "styles.css" },
                { id: "1-3-1-3", text: "script.js" },
              ],
            },
            {
              id: "1-3-2",
              text: "App",
              nodes: [
                { id: "1-3-2-1", text: "main.py" },
                { id: "1-3-2-2", text: "config.json" },
              ],
            },
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
        { id: "2-3", text: "Q3-Invoice.pdf" },
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
        {
          id: "3-2",
          text: "Tier 2",
          nodes: [
            { id: "3-2-1", text: "Ticket-2091.md" },
            { id: "3-2-2", text: "Ticket-2092.md" },
          ],
        },
        {
          id: "3-3",
          text: "Tier 3",
          nodes: [{ id: "3-3-1", text: "Ticket-3005.md" }],
        },
      ],
    },
  ];

  let searchValue = "";
  let expandedIds = [];

  // Expansion to restore when the search is cleared.
  let expandedIdsBeforeSearch = null;

  $: query = searchValue.trim();
  $: filteredNodes =
    query === "" ? allNodes : filterTreeByText(allNodes, query);
  $: syncExpansion(query, filteredNodes);

  function collectIds(nodes) {
    const ids = [];
    for (const node of nodes) {
      ids.push(node.id);
      if (node.nodes) ids.push(...collectIds(node.nodes));
    }
    return ids;
  }

  function syncExpansion(query, filteredNodes) {
    if (query === "") {
      if (expandedIdsBeforeSearch !== null) {
        expandedIds = expandedIdsBeforeSearch;
        expandedIdsBeforeSearch = null;
      }
      return;
    }
    if (expandedIdsBeforeSearch === null) {
      expandedIdsBeforeSearch = expandedIds;
    }
    expandedIds = collectIds(filteredNodes);
  }
</script>

<Stack gap={6}>
  <Search
    size="sm"
    placeholder="Search tree nodes..."
    bind:value={searchValue}
  />
  <div>
    {#if filteredNodes.length > 0}
      <TreeView
        labelText="Shared Drive"
        nodes={filteredNodes}
        bind:expandedIds
      />
    {:else}
      No matching nodes found for "{searchValue}"
    {/if}
  </div>
</Stack>
