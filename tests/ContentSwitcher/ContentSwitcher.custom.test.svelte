<script lang="ts">
import { ContentSwitcher, Switch } from "carbon-components-svelte";
</script>

<ContentSwitcher>
  <Switch>
    <div data-testid="custom-content">Custom Content</div>
  </Switch>
  <Switch text="Regular Text" />
</ContentSwitcher>
