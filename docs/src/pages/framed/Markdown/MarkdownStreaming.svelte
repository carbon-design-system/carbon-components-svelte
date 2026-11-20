<script>
  import { Button, Markdown, Stack } from "carbon-components-svelte";
  import Restart from "carbon-icons-svelte/lib/Restart.svelte";
  import { onMount } from "svelte";

  const reply = `## Why the nightly export is slow

The export reads every row of \`orders\` through **one** connection, so it cannot use the replica's other cores.

- Split the table into ranges of 50,000 ids
- Read each range on its own connection
- Write the files in the \`parquet\` format

\`\`\`sql
SELECT id, total
FROM orders
WHERE id BETWEEN 1 AND 50000;
\`\`\`

With four workers the export should finish in about a quarter of the time.`;

  let source = "";
  let streaming = false;
  let timer;

  // For demo purposes only: stands in for a model's reply arriving in pieces.
  function stream() {
    clearInterval(timer);
    source = "";
    streaming = true;
    timer = setInterval(() => {
      source = reply.slice(0, source.length + 3);
      if (source.length >= reply.length) {
        streaming = false;
        clearInterval(timer);
      }
    }, 30);
  }

  onMount(() => {
    stream();
    return () => clearInterval(timer);
  });
</script>

<Stack gap={5}>
  <Button size="small" kind="tertiary" icon={Restart} on:click={stream}>
    Stream again
  </Button>
  <Markdown {source} {streaming} />
</Stack>
