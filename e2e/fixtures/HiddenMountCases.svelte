<script lang="ts">
  // Components that measure themselves after mount, each sized so the
  // measurement matters: a snippet past its row cap, tabs and tags that
  // overflow, a tile that crops, content that scrolls.
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import ScrollGradient from "carbon-components-svelte/ScrollGradient/ScrollGradient.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
  import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";

  const lines = (count: number, text = "line") =>
    Array.from({ length: count }, (_, i) => `${text} ${i + 1}`).join("\n");
  const longLine =
    "function example() { return 'a line long enough to wrap'; }";
  const tabs = Array.from({ length: 10 }, (_, i) => `Tab label ${i + 1}`);
  const regions = [
    "us-south",
    "us-east",
    "eu-de",
    "eu-gb",
    "eu-es",
    "jp-tok",
    "jp-osa",
    "au-syd",
  ];
</script>

<div data-case="code-snippet-short-expanded">
  <CodeSnippet type="multi" code={lines(3)} expanded />
</div>
<div data-case="code-snippet-long">
  <CodeSnippet type="multi" code={lines(20)} />
</div>
<div data-case="code-snippet-wraps-past-cap" style="inline-size: 15rem">
  <CodeSnippet
    type="multi"
    wrapText
    code={Array(12).fill(longLine).join("\n")}
  />
</div>
<div data-case="tabs-overflow" style="inline-size: 20rem">
  <Tabs>
    {#each tabs as label}<Tab {label} />{/each}
  </Tabs>
</div>
<div data-case="tag-set" style="inline-size: 16rem">
  <TagSet>
    {#each regions as region (region)}<Tag type="teal">{region}</Tag>{/each}
  </TagSet>
</div>
<div data-case="expandable-tile">
  <ExpandableTile tileExpandedLabel="Show less" tileCollapsedLabel="Show more">
    <div slot="above" style="block-size: 6rem">Above the fold</div>
    <div slot="below" style="block-size: 6rem">Below the fold</div>
  </ExpandableTile>
</div>
<div data-case="scroll-gradient" style="inline-size: 16rem">
  <ScrollGradient height="6rem">{lines(12)}</ScrollGradient>
</div>
<div data-case="text-area-grow" style="inline-size: 16rem">
  <TextArea labelText="Notes" grow value={lines(8)} />
</div>
