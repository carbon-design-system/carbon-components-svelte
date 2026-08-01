<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  type Item = { id: string; text: string };

  export let items: Item[] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
  export let value = "";
  export let selectedId: string | undefined = undefined;
  export let allowCustomValue = true;
  export let createOptionText:
    | string
    | ((query: string) => string)
    | undefined = undefined;
  export let appendOnCreate = false;
  export let onCreate: (e: CustomEvent<string>) => void = () => {};

  function handleCreate(event: CustomEvent<string>) {
    onCreate(event);
    if (appendOnCreate) {
      const text = event.detail;
      items = [...items, { id: text, text }];
      value = text;
      selectedId = text;
    }
  }
</script>

<ComboBox
  {items}
  bind:value
  bind:selectedId
  {allowCustomValue}
  {createOptionText}
  labelText="Contact"
  placeholder="Select contact method"
  shouldFilterItem={(item, query) =>
    !query || item.text.toLowerCase().includes(query.toLowerCase())}
  on:create={handleCreate}
/>
