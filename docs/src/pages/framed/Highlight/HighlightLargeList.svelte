<script>
  import {
    Highlight,
    highlightText,
    Search,
    Stack,
    supportsHighlightApi,
    Toggle,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let query = "net";
  let supported = false;
  let paint = false;

  const words = ["network", "bucket", "queue", "stream", "index", "cluster"];
  const rows = Array.from(
    { length: 2000 },
    (_, i) => `${words[i % words.length]}-${i + 1}`,
  );

  // The server and an older browser have no API: each row marks its own match.
  onMount(() => {
    supported = supportsHighlightApi();
    paint = supported;
  });
</script>

<Stack gap={5}>
  <Search bind:value={query} labelText="Filter 2,000 rows" />
  <Toggle
    labelText="Paint with the CSS Custom Highlight API"
    disabled={!supported}
    bind:toggled={paint}
  />
  <div use:highlightText={{ query: paint ? query : "" }}>
    {#each rows as row (row)}
      <div>
        {#if paint}{row}{:else}<Highlight text={row} {query} />{/if}
      </div>
    {/each}
  </div>
</Stack>
