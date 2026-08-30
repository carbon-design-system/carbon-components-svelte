<svelte:options accessors />

<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ButtonSet from "carbon-components-svelte/Button/ButtonSet.svelte";
  import type { ComponentProps } from "svelte";

  export let stacked = false;
  export let ref: ComponentProps<ButtonSet>["ref"] = null;
</script>

<ButtonSet data-testid="button-set" {stacked} bind:ref>
  <Button kind="secondary">Cancel</Button>
  <Button>Submit</Button>
</ButtonSet>
