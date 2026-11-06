<script lang="ts">
  import IndexedList from "carbon-components-svelte/IndexedList/IndexedList.svelte";
  import type { ComponentProps } from "svelte";

  type Contact = { id: number; name: string };

  export let items: Contact[] = [
    { id: 1, name: "Ärlig" },
    { id: 2, name: "Anna" },
    { id: 3, name: "Zoe" },
    { id: 4, name: "Östen" },
    { id: 5, name: "3 Musketeers" },
    { id: 6, name: "Maja" },
  ];
  export let locale = "sv";
  export let rest: Partial<ComponentProps<IndexedList<Contact>>> &
    Record<string, unknown> = {};

  let list: IndexedList<Contact>;
</script>

<button
  type="button"
  on:click={() => list.scrollToSection("M", { focus: true })}>go to M</button
>
<button type="button" on:click={() => list.scrollToSection("B")}>go to B</button
>

<IndexedList
  bind:this={list}
  {items}
  {locale}
  itemToString={(item) => item.name}
  itemHeight={40}
  headerHeight={24}
  height={200}
  {...rest}
  let:item
  let:section
>
  <span data-testid="row">{item.name}</span>
  <span class="section">{section}</span>
  <svelte:fragment slot="header" let:section let:count>
    {section} ({count})
  </svelte:fragment>
  <svelte:fragment slot="empty">No contacts</svelte:fragment>
</IndexedList>
