<script lang="ts">
  import Popover from "carbon-components-svelte/Popover/Popover.svelte";

  export let open = false;
</script>

<div>
  <button type="button" on:click={() => (open = !open)}>Toggle</button>
  <Popover bind:open closeOnEscape>
    <button type="button">Inside</button>
  </Popover>
</div>
