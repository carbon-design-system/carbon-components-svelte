<script>
  import {
    ActivityComposer,
    CodeSnippet,
    Stack,
  } from "carbon-components-svelte";

  const people = [
    { id: "grace", text: "Grace Lindqvist", secondary: "SRE" },
    { id: "marcus", text: "Marcus Oyelaran", secondary: "Platform" },
    { id: "priya", text: "Priya Raman", secondary: "Security" },
  ];

  let value = "";
  let sent = "";
</script>

<Stack gap={5}>
  <ActivityComposer
    bind:value
    mentionItems={people}
    draftKey="docs-activity-composer"
    on:submit={(event) => (sent = event.detail.body)}
  />
  <CodeSnippet type="multi" code={sent || "Nothing sent yet"} />
</Stack>
