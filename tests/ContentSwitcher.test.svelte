<script lang="ts">
  import { ContentSwitcher, Switch } from "../types";
  import Bullhorn16 from "carbon-icons-svelte/lib/Bullhorn16";
  import Analytics16 from "carbon-icons-svelte/lib/Analytics16";
</script>

<ContentSwitcher>
  <Switch text="Latest news" />
  <Switch text="Trending" />
</ContentSwitcher>

<ContentSwitcher selectedIndex="{1}">
  <Switch text="Latest news" />
  <Switch text="Trending" />
  <Switch text="Recommended" />
</ContentSwitcher>

<ContentSwitcher light>
  <Switch text="Latest news" />
  <Switch text="Trending" />
</ContentSwitcher>

<ContentSwitcher>
  <Switch>
    <div style="display: flex; align-items: center;">
      <Bullhorn16 style="margin-right: 0.5rem;" />
      Latest news
    </div>
  </Switch>
  <Switch>
    <div style="display: flex; align-items: center;">
      <Analytics16 style="margin-right: 0.5rem;" />
      Trending
    </div>
  </Switch>
</ContentSwitcher>

<Bullhorn16 style="margin-right: 0.5rem;" />

<Analytics16 style="margin-right: 0.5rem;" />

<ContentSwitcher size="xl">
  <Switch text="All" />
  <Switch text="Archived" />
</ContentSwitcher>

<ContentSwitcher size="sm">
  <Switch text="All" />
  <Switch text="Archived" />
</ContentSwitcher>

<ContentSwitcher>
  <Switch disabled text="All" />
  <Switch disabled text="Archived" />
</ContentSwitcher>
