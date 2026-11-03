<script>
  import { Mentions, TextInput } from "carbon-components-svelte";

  let ref = null;
  let value = "";

  const people = [
    { id: "u-1042", text: "Priya Raman", secondary: "@praman" },
    { id: "u-2290", text: "Marcus Oyelaran", secondary: "@moyelaran" },
    { id: "u-3118", text: "Hannah Lindqvist", secondary: "@hlindqvist" },
  ];
</script>

<TextInput
  bind:ref
  bind:value
  labelText="Assign to"
  placeholder="Type @ to search teammates"
/>
<Mentions field={ref} triggers={[{ char: "@", items: people }]} />
