<script>
  import { ActionSet, Button, Layer } from "carbon-components-svelte";
</script>

<div class="bx--modal-footer" data-testid="plain-footer">
  <Button kind="secondary">Cancel</Button>
  <Button>Save</Button>
</div>

<div class="bx--modal-footer" data-testid="action-set-footer">
  <ActionSet size="lg">
    <Button kind="secondary">Cancel</Button>
    <Button>Save</Button>
  </ActionSet>
</div>

<div data-testid="page">
  <ActionSet size="lg">
    <Button kind="ghost">Learn more</Button>
    <Button>Save</Button>
  </ActionSet>
</div>

<Layer withBackground data-testid="layer">
  <ActionSet size="lg">
    <Button kind="ghost">Learn more</Button>
    <Button>Save</Button>
  </ActionSet>
</Layer>
