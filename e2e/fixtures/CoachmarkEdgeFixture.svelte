<script>
  import { Button, Coachmark, Modal } from "carbon-components-svelte";

  let modalOpen = false;
  let modalClosed = 0;
</script>

<div style="position: fixed; inset-block-start: 8px; inset-inline-start: 8px">
  <Coachmark
    id="cm-start"
    titleText="Top start"
    align="bottom"
    data-testid="cm-start"
  />
</div>
<div style="position: fixed; inset-block-start: 8px; inset-inline-end: 8px">
  <Coachmark
    id="cm-end"
    titleText="Top end"
    align="bottom"
    data-testid="cm-end"
  />
</div>
<div style="position: fixed; inset-block-end: 8px; inset-inline-start: 8px">
  <Coachmark
    id="cm-bottom"
    titleText="Bottom start"
    align="bottom"
    data-testid="cm-bottom"
  >
    A coachmark at the window's bottom edge opens upward.
  </Coachmark>
</div>

<div
  data-testid="clip"
  style="position: absolute; inset-block-start: 160px; inset-inline-start: 40px; width: 160px; height: 56px; overflow: auto; border: 1px solid var(--cds-border-subtle)"
>
  <Coachmark
    id="cm-clip"
    titleText="Clipped"
    align="bottom"
    data-testid="cm-clip"
  >
    A box with overflow would cut this off, so it moves to a portal.
  </Coachmark>
</div>

<Button
  style="position: absolute; inset-block-start: 260px; inset-inline-start: 40px"
  data-testid="open-modal"
  on:click={() => (modalOpen = true)}
>
  Open modal
</Button>
<p
  data-testid="modal-closed"
  style="position: absolute; inset-block-start: 320px"
>
  {modalClosed}
</p>

<Modal
  bind:open={modalOpen}
  modalHeading="Settings"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  on:close={() => modalClosed++}
>
  <Coachmark
    id="cm-modal"
    titleText="In a modal"
    align="bottom-start"
    data-testid="cm-modal"
  >
    The coachmark moves to a portal, and Escape closes it first.
  </Coachmark>
</Modal>
