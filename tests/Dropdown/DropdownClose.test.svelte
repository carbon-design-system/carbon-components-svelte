<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Dropdown from "../../src/Dropdown/Dropdown.svelte";

  export let items: ComponentProps<Dropdown>["items"] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
  export let selectedId: ComponentProps<Dropdown>["selectedId"] = "0";
  export let open: ComponentProps<Dropdown>["open"] = false;
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
</script>

<Dropdown
  {items}
  bind:selectedId
  bind:open
  labelText="Contact"
  on:close={onClose}
/>
