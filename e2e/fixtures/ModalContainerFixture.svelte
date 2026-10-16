<script>
  import { Modal } from "carbon-components-svelte";
</script>

<!-- Modals inside boxes that hold fixed elements (`contain: layout`), each
     narrower than the window: under md, in md, in lg. -->
{#each [600, 800, 1100] as width}
  <div
    data-testid="box-{width}"
    style="position: relative; contain: layout; width: {width}px; height: 500px; margin-bottom: 1rem;"
  >
    <Modal open modalHeading="In {width}px" primaryButtonText="Save">
      <p>Content</p>
    </Modal>
  </div>
{/each}
<div
  data-testid="box-sm"
  style="position: relative; contain: layout; width: 600px; height: 500px; margin-bottom: 1rem;"
>
  <Modal open size="sm" modalHeading="Small in 600px" primaryButtonText="Save">
    <p>Content</p>
  </Modal>
</div>
<div data-testid="window">
  <Modal open size="xs" modalHeading="In the window" primaryButtonText="Save">
    <p>Content</p>
  </Modal>
</div>
