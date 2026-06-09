<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
</script>

<ContentSwitcher>
  <Switch> <div data-testid="custom-content">Custom Content</div> </Switch>
  <Switch text="Regular Text" />
</ContentSwitcher>
