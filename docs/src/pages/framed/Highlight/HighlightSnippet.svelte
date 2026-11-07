<script>
  import {
    Highlight,
    matchText,
    Search,
    Stack,
    textSnippet,
  } from "carbon-components-svelte";

  let query = "garden";

  const articles = [
    {
      title: "Planning a kitchen garden",
      body: "Start with a sunny spot that gets six hours of light. A raised bed keeps the soil loose and drains well. Herbs such as basil and chives do well near the door, while tomatoes need room to climb. Water early in the morning, and add compost in spring. A small garden gives more than a large one that is not tended.",
    },
    {
      title: "Winter pruning",
      body: "Prune apple and pear trees while they are dormant. Remove dead wood first, then crossing branches, then thin the crown so light reaches the centre. Never take more than a quarter of the tree in one year. Seal nothing: a clean cut heals best open to the air. Tidy the garden beds beneath at the same time.",
    },
  ];

  $: results = articles.map((article) => {
    const ranges = matchText(article.body, query);
    return {
      title: article.title,
      snippet: textSnippet(article.body, ranges, {
        maxLength: 110,
        context: 20,
      }),
    };
  });
</script>

<Stack gap={5}>
  <Search bind:value={query} labelText="Search articles" />
  {#each results as { title, snippet } (title)}
    <div>
      <strong>{title}</strong>
      <p><Highlight text={snippet.text} ranges={snippet.ranges} /></p>
    </div>
  {/each}
</Stack>
