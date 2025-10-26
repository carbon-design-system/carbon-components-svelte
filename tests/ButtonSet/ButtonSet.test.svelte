<script lang="ts">
  import { Button, ButtonSet } from "carbon-components-svelte";

  export let stacked = false;
</script>

<ButtonSet data-testid="button-set" {stacked}>
  <Button kind="secondary">Cancel</Button>
  <Button>Submit</Button>
</ButtonSet>
