<script>
  import { TreeView } from "carbon-components-svelte";

  let nodes = [
    { id: 0, text: "AI / Machine learning" },
    {
      id: 1,
      text: "Analytics",
      nodes: [
        { id: 2, text: "IBM Analytics Engine" },
        { id: 5, text: "IBM Cloud SQL Query" },
      ],
    },
    {
      id: 7,
      text: "Blockchain",
      nodes: [{ id: 8, text: "IBM Blockchain Platform" }],
    },
    { id: 9, text: "Databases" },
  ];

  /** Remove the node matching `id`, returning the updated tree and the removed node. */
  function removeNode(items, id) {
    let removed = null;
    const next = [];
    for (const item of items) {
      if (item.id === id) {
        removed = item;
        continue;
      }
      if (item.nodes) {
        const [childNodes, childRemoved] = removeNode(item.nodes, id);
        if (childRemoved) removed = childRemoved;
        next.push({ ...item, nodes: childNodes });
      } else {
        next.push(item);
      }
    }
    return [next, removed];
  }

  /** Insert `moved` before, after, or inside the node matching `targetId`. */
  function insertNode(items, targetId, position, moved) {
    const next = [];
    for (const item of items) {
      if (item.id === targetId) {
        if (position === "before") next.push(moved);
        if (position === "inside") {
          next.push({ ...item, nodes: [...(item.nodes ?? []), moved] });
          continue;
        }
        next.push(item);
        if (position === "after") next.push(moved);
        continue;
      }
      next.push(
        item.nodes
          ? {
              ...item,
              nodes: insertNode(item.nodes, targetId, position, moved),
            }
          : item,
      );
    }
    return next;
  }

  function handleMove(event) {
    const { ids, targetId, position } = event.detail;
    const [withoutMoved, moved] = removeNode(nodes, ids[0]);
    if (!moved) return;
    nodes = insertNode(withoutMoved, targetId, position, moved);
  }
</script>

<TreeView
  draggable
  labelText="Cloud Products"
  {nodes}
  expandedIds={[1, 7]}
  on:move={handleMove}
/>
