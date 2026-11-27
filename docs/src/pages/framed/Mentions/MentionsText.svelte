<script>
  import {
    CodeSnippet,
    Mentions,
    Stack,
    TextArea,
  } from "carbon-components-svelte";

  let ref = null;
  let value = "";
  let mentions = [];

  const people = [
    {
      id: "u-1042",
      text: "Priya Raman",
      secondary: "@praman",
      insertText: "praman",
    },
    {
      id: "u-2290",
      text: "Marcus Oyelaran",
      secondary: "@moyelaran",
      insertText: "moyelaran",
    },
    {
      id: "u-3118",
      text: "Hannah Lindqvist",
      secondary: "@hlindqvist",
      insertText: "hlindqvist",
    },
  ];
</script>

<Stack gap={5}>
  <div>
    <TextArea bind:ref bind:value labelText="Comment" rows={3} />
    <Mentions
      field={ref}
      triggers={[{ char: "@", items: people }]}
      bind:mentions
    />
  </div>
  <CodeSnippet
    type="multi"
    code={JSON.stringify({ value, mentions }, null, 2)}
  />
</Stack>
