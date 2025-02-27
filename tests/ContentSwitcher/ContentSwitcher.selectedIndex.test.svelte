<script lang="ts">
  import { ContentSwitcher, Switch } from "carbon-components-svelte";

  export let selectedIndex = 1;
</script>

<ContentSwitcher {selectedIndex}>
  <Switch text="First" />
  <Switch text="Second" />
  <Switch text="Third" />
</ContentSwitcher>
