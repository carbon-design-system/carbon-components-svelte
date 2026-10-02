<script>
  import { TextInput, TreeView } from "carbon-components-svelte";
  import { tick } from "svelte";

  let treeview = null;
  let nodes = [
    { id: 0, text: "AI / Machine learning" },
    {
      id: 1,
      text: "Analytics",
      nodes: [
        {
          id: 2,
          text: "IBM Analytics Engine",
          nodes: [
            { id: 3, text: "Apache Spark" },
            { id: 4, text: "Hadoop" },
          ],
        },
        { id: 5, text: "IBM Cloud SQL Query" },
        { id: 6, text: "IBM Db2 Warehouse on Cloud" },
      ],
    },
    {
      id: 7,
      text: "Blockchain",
      nodes: [{ id: 8, text: "IBM Blockchain Platform" }],
    },
  ];

  // Id of the row that last received focus.
  let focusedId = null;
  // Id of the row being renamed, or `null`.
  let editingId = null;
  let draft = "";
  let inputRef = null;

  $: error = editingId === null ? "" : validate(editingId, draft);

  function validate(id, text) {
    const name = text.trim();
    if (name === "") return "Enter a name";
    const taken = treeview
      ?.getSiblings(id)
      .some((node) => node.text.toLowerCase() === name.toLowerCase());
    return taken ? "A sibling already has this name" : "";
  }

  async function startEditing(id) {
    const node = treeview?.getNode(id);
    if (!node || node.disabled) return;
    editingId = id;
    draft = node.text;
    await tick();
    inputRef?.focus();
    inputRef?.select();
  }

  async function stopEditing(save) {
    if (editingId === null) return;
    if (save && error) return;
    const id = editingId;
    if (save) nodes = rename(nodes, id, draft.trim());
    editingId = null;
    // Return focus to the row so keyboard navigation continues from it.
    await treeview?.showNode(id, { expand: false, select: false });
  }

  function rename(list, id, text) {
    return list.map((node) => {
      if (node.id === id) return { ...node, text };
      if (node.nodes) return { ...node, nodes: rename(node.nodes, id, text) };
      return node;
    });
  }
</script>

<TreeView
  bind:this={treeview}
  labelText="Cloud Products (F2 or double-click to rename)"
  {nodes}
  expandedIds={[1]}
  on:focus={({ detail }) => (focusedId = detail.id)}
  on:keydown={(event) => {
    if (event.key === "F2" && focusedId !== null) {
      event.preventDefault();
      startEditing(focusedId);
    }
  }}
  let:node
>
  {#if node.id === editingId}
    <!-- Keep typing and clicks inside the input from reaching the tree's
         row handlers (Space selects, arrows move focus). -->
    <div on:click|stopPropagation on:keydown|stopPropagation role="none">
      <TextInput
        bind:ref={inputRef}
        bind:value={draft}
        size="sm"
        hideLabel
        labelText="Name"
        invalid={error !== ""}
        invalidText={error}
        on:keydown={(event) => {
          if (event.key === "Enter") stopEditing(true);
          if (event.key === "Escape") stopEditing(false);
        }}
        on:blur={() => stopEditing(error === "")}
      />
    </div>
  {:else}
    <span on:dblclick={() => startEditing(node.id)} role="none">
      {node.text}
    </span>
  {/if}
</TreeView>
