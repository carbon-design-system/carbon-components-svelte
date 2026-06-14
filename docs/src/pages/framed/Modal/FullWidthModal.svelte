<script>
  import { Button, DataTable, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open full-width modal</Button>

<Modal
  fullWidth
  bind:open
  modalLabel="An example of a modal with no padding"
  modalHeading="Full Width Modal"
  primaryButtonText="Add"
  secondaryButtonText="Cancel"
  hasScrollingContent
  on:click:button--secondary={() => (open = false)}
>
  <DataTable
    headers={[
      { key: "a", value: "Column A" },
      { key: "b", value: "Column B" },
      { key: "c", value: "Column C" },
    ]}
    rows={[
      {
        id: "1",
        a: "Row 1",
        b: "Row 1",
        c: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      },
      {
        id: "2",
        a: "Row 2",
        b: "Row 2",
        c: "Nunc dui magna, finibus id tortor sed, aliquet bibendum augue.",
      },
    ]}
  />
</Modal>
