<script>
  import {
    Button,
    ButtonSet,
    fuzzyMatch,
    highlightSegments,
    Search,
    Stack,
    TreeView,
  } from "carbon-components-svelte";

  const nodes = [
    {
      id: "src",
      text: "src",
      nodes: [
        {
          id: "components",
          text: "components",
          nodes: [
            { id: "button", text: "Button.svelte" },
            { id: "button-group", text: "ButtonGroup.svelte" },
            { id: "input", text: "Input.svelte" },
          ],
        },
        {
          id: "utils",
          text: "utils",
          nodes: [
            { id: "format", text: "format.js" },
            { id: "debounce", text: "debounce.js" },
          ],
        },
      ],
    },
    {
      id: "tests",
      text: "tests",
      nodes: [
        { id: "button-test", text: "Button.test.js" },
        { id: "input-test", text: "Input.test.js" },
      ],
    },
  ];

  let treeview = null;
  let searchValue = "";
  // Index into `matchIds` of the current match, or -1 before navigating.
  let matchIndex = -1;

  function flatten(list) {
    return list.flatMap((node) => [node, ...flatten(node.nodes ?? [])]);
  }

  const allNodes = flatten(nodes);

  $: query = searchValue.trim();
  // Matched characters per node id, in tree order.
  $: matches = new Map(
    query === ""
      ? []
      : allNodes
          .map((node) => [
            node.id,
            fuzzyMatch(node.text, query, { threshold: 0.5 }),
          ])
          .filter(([, match]) => match.matched)
          .map(([id, match]) => [id, match.indices]),
  );
  $: matchIds = [...matches.keys()];
  $: resetMatchIndex(query);

  function resetMatchIndex() {
    matchIndex = -1;
  }

  function goTo(index) {
    matchIndex = index;
    // Select and scroll to the match, but keep focus in the search input so
    // typing can continue.
    treeview?.showNode(matchIds[index], { focus: false, scroll: true });
  }

  function next() {
    if (matchIds.length > 0) goTo((matchIndex + 1) % matchIds.length);
  }

  function previous() {
    if (matchIds.length === 0) return;
    goTo(matchIndex <= 0 ? matchIds.length - 1 : matchIndex - 1);
  }
</script>

<Stack gap={6}>
  <Stack gap={4}>
    <Search
      size="sm"
      labelText="Find in tree"
      placeholder="Find in tree..."
      bind:value={searchValue}
      on:keydown={(event) => {
        if (event.key !== "Enter") return;
        if (event.shiftKey) previous();
        else next();
      }}
    />
    <ButtonSet>
      <Button
        kind="tertiary"
        size="small"
        disabled={matchIds.length === 0}
        on:click={previous}
      >
        Previous match
      </Button>
      <Button
        kind="tertiary"
        size="small"
        disabled={matchIds.length === 0}
        on:click={next}
      >
        Next match
      </Button>
    </ButtonSet>
    <div aria-live="polite">
      {#if query !== ""}
        {#if matchIds.length === 0}
          No matches
        {:else if matchIndex >= 0}
          Match {matchIndex + 1} of {matchIds.length}
        {:else}
          {matchIds.length} {matchIds.length === 1 ? "match" : "matches"}
        {/if}
      {/if}
    </div>
  </Stack>
  <div>
    <TreeView
      bind:this={treeview}
      labelText="Project"
      {nodes}
      expandedIds={["src", "components"]}
      let:node
    >
      {#each highlightSegments(
        node.text,
        matches.get(node.id) ?? [],
      ) as segment}
        {#if segment.match}
          <strong>{segment.text}</strong>
        {:else}
          {segment.text}
        {/if}
      {/each}
    </TreeView>
  </div>
</Stack>
