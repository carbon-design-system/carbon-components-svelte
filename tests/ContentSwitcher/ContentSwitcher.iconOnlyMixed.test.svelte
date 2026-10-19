<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import TableOfContents from "carbon-icons-svelte/lib/TableOfContents.svelte";

  export let plainIcon: typeof Dashboard | undefined = undefined;
</script>

<ContentSwitcher>
  <Switch icon={TableOfContents} text="Table of contents" />
  <Switch icon={Dashboard} text="Dashboard" />
  <Switch icon={plainIcon} text="Plain" />
</ContentSwitcher>
