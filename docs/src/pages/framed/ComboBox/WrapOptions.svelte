<script>
  import { ComboBox, highlightSegments, Stack } from "carbon-components-svelte";

  const roles = [
    "Chief Accessibility Officer for Regional Operations and Strategic Partnerships",
    "Deputy Director of Interdepartmental Communications and Outreach",
  ];

  const items = [
    { id: "0", text: roles[0] },
    { id: "1", text: roles[1] },
    { id: "2", text: "Analyst" },
  ];

  // Past the count at which a list is windowed, so only the options on screen
  // are rendered. `wrapOptions` turns on measured row heights by itself, so
  // offsets follow the heights the wrapped options actually take.
  const manyItems = Array.from({ length: 300 }, (_, i) => ({
    id: String(i),
    text: `${i + 1}. ${roles[i % 2]}`,
  }));

  let truncatedValue = "";
  let wrappedValue = "";
  let windowedValue = "";

  const shouldFilterItem = (item, value) =>
    item.text.toLowerCase().includes(value.toLowerCase());

  // Where the typed value occurs in the label, as the character indices
  // `highlightSegments` splits on.
  function matchIndices(text, value) {
    const start = value ? text.toLowerCase().indexOf(value.toLowerCase()) : -1;
    if (start === -1) return [];
    return Array.from({ length: value.length }, (_, i) => start + i);
  }
</script>

<Stack gap={6} style="max-width: 20rem;">
  <ComboBox
    labelText="Truncated (default)"
    placeholder="Try typing 'operations'"
    bind:value={truncatedValue}
    {shouldFilterItem}
    {items}
    let:item
  >
    {#each highlightSegments(item.text, matchIndices(item.text, truncatedValue)) as segment}
      {#if segment.match}
        <mark>{segment.text}</mark>
      {:else}
        {segment.text}
      {/if}
    {/each}
  </ComboBox>

  <ComboBox
    wrapOptions
    labelText="Wrapped"
    placeholder="Try typing 'operations'"
    bind:value={wrappedValue}
    {shouldFilterItem}
    {items}
    let:item
  >
    {#each highlightSegments(item.text, matchIndices(item.text, wrappedValue)) as segment}
      {#if segment.match}
        <mark>{segment.text}</mark>
      {:else}
        {segment.text}
      {/if}
    {/each}
  </ComboBox>

  <ComboBox
    wrapOptions
    labelText="Wrapped (windowed, 300 items)"
    placeholder="Try typing 'operations'"
    bind:value={windowedValue}
    {shouldFilterItem}
    items={manyItems}
  />
</Stack>
