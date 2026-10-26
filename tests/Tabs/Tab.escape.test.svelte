<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <Tabs iconOnly>
    <Tab label="Dashboard" icon={Dashboard} />
    <Tab label="Settings" icon={Settings} />
  </Tabs>
  <input aria-label="Other control" />
</div>
