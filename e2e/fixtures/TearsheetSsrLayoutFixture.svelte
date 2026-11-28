<script lang="ts">
  import { Button, Tearsheet } from "carbon-components-svelte";
</script>

<!-- Its own page: an open Tearsheet covers the window and takes the
     pointer from anything rendered beside it. -->
<Tearsheet open titleText="Create integration" size="narrow">
  <div data-testid="tearsheet-body" style="height: 120vh">
    A body taller than the window scrolls.
  </div>
  <svelte:fragment slot="actions">
    <Button kind="secondary">Cancel</Button>
    <Button>Next</Button>
  </svelte:fragment>
</Tearsheet>
