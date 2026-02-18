<script>
  import { filterTreeByText, Search, Stack, TreeView } from "carbon-components-svelte";

  const allNodes = [
    {
      id: "1",
      text: "Documents",
      nodes: [
        {
          id: "1-1",
          text: "Work",
          nodes: [
            { id: "1-1-1", text: "Report.docx" },
            { id: "1-1-2", text: "Presentation.pptx" },
            { id: "1-1-3", text: "Budget.xlsx" },
            { id: "1-1-4", text: "Meeting Notes.txt" },
          ],
        },
        {
          id: "1-2",
          text: "Personal",
          nodes: [
            { id: "1-2-1", text: "Resume.pdf" },
            { id: "1-2-2", text: "Cover Letter.pdf" },
            { id: "1-2-3", text: "Portfolio.pdf" },
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
      text: "Pictures",
      nodes: [
        { id: "2-1", text: "Vacation.jpg" },
        { id: "2-2", text: "Family.jpg" },
        { id: "2-3", text: "Birthday.png" },
      ],
    },
    {
      id: "3",
      text: "Music",
      nodes: [
        {
          id: "3-1",
          text: "Rock",
          nodes: [
            { id: "3-1-1", text: "Song1.mp3" },
            { id: "3-1-2", text: "Song2.mp3" },
          ],
        },
        {
          id: "3-2",
          text: "Jazz",
          nodes: [
            { id: "3-2-1", text: "Song3.mp3" },
            { id: "3-2-2", text: "Song4.mp3" },
          ],
        },
        {
          id: "3-3",
          text: "Classical",
          nodes: [{ id: "3-3-1", text: "Symphony.mp3" }],
        },
      ],
    },
  ];

  let searchValue = "";
  let expandedIds = [];

  $: filteredNodes =
    searchValue.trim() === ""
      ? allNodes
      : filterTreeByText(allNodes, searchValue);

  $: if (searchValue.trim() !== "" && filteredNodes.length > 0) {
    const extractIds = (nodes) => {
      const ids = [];
      for (const node of nodes) {
        ids.push(node.id);
        if (node.nodes) {
          ids.push(...extractIds(node.nodes));
        }
      }
      return ids;
    };
    expandedIds = extractIds(filteredNodes);
  } else {
    expandedIds = [];
  }
</script>

<Stack gap={2}>
  <Search size="sm" placeholder="Search tree nodes..." bind:value={searchValue} />
  <div>
    {#if filteredNodes.length > 0}
      <TreeView labelText="File System" nodes={filteredNodes} {expandedIds} />
    {:else}
      No matching nodes found for "{searchValue}"
    {/if}
  </div>
</Stack>
