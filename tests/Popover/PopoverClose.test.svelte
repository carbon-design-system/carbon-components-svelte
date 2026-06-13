<script lang="ts">
  import Popover from "../../src/Popover/Popover.svelte";

  export let open = false;
  export let closeOnOutsideClick = false;
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
</script>

<div data-testid="parent">
  Parent
  <Popover bind:open {closeOnOutsideClick} on:close={onClose}>
    <div data-testid="content">Content</div>
  </Popover>
</div>
