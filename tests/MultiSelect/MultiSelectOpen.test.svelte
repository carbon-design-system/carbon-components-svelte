<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  export let open = false;
  export let filterable = false;
  export let onOpen: (e: CustomEvent<{ trigger: string }>) => void = () => {};

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<MultiSelect
  {items}
  {filterable}
  bind:open
  labelText="Contact"
  label="Select contact methods"
  on:open={onOpen}
/>
