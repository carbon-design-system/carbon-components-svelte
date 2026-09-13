<script>
  import { Button, DataTable, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>View database instances</Button>

<Modal
  fullWidth
  bind:open
  modalLabel="Cloudant"
  modalHeading="Database instances"
  primaryButtonText="Add instance"
  secondaryButtonText="Cancel"
  hasScrollingContent
  on:click:button--secondary={() => (open = false)}
>
  <DataTable
    headers={[
      { key: "resource", value: "Resource" },
      { key: "region", value: "Region" },
      { key: "status", value: "Status" },
    ]}
    rows={[
      {
        id: "1",
        resource: "prod-db-01",
        region: "us-south",
        status: "Provisioning replicas across three availability zones to meet the 99.99% SLA.",
      },
      {
        id: "2",
        resource: "staging-db-02",
        region: "eu-de",
        status: "Backup snapshot completed; 30-day retention policy applied.",
      },
    ]}
  />
</Modal>
