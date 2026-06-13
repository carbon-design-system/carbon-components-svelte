<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import type { ComponentProps } from "svelte";

  type TestItem = { id: string; text: string };

  export let items: TestItem[] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
  export let selectedId: ComponentProps<ComboBox>["selectedId"] = undefined;
  export let value = "";
  export let clearFilterOnOpen = false;
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
</script>

<button type="button">Outside</button>
<ComboBox
  {items}
  bind:selectedId
  bind:value
  {clearFilterOnOpen}
  labelText="Contact"
  on:close={onClose}
/>
