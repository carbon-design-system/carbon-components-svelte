<script lang="ts">
  import { AutoComplete, AutoCompleteSkeleton } from "../types";
</script>

<AutoComplete
  direction="top"
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: 0, text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
  on:select="{(e) => {
    console.log(e.detail.selectedId);
  }}"
  let:item
  let:index
>
  {item.id}
  {index}
</AutoComplete>

<AutoComplete
  itemToString="{(item) => {
    return item.text + ' (' + item.id + ')';
  }}"
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<AutoComplete
  light
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<AutoComplete
  type="inline"
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<AutoComplete
  size="xl"
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<AutoComplete
  size="sm"
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<AutoComplete
  disabled
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<AutoCompleteSkeleton />
