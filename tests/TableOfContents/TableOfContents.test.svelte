<script lang="ts">
  import TableOfContents from "carbon-components-svelte/TableOfContents/TableOfContents.svelte";
  import TableOfContentsItem from "carbon-components-svelte/TableOfContents/TableOfContentsItem.svelte";

  export let selectedId: string | undefined = undefined;
  export let noScrollSpy = false;
  export let scrollContainer: HTMLElement | null = null;
  export let scrollOffset = 0;
  export let activationLine = 0;
  export let hrefPrefix = "";
  export let nestedLevel: 1 | 2 | 3 = 2;
  export let onChange: (id: string) => void = () => {};

  $: sections = [
    { id: "overview", text: "Overview", level: 1 as const },
    {
      id: "measures-of-success",
      text: "Measures of success",
      level: 1 as const,
    },
    { id: "key-moments", text: "Key moments", level: nestedLevel },
  ];
</script>

<TableOfContents
  bind:selectedId
  {noScrollSpy}
  {scrollContainer}
  {scrollOffset}
  {activationLine}
  data-testid="toc"
  on:change={(e) => onChange(e.detail)}
>
  {#each sections as section (section.id)}
    <TableOfContentsItem
      href="{hrefPrefix}#{section.id}"
      text={section.text}
      level={section.level}
    />
  {/each}
</TableOfContents>

<button type="button" on:click={() => (scrollOffset = 450)}>Grow header</button>

<div data-testid="selected-id">{selectedId ?? ""}</div>

{#each sections as section (section.id)}
  <section id={section.id}>{section.text}</section>
{/each}
