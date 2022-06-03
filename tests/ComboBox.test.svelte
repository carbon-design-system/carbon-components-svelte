<script lang="ts">
  import { ComboBox } from "../types";
  import type { ComboBoxItem } from "../types/ComboBox/ComboBox.svelte";

  const items: ComboBoxItem[] = [
    { id: 0, text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax", disabled: true },
  ];

  let ref: ComboBox;

  $: ref?.clear({ focus: false });
  $: ref?.clear();
</script>

<ComboBox
  bind:this="{ref}"
  direction="top"
  titleText="Contact"
  placeholder="Select contact method"
  items="{items}"
  on:select="{(e) => {
    console.log(e.detail.selectedId);
  }}"
  translateWithId="{(id) => {
    console.log(id); // "open" | "close"
    return id;
  }}"
  translateWithIdSelection="{(id) => {
    console.log(id); // "clearSelection"
    return id;
  }}"
  let:item
  let:index
>
  {item.id}
  {index}
</ComboBox>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  selectedId="1"
  items="{items}"
/>

<ComboBox
  light
  titleText="Contact"
  placeholder="Select contact method"
  items="{items}"
/>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  size="xl"
  items="{items}"
/>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  size="sm"
  items="{items}"
/>

<ComboBox
  disabled
  titleText="Contact"
  placeholder="Select contact method"
  items="{items}"
/>
