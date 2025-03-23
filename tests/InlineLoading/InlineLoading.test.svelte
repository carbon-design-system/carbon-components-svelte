<script lang="ts">
import { InlineLoading } from "carbon-components-svelte";
</script>

<!-- Default inline loading -->
<div data-testid="default-loader">
  <InlineLoading />
</div>

<!-- Inline loading with description -->
<div data-testid="loader-with-description">
  <InlineLoading description="Loading metrics..." />
</div>

<!-- Inline loading with different states -->
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
    on:success={() => {
      console.log("success");
    }}
  />
</div>

<!-- Inline loading with custom success delay -->
<div data-testid="loader-custom-success-delay">
  <InlineLoading
    status="finished"
    description="Processing..."
    successDelay={500}
    on:success={() => {
      console.log("success custom delay");
    }}
  />
</div>

<div data-testid="loader-error">
  <InlineLoading status="error" description="An error occurred" />
</div>

<!-- Inline loading with custom icon description -->
<div data-testid="loader-custom-icon">
  <InlineLoading
    status="finished"
    description="Complete"
    iconDescription="Operation completed successfully"
  />
</div>
