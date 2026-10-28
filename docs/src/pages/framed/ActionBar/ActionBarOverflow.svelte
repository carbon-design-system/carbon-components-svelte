<script>
  import {
    ActionBar,
    ActionBarButton,
    ActionBarDivider,
    Box,
    Slider,
    Stack,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Redo from "carbon-icons-svelte/lib/Redo.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import Undo from "carbon-icons-svelte/lib/Undo.svelte";

  let width = 480;
  let collapsed = 0;
</script>

<Stack gap={6}>
  <Slider
    labelText="Width of the bar"
    min={80}
    max={560}
    step={20}
    bind:value={width}
  />
  <Box width="{width}px" maxWidth="100%">
    <ActionBar
      labelText="Document tools"
      on:overflow:change={(event) => (collapsed = event.detail.count)}
    >
      <ActionBarButton labelText="Add" icon={Add} />
      <ActionBarButton labelText="Edit" icon={Edit} />
      <ActionBarButton labelText="Copy" icon={Copy} />
      <ActionBarDivider />
      <ActionBarButton labelText="Undo" icon={Undo} />
      <ActionBarButton labelText="Redo" icon={Redo} />
      <ActionBarDivider />
      <ActionBarButton labelText="Search" icon={Search} />
      <ActionBarButton labelText="Settings" icon={Settings} />
      <ActionBarButton labelText="Save" icon={Save} />
      <ActionBarButton labelText="Delete" icon={TrashCan} />
    </ActionBar>
  </Box>
  <p>{collapsed} in the menu</p>
</Stack>
