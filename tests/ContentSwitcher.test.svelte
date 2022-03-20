<script lang="ts">
  import { ContentSwitcher, Switch } from "../types";
  import Analytics16 from "carbon-icons-svelte/lib/Analytics16";
</script>

<ContentSwitcher size="xl" selectedIndex="{1}">
  <Switch disabled text="Latest news" />
  <Switch text="Trending" />
  <Switch>
    <div style="display: flex; align-items: center;">
      <Analytics16 style="margin-right: 0.5rem;" />
      Trending
    </div>
  </Switch>
</ContentSwitcher>
