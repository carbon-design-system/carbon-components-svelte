<script>
  import {
    ActionBar,
    ActionBarButton,
    Box,
    Slider,
    Stack,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let width = 340;
</script>

<Stack gap={6}>
  <Slider
    labelText="Width of the bar"
    min={80}
    max={440}
    step={20}
    bind:value={width}
  />
  <Box width="{width}px" maxWidth="100%">
    <ActionBar labelText="Priorities">
      <ActionBarButton labelText="Settings" icon={Settings} priority={-1} />
      <ActionBarButton labelText="Edit" icon={Edit} />
      <ActionBarButton labelText="Copy" icon={Copy} />
      <ActionBarButton labelText="Delete" icon={TrashCan} priority={1} />
      <ActionBarButton labelText="Add" icon={Add} />
      <ActionBarButton labelText="Save" icon={Save} iconOnly={false} pinned />
    </ActionBar>
  </Box>
  <p>
    Settings goes first (priority -1), though it comes first in the row. Delete
    (priority 1) outlasts the rest, and Save is pinned.
  </p>
</Stack>
