<script>
  import {
    Button,
    ButtonSet,
    Column,
    Content,
    Grid,
    Header,
    NotificationQueue,
    Row,
    SkipToContent,
    Stack,
  } from "carbon-components-svelte";

  let queue;
  let queuePosition = "top-right";

  const triggerToast = (position) => {
    queuePosition = position;
    queue.add({
      kind: "success",
      title: "Success",
      subtitle: "Your action was completed successfully.",
      timeout: 5000,
    });
  };
</script>

<Header company="IBM" platformName="Carbon Svelte">
  <svelte:fragment slot="skip-to-content">
    <SkipToContent />
  </svelte:fragment>
</Header>

<NotificationQueue bind:this={queue} position={queuePosition} />

<Content>
  <Grid>
    <Row>
      <Column>
        <Stack gap={6}>
          <h1>Welcome</h1>
          <p>Click the buttons below to trigger toast notifications in different positions.</p>
          <ButtonSet>
            <Button on:click={() => triggerToast("top-right")}>
              Top right
            </Button>
            <Button on:click={() => triggerToast("bottom-right")}>
              Bottom right
            </Button>
          </ButtonSet>
        </Stack>
      </Column>
    </Row>
  </Grid>
</Content>
