<script>
  import {
    ComboBox,
    Dropdown,
    MultiSelect,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";

  const items = [
    "us-east",
    "us-south",
    "eu-de",
    "eu-gb",
    "jp-tok",
    "au-syd",
  ].map((text, i) => ({ id: String(i), text }));
</script>

{#each [
  ["scroll", "overflow: auto; height: 10rem"],
  ["card", "overflow: hidden"],
] as [id, style] (id)}
  <div
    data-testid={id}
    style="{style}; display: flex; align-items: flex-end; gap: 1rem; padding: 1rem; margin: 2rem 1rem; border: 1px solid #c6c6c6"
  >
    {#if id === "scroll"}
      <div style="height: 6rem; flex: 0 0 1px"></div>
    {/if}
    <div style="width: 12rem">
      <Dropdown labelText="Dropdown" selectedId="0" {items} />
    </div>
    <div style="width: 12rem"><ComboBox labelText="ComboBox" {items} /></div>
    <div style="width: 12rem">
      <MultiSelect labelText="MultiSelect" label="Choose" {items} />
    </div>
    <!-- A positioned wrapper, so the box positions the menu and clips it. -->
    <div style="position: relative">
      <OverflowMenu iconDescription="Actions">
        <OverflowMenuItem text="Rename" />
        <OverflowMenuItem text="Delete" />
      </OverflowMenu>
    </div>
  </div>
{/each}

<div data-testid="plain" style="width: 12rem; margin: 2rem 1rem 30rem">
  <Dropdown labelText="Plain" selectedId="0" {items} />
</div>
