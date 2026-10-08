<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";

  export let open = false;
  export let onOpen: (e: CustomEvent<{ trigger: string }>) => void = () => {};

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<Dropdown {items} bind:open labelText="Contact" on:open={onOpen} />
