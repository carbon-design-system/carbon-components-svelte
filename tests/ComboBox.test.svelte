<script lang="ts">
  import { ComboBox } from "../types";
</script>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  items="{[{ id: '0', text: 'Slack' }, { id: '1', text: 'Email' }, { id: '2', text: 'Fax' }]}"
/>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  selectedIndex="{1}"
  items="{[{ id: '0', text: 'Slack' }, { id: '1', text: 'Email' }, { id: '2', text: 'Fax' }]}"
/>

<ComboBox
  light
  titleText="Contact"
  placeholder="Select contact method"
  items="{[{ id: '0', text: 'Slack' }, { id: '1', text: 'Email' }, { id: '2', text: 'Fax' }]}"
/>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  size="xl"
  items="{[{ id: '0', text: 'Slack' }, { id: '1', text: 'Email' }, { id: '2', text: 'Fax' }]}"
/>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  size="sm"
  items="{[{ id: '0', text: 'Slack' }, { id: '1', text: 'Email' }, { id: '2', text: 'Fax' }]}"
/>

<ComboBox
  disabled
  titleText="Contact"
  placeholder="Select contact method"
  items="{[{ id: '0', text: 'Slack' }, { id: '1', text: 'Email' }, { id: '2', text: 'Fax' }]}"
/>
