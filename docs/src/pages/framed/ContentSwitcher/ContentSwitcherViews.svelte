<script>
  import { ContentSwitcher, Stack, Switch } from "carbon-components-svelte";

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

  let selectedIndex = 0;
</script>

<Stack gap={5}>
  <ContentSwitcher bind:selectedIndex aria-label="News feed">
    {#each views as view (view.id)}
      <Switch
        id="{view.id}-switch"
        text={view.text}
        aria-controls="{view.id}-panel"
      />
    {/each}
  </ContentSwitcher>

  {#each views as view, i (view.id)}
    <div
      id="{view.id}-panel"
      role="tabpanel"
      aria-labelledby="{view.id}-switch"
      tabindex="0"
      hidden={selectedIndex !== i}
    >
      {view.body}
    </div>
  {/each}
</Stack>
