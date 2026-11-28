<script lang="ts">
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";

  export let sticky = true;

  let stuck = false;
</script>

<Toolbar {sticky} bind:stuck data-testid="toolbar" />
<div data-testid="stuck">{stuck}</div>
