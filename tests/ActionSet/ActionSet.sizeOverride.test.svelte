<script lang="ts">
  import ActionSet from "carbon-components-svelte/ActionSet/ActionSet.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";

  export let size: "sm" | "md" | "lg" | "xl" | "2xl" = "sm";
</script>

<ActionSet data-testid="action-set" {size}>
  <Button kind="secondary">Cancel</Button>
  <Button size="field">Save</Button>
</ActionSet>
