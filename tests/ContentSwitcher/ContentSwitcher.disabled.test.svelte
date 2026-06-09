<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
</script>

<ContentSwitcher>
  <Switch text="Enabled" />
  <Switch text="Disabled" disabled />
  <Switch text="Also Enabled" />
</ContentSwitcher>
