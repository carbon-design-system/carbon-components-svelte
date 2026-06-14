<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
</script>

<ContentSwitcher lowContrast>
  <Switch text="Low 1" />
  <Switch text="Low 2" />
</ContentSwitcher>

<ContentSwitcher>
  <Switch text="Default 1" />
  <Switch text="Default 2" />
</ContentSwitcher>
