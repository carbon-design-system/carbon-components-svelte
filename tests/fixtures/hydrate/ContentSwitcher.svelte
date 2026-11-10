<script>
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
</script>

<ContentSwitcher>
  <Switch text="Dashboard" icon={Dashboard} />
  <Switch text="List" icon={List} />
</ContentSwitcher>
<ContentSwitcher>
  <Switch text="Dashboard" icon={Dashboard} />
  <Switch text="Plain" />
</ContentSwitcher>
