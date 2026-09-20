<script>
  import { Button, ButtonSet, Stack, TreeView } from "carbon-components-svelte";
  import { tick } from "svelte";

  function generateNodes(count) {
    const nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({ id: i, text: `Node ${i + 1}` });
    }
    return nodes;
  }

  let nodes = generateNodes(5000);
  let lastLabel = "";
  let lastDuration = null;

  async function reassignUnchanged() {
    const start = performance.now();
    nodes = nodes; // same reference, nothing mutated
    await tick();
    lastLabel = "Reassign, nothing changed";
    lastDuration = performance.now() - start;
  }

  async function mutateThenReassign() {
    const first = nodes[0];
    first.text = first.text.endsWith("*")
      ? first.text.slice(0, -1)
      : `${first.text}*`;

    const start = performance.now();
    nodes = nodes; // same reference, but a node was mutated in place
    await tick();
    lastLabel = "Mutate a node, then reassign";
    lastDuration = performance.now() - start;
  }
</script>

<Stack gap={5}>
  <ButtonSet>
    <Button kind="secondary" on:click={reassignUnchanged}>
      Reassign nodes (no change)
    </Button>
    <Button kind="secondary" on:click={mutateThenReassign}>
      Mutate a node, then reassign
    </Button>
  </ButtonSet>
  {#if lastDuration !== null}
    <div>
      {lastLabel}: {lastDuration.toFixed(2)}ms ({nodes.length.toLocaleString()}
      nodes)
    </div>
  {/if}
  <div>
    <TreeView labelText="{nodes.length.toLocaleString()} nodes" {nodes} />
  </div>
</Stack>
