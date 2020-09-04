<script>
  import { ToggleSmall } from "../ToggleSmall";
  import { Button } from "../Button";
  import ComboBox from "./ComboBox.svelte";

  let items = [
    { id: "option-0", text: "Option 1" },
    { id: "option-1", text: "Option 2" },
    { id: "option-2", text: "Option 3" },
    { id: "option-3", text: "Option 4" },
    {
      id: "option-4",
      text:
        "An example option that is really long to show what should be done to handle long text",
    },
  ];

  $: toggled = false;
  $: value = undefined;
  $: selectedIndex = -1;
  $: ref = null;
  $: ref && ref.focus();

  function shouldFilterItem(item, value) {
    if (!toggled || !value) {
      return true;
    }

    return item.text.toLowerCase().includes(value.toLowerCase());
  }
</script>

<p>
  <code>items</code> must be an array of objects; mandatory fields are `id` and `text`.
</p>
<pre
  style="margin-top: 1rem;">
  <code>{'items = Array<{ id: string; text: string; }>'}</code>
</pre>
<div style="margin-top: 2rem;">
  <ToggleSmall
    labelText="Enable filtering"
    bind:toggled
    style="margin-top: 1rem;" />
  <Button
    size="small"
    on:click="{() => {
      selectedIndex = 1;
    }}"
    style="margin-top: 1rem;">
    Set item to "Option 2"
  </Button>
</div>
<div style="width: 300px; margin-top: 2rem;">
  <ComboBox
    {...$$props}
    id="combobox"
    bind:ref
    bind:value
    bind:selectedIndex
    on:select="{({ detail }) => {
      console.log('on:select', detail);
    }}"
    on:clear="{() => {
      console.log('on:clear');
    }}"
    items="{items}"
    shouldFilterItem="{shouldFilterItem}" />
</div>
