<script>
  import { TabsV2, Button } from "carbon-components-svelte";
  import Add16 from "carbon-icons-svelte/lib/Add16";
  import { tick } from "svelte";

  const initialItems = [
    { id: "id" + 0, label: "Tab 1" },
    { id: "id" + 1, label: "Tab 2", disabled: true },
    { id: "id" + 3, label: "Tab 3" },
  ];

  const differentItems = [
    { id: "id" + -1, label: "Diff Tab 0" },
    { id: "id" + 0, label: "Diff Tab 1" },
    { id: "id" + 1, label: "Diff Tab 2" },
    { id: "id" + 3, label: "Diff Tab 3" },
    { id: "id" + 4, label: "Diff Tab 4" },
  ];

  let selectedIndex;
  let selectedId;
  let items = initialItems;
</script>

<div><strong>selectedIndex:</strong> {selectedIndex}</div>

<div><strong>selectedId:</strong> {selectedId}</div>

<Button
  on:click="{async () => {
    items = differentItems;
    tick().then(() => {
      selectedId = 'id4';
    });
  }}"
>
  Update items
</Button>

<Button
  on:click="{() => {
    items = initialItems;
  }}"
>
  Reset
</Button>

<Button
  on:click="{() => {
    selectedIndex = 1;
  }}"
>
  Update selectedIndex
</Button>

<Button
  on:click="{() => {
    selectedId = 'id3';
  }}"
>
  Update selectedId
</Button>

<TabsV2
  bind:selectedId
  bind:selectedIndex
  items="{items}"
  let:item
  let:id
  let:index
  on:change="{(e) => {
    console.log('change', e.detail);
  }}"
>
  <span slot="tab" style="{!item.disabled && 'color: blue'}">
    {#if index === 1}
      <Add16 />
    {/if}
    {item.label}
  </span>
  {#if selectedIndex === 0}Tab content {id} {index}{/if}
  {#if selectedIndex === 1}Tab content {id} {index}{/if}
  {#if selectedIndex === 2}Tab content {id} {index}{/if}
  {#if selectedIndex === 3}Tab content {id} {index}{/if}
  {#if selectedIndex === 4}Tab content {id} {index}{/if}
</TabsV2>
