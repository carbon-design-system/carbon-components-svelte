<script>
  import {
    Content,
    Header,
    Modal,
    UIShellContainer,
  } from "carbon-components-svelte";
</script>

<div style="height: 6rem"></div>
<div style="width: 600px; margin-left: 8rem">
  <UIShellContainer height="400px" data-testid="shell">
    <Header companyName="Acme" platformName="Contained" />
    <Content>
      <Modal
        open
        modalHeading="Delete billing-api?"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
      >
        <p>The instance and its volumes are removed.</p>
      </Modal>
    </Content>
  </UIShellContainer>
</div>
