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

<!-- A row that sizes to its content, like an inline pair of actions. -->
<div style:display="flex">
  <div style:flex="none" data-testid="button-set-fit">
    <ButtonSet>
      <Button kind="secondary" size="small">Reject</Button>
      <Button size="small">Approve</Button>
    </ButtonSet>
  </div>
</div>
