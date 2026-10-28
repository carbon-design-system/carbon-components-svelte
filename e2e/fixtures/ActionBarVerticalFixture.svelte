<script>
  import { ActionBar, ActionBarButton } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Redo from "carbon-icons-svelte/lib/Redo.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import Undo from "carbon-icons-svelte/lib/Undo.svelte";
</script>

<div id="vertical" style="height: 160px">
  <ActionBar labelText="Tools" orientation="vertical">
    <ActionBarButton labelText="Add" icon={Add} />
    <ActionBarButton labelText="Copy" icon={Copy} />
    <ActionBarButton labelText="Save" icon={Save} />
    <ActionBarButton labelText="Delete" icon={TrashCan} />
    <ActionBarButton labelText="Undo" icon={Undo} />
    <ActionBarButton labelText="Redo" icon={Redo} />
  </ActionBar>
</div>
