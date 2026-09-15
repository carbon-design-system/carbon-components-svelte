<script>
  import { Button, ButtonSet } from "carbon-components-svelte";
</script>

<div style:width="300px" data-testid="button-set-narrow">
  <ButtonSet>
    <Button kind="secondary">Cancel</Button>
    <Button>Acknowledge incident</Button>
  </ButtonSet>
</div>

<div style:width="800px" data-testid="button-set-wide">
  <ButtonSet>
    <Button kind="secondary">Cancel</Button>
    <Button>Acknowledge incident</Button>
  </ButtonSet>
</div>
