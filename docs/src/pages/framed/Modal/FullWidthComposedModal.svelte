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

<Button on:click={() => (open = true)}>View webhook deliveries</Button>

<ComposedModal fullWidth bind:open>
  <ModalHeader label="Webhooks" title="Delivery history" />
  <ModalBody hasScrollingContent>
    <DataTable
      headers={[
        { key: "endpoint", value: "Endpoint" },
        { key: "event", value: "Event" },
        { key: "status", value: "Status" },
      ]}
      rows={[
        {
          id: "1",
          endpoint: "https://hooks.example.com/deploy",
          event: "deployment.succeeded",
          status: "Delivered in 214ms; response 200 OK.",
        },
        {
          id: "2",
          endpoint: "https://hooks.example.com/alerts",
          event: "incident.created",
          status: "Retrying after timeout; next attempt in 5 minutes.",
        },
      ]}
    />
  </ModalBody>
  <ModalFooter
    primaryButtonText="Add endpoint"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
  />
</ComposedModal>
