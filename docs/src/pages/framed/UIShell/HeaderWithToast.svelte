<script>
  import {
    Button,
    ButtonSet,
    Column,
    Content,
    Grid,
    Header,
    HeaderGlobalAction,
    HeaderUtilities,
    Row,
    SkipToContent,
    Stack,
    ToastNotification,
  } from "carbon-components-svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import { fade } from "svelte/transition";

  let showToast = false;
  let toastPosition = "top";

  const triggerToast = (position = "top") => {
    toastPosition = position;
    showToast = true;
  };
</script>

<Header company="IBM" platformName="Carbon Svelte">
  <svelte:fragment slot="skip-to-content">
    <SkipToContent />
  </svelte:fragment>
  <HeaderUtilities>
    <HeaderGlobalAction
      iconDescription="Show notification"
      tooltipAlignment="end"
      icon={Notification}
      on:click={triggerToast}
    />
  </HeaderUtilities>
</Header>

{#if showToast}
  <div
    transition:fade
    style="position: fixed; {toastPosition === 'top' ? 'top: 3rem;' : 'bottom: 1rem;'} right: 1rem; z-index: 9000; min-width: 288px;"
  >
    <ToastNotification
      kind="success"
      title="Success"
      subtitle="Your action was completed successfully."
      caption={new Date().toLocaleString()}
      timeout={5000}
      on:close={() => {
        showToast = false;
      }}
    />
  </div>
{/if}

<Content>
  <Grid>
    <Row>
      <Column>
        <Stack gap={6}>
          <h1>Welcome</h1>
          <p>
            Click the notification icon in the header or use the buttons below to
            trigger toast notifications in different positions.
          </p>
          <ButtonSet>
            <Button on:click={() => triggerToast("top")}>
              Top right
            </Button>
            <Button on:click={() => triggerToast("bottom")}>
              Bottom right
            </Button>
          </ButtonSet>
        </Stack>
      </Column>
    </Row>
  </Grid>
</Content>
