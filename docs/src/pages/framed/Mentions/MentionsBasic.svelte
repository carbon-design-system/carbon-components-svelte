<script>
  import { Mentions, TextArea } from "carbon-components-svelte";

  let ref = null;
  let value = "";

  const people = [
    { id: "u-1042", text: "Priya Raman", secondary: "@praman" },
    { id: "u-2290", text: "Marcus Oyelaran", secondary: "@moyelaran" },
    { id: "u-3118", text: "Hannah Lindqvist", secondary: "@hlindqvist" },
    { id: "u-4501", text: "Tomás Herrera", secondary: "@therrera" },
    { id: "u-5873", text: "Wei Zhang", secondary: "@wzhang" },
  ];
</script>

<TextArea
  bind:ref
  bind:value
  labelText="Comment"
  helperText="Type @ to mention a teammate"
  placeholder="Add a comment..."
/>
<Mentions field={ref} triggers={[{ char: "@", items: people }]} />
