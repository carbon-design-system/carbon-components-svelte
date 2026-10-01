<script>
  import {
    Button,
    ButtonSet,
    moveTreeNode,
    Stack,
    TreeView,
  } from "carbon-components-svelte";

  let activeId = "button";
  let expandedIds = ["src", "components"];
  let nodes = [
    {
      id: "src",
      text: "src",
      nodes: [
        {
          id: "components",
          text: "components",
          nodes: [
            { id: "button", text: "Button.svelte" },
            { id: "input", text: "Input.svelte" },
          ],
        },
        {
          id: "utils",
          text: "utils",
          nodes: [{ id: "format", text: "format.js" }],
        },
        { id: "index", text: "index.js" },
      ],
    },
    { id: "readme", text: "README.md" },
  ];

  $: ({ previous, next, parent } = neighbors(nodes, activeId));

  // The parent and adjacent siblings of `id`, read from `nodes` directly.
  function neighbors(list, id, parentNode = null) {
    const index = list.findIndex((node) => node.id === id);
    if (index >= 0) {
      return {
        parent: parentNode,
        previous: list[index - 1] ?? null,
        next: list[index + 1] ?? null,
      };
    }
    for (const node of list) {
      if (!node.nodes) continue;
      const found = neighbors(node.nodes, id, node);
      if (found.parent || found.previous || found.next) return found;
    }
    return { parent: null, previous: null, next: null };
  }

  function move(target, position) {
    nodes = moveTreeNode(nodes, activeId, { target: target.id, position });
    if (position === "inside" && !expandedIds.includes(target.id)) {
      expandedIds = [...expandedIds, target.id];
    }
  }
</script>

<Stack gap={6}>
  <ButtonSet>
    <Button
      kind="tertiary"
      size="small"
      disabled={!previous}
      on:click={() => move(previous, "before")}
    >
      Move up
    </Button>
    <Button
      kind="tertiary"
      size="small"
      disabled={!next}
      on:click={() => move(next, "after")}
    >
      Move down
    </Button>
    <Button
      kind="tertiary"
      size="small"
      disabled={!previous}
      on:click={() => move(previous, "inside")}
    >
      Indent
    </Button>
    <Button
      kind="tertiary"
      size="small"
      disabled={!parent}
      on:click={() => move(parent, "after")}
    >
      Outdent
    </Button>
  </ButtonSet>
  <div>
    <TreeView labelText="Project" {nodes} bind:activeId bind:expandedIds />
  </div>
</Stack>
