<script>
  import { Stack, TokenSearch } from "carbon-components-svelte";

  const keys = [
    { key: "is", type: "enum", values: ["open", "closed", "draft"] },
    { key: "label", type: "enum", values: ["bug", "ui", "docs"] },
    { key: "author", type: "user", values: [{ value: "@me", label: "Me" }] },
  ];

  let value = "";
  let recentQueries = ["is:open label:bug", "author:@me is:draft"];

  // Newest first, without a repeat.
  function remember(text) {
    if (!text) return;
    recentQueries = [text, ...recentQueries.filter((q) => q !== text)].slice(
      0,
      5,
    );
  }
</script>

<Stack gap={5}>
  <TokenSearch
    bind:value
    {keys}
    {recentQueries}
    labelText="Search issues"
    helperText="Focus the empty field for recent searches. Press Enter to add one."
    on:search={(event) => remember(event.detail)}
  />
  <ol>
    {#each recentQueries as recent}
      <li><code>{recent}</code></li>
    {/each}
  </ol>
</Stack>
