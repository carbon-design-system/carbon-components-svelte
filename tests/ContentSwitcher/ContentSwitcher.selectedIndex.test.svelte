<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";

  export let selectedIndex = 1;
</script>

<ContentSwitcher {selectedIndex}>
  <Switch text="First" />
  <Switch text="Second" />
  <Switch text="Third" />
</ContentSwitcher>
