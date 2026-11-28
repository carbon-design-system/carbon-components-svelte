<script lang="ts">
  import ActionSet from "carbon-components-svelte/ActionSet/ActionSet.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";

  export let sticky = true;
  /** A flex parent puts the sentinel inside the set. */
  export let flex = false;

  let stuck = false;
</script>

<div style:display={flex ? "flex" : "block"}>
  <ActionSet {sticky} bind:stuck data-testid="action-set">
    <Button kind="secondary">Cancel</Button>
    <Button>Save</Button>
  </ActionSet>
</div>
<div data-testid="stuck">{stuck}</div>
