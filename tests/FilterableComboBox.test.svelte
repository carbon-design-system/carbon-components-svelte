<script lang="ts">
  import { ComboBox } from "../types";

  function shouldFilterItem(item: { text: string }, value?: any) {
    if (!value) return true;
    return item.text.toLowerCase().includes(value.toLowerCase());
  }
</script>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
  shouldFilterItem="{shouldFilterItem}"
/>
