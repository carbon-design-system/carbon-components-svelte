<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";

  export let iconOnly = false;
</script>

<ContentSwitcher>
  <Switch icon={Dashboard} {iconOnly} text="Dashboard" />
  <Switch icon={List} {iconOnly} text="List" />
</ContentSwitcher>
