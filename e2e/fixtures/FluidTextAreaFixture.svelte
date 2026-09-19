<script>
  import { FluidForm, Modal, TextArea } from "carbon-components-svelte";
</script>

<div data-testid="fluid-text-area-neutral">
  <TextArea fluid labelText="Comment" value="Some text" />
</div>

<div data-testid="fluid-text-area-invalid">
  <TextArea
    fluid
    labelText="Comment"
    value="Some text"
    invalid
    invalidText="This field is required"
  />
</div>

<div data-testid="fluid-text-area-warning">
  <TextArea
    fluid
    labelText="Comment"
    value="Some text"
    warn
    warnText="This entry may be incorrect"
  />
</div>

<FluidForm>
  <div data-testid="fluid-text-area-in-fluid-form">
    <TextArea
      fluid
      labelText="Comment"
      value="Some text"
      warn
      warnText="This entry may be incorrect"
    />
  </div>
</FluidForm>

<Modal open passiveModal modalHeading="Fluid text area in modal">
  <div data-testid="fluid-text-area-in-modal">
    <TextArea
      fluid
      labelText="Comment"
      value="Some text"
      invalid
      invalidText="This field is required"
    />
  </div>
</Modal>
