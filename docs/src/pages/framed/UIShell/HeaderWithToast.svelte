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
      title: "Cluster created",
      subtitle: "Your Kubernetes cluster is now provisioning.",
      timeout: 5000,
    });
  };
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<NotificationQueue bind:this={queue} position={queuePosition} />

<Content>
  <Grid>
    <Row>
      <Column>
        <Stack gap={6}>
          <h1>Clusters</h1>
          <p>
            Click the buttons below to trigger toast notifications in different
            positions.
          </p>
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
