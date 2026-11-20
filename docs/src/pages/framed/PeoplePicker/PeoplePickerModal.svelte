<script>
  import { Button, Modal, PeoplePicker } from "carbon-components-svelte";

  const people = [
    { id: "u-1042", name: "Priya Raman", email: "priya.raman@example.com" },
    { id: "u-2290", name: "Marcus Oyelaran", email: "marcus@example.com" },
    { id: "u-3118", name: "Hannah Lindqvist", email: "hannah@example.com" },
  ];

  let open = false;
  let value = [];
</script>

<Button on:click={() => (open = true)}>Invite people</Button>

<Modal
  bind:open
  size="sm"
  modalHeading="Invite people"
  primaryButtonText="Invite"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
  on:submit={() => (open = false)}
>
  <PeoplePicker
    bind:value
    items={people}
    allowEmail
    labelText="People"
    helperText="Escape closes the results first, then the modal"
  />
</Modal>
