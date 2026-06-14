<script>
  import {
    Button,
    ComposedModal,
    DataTable,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open full-width modal</Button>

<ComposedModal fullWidth bind:open>
  <ModalHeader
    label="An example of a modal with no padding"
    title="Full Width Modal"
  />
  <ModalBody hasScrollingContent>
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
  </ModalBody>
  <ModalFooter
    primaryButtonText="Add"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
  />
</ComposedModal>
