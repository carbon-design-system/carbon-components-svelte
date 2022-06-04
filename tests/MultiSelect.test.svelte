<script lang="ts">
  import { MultiSelect } from "../types";
  import type { MultiSelectProps } from "../types/MultiSelect/MultiSelect.svelte";

  let selectedIds: MultiSelectProps["selectedIds"] = [0];

  $: {
    // @ts-expect-error
    selectedIds[0] = [0];
  }
</script>

<MultiSelect
  direction="top"
  titleText="Contact"
  label="Select contact methods..."
  hideLabel
  bind:selectedIds
  items="{[
    { id: 0, text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax', disabled: true },
  ]}"
  on:select="{(e) => {
    console.log(e.detail.selectedIds);
    console.log(e.detail.selected);
    console.log(e.detail.unselected);
  }}"
  on:blur="{(e) => {
    e.detail; // number | FocusEvent
  }}"
  on:paste
  translateWithId="{(id) => {
    console.log(id); // "open" | "close"
    return id;
  }}"
  translateWithIdSelection="{(id) => {
    console.log(id); // "clearAll" | "clearSelection"
    return id;
  }}"
  let:item
  let:index
>
  {item.id}
  {index}
</MultiSelect>

<MultiSelect
  titleText="Contact"
  label="Select contact methods..."
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
  sortItem="{() => {}}"
/>

<MultiSelect
  selectedIds="{['0', '1']}"
  titleText="Contact"
  label="Select contact methods..."
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<MultiSelect
  itemToString="{(item) => {
    return item.text + ' (' + item.id + ')';
  }}"
  titleText="Contact"
  label="Select contact methods..."
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
  sortItem="{() => {}}"
/>

<MultiSelect
  light
  titleText="Contact"
  label="Select contact methods..."
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<MultiSelect
  type="inline"
  titleText="Contact"
  label="Select contact methods..."
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<MultiSelect
  size="xl"
  titleText="Contact"
  label="Select contact methods..."
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<MultiSelect
  size="sm"
  titleText="Contact"
  label="Select contact methods..."
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<MultiSelect
  filterable
  titleText="Contact"
  placeholder="Filter contact methods..."
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>
