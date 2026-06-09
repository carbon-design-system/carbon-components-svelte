<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ButtonSet from "carbon-components-svelte/Button/ButtonSet.svelte";

  export let stacked = false;
</script>

<ButtonSet data-testid="button-set" {stacked}>
  <Button kind="secondary">Cancel</Button>
  <Button>Submit</Button>
</ButtonSet>
