<script lang="ts">
  import SavingStatus from "carbon-components-svelte/SavingStatus/SavingStatus.svelte";

  let retries = 0;
</script>

<SavingStatus status="error" on:retry={() => (retries += 1)} />
<output data-testid="retries">{retries}</output>
