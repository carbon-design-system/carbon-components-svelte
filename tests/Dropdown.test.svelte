<script lang="ts">
  import { Dropdown, DropdownSkeleton } from "../types";
  import type { DropdownProps } from "../types/Dropdown/Dropdown.svelte";

  let items: DropdownProps["items"] = [
    { id: 0, text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ] as const;

  let itemsWithoutConst = [...items];

  type FieldId = typeof items[number]["id"]; // 'foo' | 'bar' | 'baz'

  export const fieldId: FieldId = "bar";

  // @ts-expect-error
  $: items[0] = { id: "0", text: "Slack" };
  $: {
    // @ts-expect-error
    items[0] = { id: "0", text: "Slack" };
  }
  $: {
    items = [...items, { id: "3", text: "Email" }];
    items = items.map((item, index) => {
      if (index === 0) {
        return { id: "0", text: "Slack" };
      }
      return item;
    });
  }
</script>

<Dropdown
  direction="top"
  titleText="Contact"
  selectedId="0"
  items="{items}"
  on:select="{(e) => {
    console.log(e.detail.selectedId);
  }}"
  translateWithId="{(id) => {
    console.log(id); // "open" | "close"
    return id;
  }}"
  let:item
  let:index
>
  {item.id}
  {index}
</Dropdown>

<Dropdown
  itemToString="{(item) => {
    return item.text + ' (' + item.id + ')';
  }}"
  titleText="Contact"
  selectedId="0"
  items="{itemsWithoutConst}"
/>

<Dropdown
  light
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Dropdown
  type="inline"
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Dropdown
  size="xl"
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Dropdown
  size="sm"
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Dropdown
  disabled
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<DropdownSkeleton />
