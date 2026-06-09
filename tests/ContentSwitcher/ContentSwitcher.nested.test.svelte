<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
</script>

<ContentSwitcher>
  <Switch text="Outer 1" />
  <Switch>
    <span data-testid="nested-tab" role="tab">Nested tab</span>
  </Switch>
  <Switch text="Outer 3" />
</ContentSwitcher>
