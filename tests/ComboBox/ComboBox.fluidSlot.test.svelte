<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];

  export let fluid = true;
</script>

<ComboBox
  {fluid}
  {items}
  labelText="Default label"
  placeholder="Select contact method"
>
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
</ComboBox>
