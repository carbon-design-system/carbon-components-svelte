<script lang="ts">
  import { ColorInput, Modal } from "carbon-components-svelte";

  const swatches = [
    { value: "#da1e28", label: "Red 60" },
    { value: "#24a148", label: "Green 50" },
    { value: "#0f62fe", label: "Blue 60" },
    { value: "#8a3ffc", label: "Purple 60" },
  ];

  let value = "#0f62fe";
  let empty = "";
  let open = false;
  let modalOpen = false;
  let modalValue = "#24a148";
</script>

<div data-testid="field" style="width: 20rem; padding: 1rem">
  <ColorInput
    bind:value
    bind:open
    {swatches}
    labelText="Brand color"
    helperText="Used for links and buttons"
  />
</div>
<span data-testid="value">{value}</span>

<div data-testid="empty" style="width: 20rem; padding: 1rem">
  <ColorInput bind:value={empty} labelText="Accent color" size="sm" />
</div>

<button type="button" on:click={() => (modalOpen = true)}>Open modal</button>
<Modal bind:open={modalOpen} modalHeading="Theme" passiveModal>
  <div data-testid="in-modal">
    <ColorInput bind:value={modalValue} labelText="Surface color" />
  </div>
</Modal>
