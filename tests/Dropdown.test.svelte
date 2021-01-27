<script lang="ts">
  import { Dropdown, DropdownSkeleton } from "../types";
</script>

<Dropdown
  titleText="Contact"
  selectedIndex="{0}"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Dropdown
  itemToString="{(item) => {
    return item.text + ' (' + item.id + ')';
  }}"
  titleText="Contact"
  selectedIndex="{0}"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Dropdown
  light
  titleText="Contact"
  selectedIndex="{0}"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Dropdown
  type="inline"
  titleText="Contact"
  selectedIndex="{0}"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Dropdown
  size="xl"
  titleText="Contact"
  selectedIndex="{0}"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Dropdown
  size="sm"
  titleText="Contact"
  selectedIndex="{0}"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Dropdown
  disabled
  titleText="Contact"
  selectedIndex="{0}"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<DropdownSkeleton />
