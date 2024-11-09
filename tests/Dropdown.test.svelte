<script lang="ts">
  import { Dropdown, DropdownSkeleton } from "carbon-components-svelte";
  import type { DropdownProps } from "carbon-components-svelte/Dropdown/Dropdown.svelte";

  let items = [
    { id: 0, text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ] satisfies NonNullable<DropdownProps["items"]>;

  let itemsWithoutConst = [...items];

  type FieldId = typeof items[number]["id"]; // 'foo' | 'bar' | 'baz'

  export const fieldId: FieldId = "bar";

  $: items[0] = { id: "0", text: "Slack" };
  $: {
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
