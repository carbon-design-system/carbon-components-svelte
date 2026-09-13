<script>
  import { BigNumber } from "carbon-components-svelte";

  function formatDuration(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
</script>

<BigNumber labelText="Session length" value={134} format={formatDuration} />
