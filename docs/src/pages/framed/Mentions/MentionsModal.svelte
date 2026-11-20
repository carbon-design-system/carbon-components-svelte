<script>
  import { Button, Mentions, Modal, TextArea } from "carbon-components-svelte";

  let open = false;
  let ref = null;
  let value = "";

  const people = [
    { id: "u-1042", text: "Priya Raman", secondary: "@praman" },
    { id: "u-2290", text: "Marcus Oyelaran", secondary: "@moyelaran" },
    { id: "u-3118", text: "Hannah Lindqvist", secondary: "@hlindqvist" },
  ];
</script>

<Button on:click={() => (open = true)}>Reply to thread</Button>

<Modal
  bind:open
  size="sm"
  modalHeading="Reply to thread"
  primaryButtonText="Send"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
  on:submit={() => (open = false)}
>
  <TextArea bind:ref bind:value labelText="Message" rows={4} />
  <Mentions field={ref} triggers={[{ char: "@", items: people }]} />
</Modal>
