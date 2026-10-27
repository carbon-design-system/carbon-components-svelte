<script lang="ts">
  import Coachmark from "../../src/Coachmark/Coachmark.svelte";
</script>

<Coachmark id="cm" title="Filters">
  <button
    slot="target"
    type="button"
    let:triggerProps
    let:toggle
    {...triggerProps}
    on:click={toggle}
  >
    Filter
  </button>
  Filter by owner or status.
</Coachmark>
