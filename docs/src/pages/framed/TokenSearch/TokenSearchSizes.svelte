<script>
  import { Stack, TokenSearch } from "carbon-components-svelte";

  const keys = [
    { key: "is", type: "enum", values: ["open", "closed"] },
    { key: "label", type: "enum", values: ["bug", "ui"] },
  ];
</script>

<Stack gap={5}>
  {#each ["sm", "lg", "xl"] as size}
    <TokenSearch
      {size}
      {keys}
      value='is:open -label:bug nope:1 "exact phrase"'
      labelText="Size {size}"
    />
  {/each}
  <TokenSearch
    {keys}
    highlight={false}
    value="is:open label:bug"
    labelText="No highlight"
    helperText="highlight={false}: the field is a plain Search"
  />
</Stack>
