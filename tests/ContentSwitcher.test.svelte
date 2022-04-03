<script lang="ts">
  import { ContentSwitcher, Switch } from "../types";
  import Analytics from "carbon-icons-svelte/lib/Analytics.svelte";
</script>

<ContentSwitcher size="xl" selectedIndex="{1}">
  <Switch disabled text="Latest news" />
  <Switch text="Trending" />
  <Switch>
    <div style="display: flex; align-items: center;">
      <Analytics style="margin-right: 0.5rem;" />
      Trending
    </div>
  </Switch>
</ContentSwitcher>
