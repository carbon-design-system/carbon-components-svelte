<script>
  import {
    ContentSwitcher,
    queryParam,
    Stack,
    Switch,
  } from "carbon-components-svelte";

  const views = [
    {
      id: "news",
      text: "Latest news",
      body: "Headlines from the last 24 hours.",
    },
    {
      id: "trending",
      text: "Trending",
      body: "Stories with the most reads this week.",
    },
    {
      id: "recommended",
      text: "Recommended",
      body: "Picked from your reading history.",
    },
  ];

  const selectedView = queryParam("view", {
    defaultValue: views[0].id,
    parse: (id) => (views.some((view) => view.id === id) ? id : undefined),
    // docs-only:start
    // Opt out of this docs site's router, which intercepts history calls.
    replace: (href) =>
      history.replaceState({ ...history.state, useRoutify: false }, "", href),
    // docs-only:end
  });
</script>

<Stack gap={5}>
  <ContentSwitcher bind:selectedId={$selectedView} aria-label="News feed">
    {#each views as view (view.id)}
      <Switch id={view.id} text={view.text} aria-controls="{view.id}-panel" />
    {/each}
  </ContentSwitcher>

  {#each views as view (view.id)}
    <div
      id="{view.id}-panel"
      role="tabpanel"
      aria-labelledby={view.id}
      tabindex="0"
      hidden={$selectedView !== view.id}
    >
      {view.body}
    </div>
  {/each}
</Stack>
