<script lang="ts">
  import { ButtonSet, Button } from "carbon-components-svelte";

  export let stacked = false;
</script>

<ButtonSet data-testid="button-set" {stacked}>
  <Button kind="secondary">Cancel</Button>
  <Button>Submit</Button>
</ButtonSet>
