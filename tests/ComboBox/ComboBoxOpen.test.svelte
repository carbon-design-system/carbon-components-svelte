<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  export let open = false;
  export let onOpen: (e: CustomEvent<{ trigger: string }>) => void = () => {};

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<ComboBox {items} bind:open labelText="Contact" on:open={onOpen} />
