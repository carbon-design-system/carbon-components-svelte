<script lang="ts">
  import { Dropdown, Modal, TextInput } from "carbon-components-svelte";

  export let open = false;
</script>

<Modal
  bind:open
  modalHeading="A11y issue"
  primaryButtonText="OK"
  secondaryButtonText="Cancel"
  hasScrollingContent={true}
  on:open
  on:close
>
  <Dropdown
    labelText="Select source"
    selectedId="0"
    items={[
      { id: "0", text: "First item" },
      { id: "1", text: "Second item" },
    ]}
  />
  <TextInput
    placeholder="text"
    name="text"
    labelText="Login"
  />
  <TextInput
    placeholder="password"
    type="password"
    labelText="Password"
  />
</Modal>
