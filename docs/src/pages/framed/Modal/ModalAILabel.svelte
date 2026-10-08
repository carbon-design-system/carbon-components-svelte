<script>
  import { AILabel, Button, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Review forecast</Button>

<Modal
  bind:open
  modalHeading="Usage forecast"
  primaryButtonText="Apply budget"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
  on:submit={() => (open = false)}
>
  <AILabel slot="decorator">
    <p>Generated from 90 days of billing data across your workspace.</p>
  </AILabel>
  <p>
    Spend is projected to grow 12% next month. Raise the monthly budget to
    $4,800 to avoid overage alerts.
  </p>
</Modal>
