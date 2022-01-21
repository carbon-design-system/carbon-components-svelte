<script lang="ts">
  import { Dropdown, DropdownSkeleton } from "../types";
</script>

<Dropdown
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
/>

<Dropdown
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
