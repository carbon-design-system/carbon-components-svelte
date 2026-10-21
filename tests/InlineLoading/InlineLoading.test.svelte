<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";

  export let onSuccess: () => void = () => {};
  export let onCustomDelaySuccess: () => void = () => {};
</script>

<div data-testid="loader-with-description">
  <InlineLoading description="Loading metrics..." />
</div>

<div data-testid="loader-active">
  <InlineLoading status="active" description="Submitting..." />
</div>

<div data-testid="loader-inactive">
  <InlineLoading status="inactive" description="Cancelling..." />
</div>

<div data-testid="loader-finished">
  <InlineLoading
    status="finished"
    description="Success"
    on:success={onSuccess}
  />
</div>

<div data-testid="loader-custom-success-delay">
  <InlineLoading
    status="finished"
    description="Processing..."
    successDelay={500}
    on:success={onCustomDelaySuccess}
  />
</div>

<div data-testid="loader-error">
  <InlineLoading status="error" description="An error occurred" />
</div>

<!-- Inline loading with an overridden role passed through rest props -->
<div data-testid="loader-role-override">
  <InlineLoading status="active" description="Submitting..." role="none" />
</div>

<div data-testid="loader-custom-icon">
  <InlineLoading
    status="finished"
    description="Complete"
    iconDescription="Operation completed successfully"
  />
</div>

<div data-testid="loader-active-icon">
  <InlineLoading status="active" iconDescription="Saving data" />
</div>
