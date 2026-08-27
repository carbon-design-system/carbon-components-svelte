<script>
  import {
    ComboBox,
    Dropdown,
    highlightSegments,
    MultiSelect,
  } from "carbon-components-svelte";

  // Longer than a 320px-wide field can show on one line, so a truncating
  // option would lose the end of it.
  const LONG_LABEL =
    "Chief Accessibility Officer for Regional Operations and Strategic Partnerships";

  // No space, no hyphen, nowhere a word-boundary break could land. Wrapping has
  // to break inside it or the option forces the document to scroll sideways.
  const UNBROKEN_LABEL =
    "Verylongunbrokenidentifierwithnowhereatallforalinebreaktoland";

  const shortItems = [
    { id: "long", text: LONG_LABEL },
    { id: "unbroken", text: UNBROKEN_LABEL },
    { id: "brief", text: "Brief" },
  ];

  // Above the count at which a listbox windows a list by itself, so wrapping
  // and measured offsets have to be right together.
  const longItems = Array.from({ length: 300 }, (_, i) => ({
    id: i,
    text: `Item ${i + 1}: ${LONG_LABEL}`,
  }));

  // The same short list with a "select all" row in front of it. Its label is
  // long too: the row carries its own padding and separator, and both have to
  // survive it taking more than one line.
  const selectAllItems = [
    {
      id: "all",
      text: "Select every one of the roles listed below without exception",
      isSelectAll: true,
    },
    ...shortItems,
  ];

  const contains = (item, value) =>
    item.text.toLowerCase().includes(value.toLowerCase());

  /**
   * Where the typed value occurs in the label, as the character indices
   * `highlightSegments` splits on. Contiguous on purpose: a run long enough to
   * straddle a line break is the case that has to survive wrapping.
   */
  function matchIndices(text, value) {
    if (!value) return [];
    const start = text.toLowerCase().indexOf(value.toLowerCase());
    if (start === -1) return [];
    return Array.from({ length: value.length }, (_, i) => start + i);
  }

  let highlightValue = "";

  // `MultiSelect` sorts its options by label unless told otherwise. These
  // assertions read options by position, so the fields below keep the order
  // the list was declared in — as `Dropdown` and `ComboBox` do — rather than
  // stating the alphabetised order at one remove from the fixture.
  const inInputOrder = () => 0;
</script>

<Dropdown
  labelText="Dropdown short"
  items={shortItems}
  wrapOptions
  portalMenu={false}
/>

<Dropdown
  labelText="Dropdown windowed"
  items={longItems}
  wrapOptions
  portalMenu={false}
/>

<Dropdown
  labelText="Dropdown portaled"
  items={shortItems}
  wrapOptions
  portalMenu
/>

<Dropdown
  fluid
  labelText="Dropdown fluid"
  items={shortItems}
  wrapOptions
  portalMenu={false}
/>

<ComboBox
  labelText="ComboBox short"
  items={shortItems}
  shouldFilterItem={contains}
  wrapOptions
  portalMenu={false}
/>

<ComboBox
  labelText="ComboBox windowed"
  items={longItems}
  shouldFilterItem={contains}
  wrapOptions
  portalMenu={false}
/>

<ComboBox
  labelText="ComboBox portaled"
  items={shortItems}
  shouldFilterItem={contains}
  wrapOptions
  portalMenu
/>

<ComboBox
  fluid
  labelText="ComboBox fluid"
  items={shortItems}
  shouldFilterItem={contains}
  wrapOptions
  portalMenu={false}
/>

<!-- The documented way to show why an option matched: the default slot splits
     the label into matched and unmatched runs and marks the matched ones. A
     wrapped label breaks inside that run, so the mark has to carry across. -->
<ComboBox
  labelText="ComboBox highlighted"
  items={shortItems}
  shouldFilterItem={contains}
  bind:value={highlightValue}
  wrapOptions
  portalMenu={false}
  let:item
>
  {#each highlightSegments(item.text, matchIndices(item.text, highlightValue)) as segment}
    {#if segment.match}
      <mark data-testid="match">{segment.text}</mark>
    {:else}
      {segment.text}
    {/if}
  {/each}
</ComboBox>

<MultiSelect
  sortItem={inInputOrder}
  labelText="MultiSelect short"
  items={shortItems}
  wrapOptions
  portalMenu={false}
/>

<MultiSelect
  filterable
  sortItem={inInputOrder}
  labelText="MultiSelect windowed"
  placeholder="Filter…"
  items={longItems}
  wrapOptions
  portalMenu={false}
/>

<MultiSelect
  sortItem={inInputOrder}
  labelText="MultiSelect portaled"
  items={shortItems}
  wrapOptions
  portalMenu
/>

<MultiSelect
  fluid
  sortItem={inInputOrder}
  labelText="MultiSelect fluid"
  items={shortItems}
  wrapOptions
  portalMenu={false}
/>

<!-- Selection sorts checked options to the top, so checking one moves every
     option to a different position. Wrapping has to survive that rearrangement,
     and the heights held against the old positions have to be dropped. -->
<MultiSelect
  selectionFeedback="top"
  sortItem={inInputOrder}
  labelText="MultiSelect sorted"
  items={shortItems}
  wrapOptions
  portalMenu={false}
/>

<MultiSelect
  sortItem={inInputOrder}
  labelText="MultiSelect select all"
  items={selectAllItems}
  wrapOptions
  portalMenu={false}
/>
