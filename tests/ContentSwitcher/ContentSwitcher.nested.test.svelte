<script lang="ts">
  import { ContentSwitcher, Switch } from "carbon-components-svelte";
</script>

<ContentSwitcher>
  <Switch text="Outer 1" />
  <Switch>
    <span data-testid="nested-tab" role="tab">Nested tab</span>
  </Switch>
  <Switch text="Outer 3" />
</ContentSwitcher>
