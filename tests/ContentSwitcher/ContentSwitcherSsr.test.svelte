<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";

  export let selectedIndex = 0;
</script>

<ContentSwitcher {selectedIndex}>
  <Switch text="All" />
  <Switch text="Active" />
  <Switch text="Archived" />
</ContentSwitcher>
