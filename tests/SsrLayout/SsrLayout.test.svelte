<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

  const nodes = [
    {
      id: "src",
      text: "src",
      nodes: [{ id: "app", text: "App.svelte" }],
    },
  ];
</script>

<TreeView labelText="Project" {nodes} expandedIds={["src"]} />

<ExpandableTile>
  <div slot="above">Storage</div>
  <div slot="below">2.4 TB of 5 TB used</div>
</ExpandableTile>

<OverflowMenu open size="xl" iconDescription="More">
  <OverflowMenuItem text="Edit" />
</OverflowMenu>
