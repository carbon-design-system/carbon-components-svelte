<script>
  import {
    ActionSet,
    Button,
    Column,
    Content,
    Grid,
    Header,
    Row,
    SidePanel,
    SkipToContent,
  } from "carbon-components-svelte";

  let open = false;
  let currentStep = 0;

  const steps = [
    {
      title: "Select a template",
      body: "Choose a starting point for your project.",
    },
    {
      title: "Configure options",
      body: "Fine-tune the template to fit your needs.",
    },
  ];
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<SidePanel
  bind:open
  {currentStep}
  title={steps[currentStep].title}
  includeOverlay
  on:back={() => (currentStep = 0)}
>
  <p>{steps[currentStep].body}</p>

  <svelte:fragment slot="actions">
    <ActionSet>
      <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
      {#if currentStep === 0}
        <Button on:click={() => (currentStep = 1)}>Next</Button>
      {:else}
        <Button on:click={() => (open = false)}>Finish</Button>
      {/if}
    </ActionSet>
  </svelte:fragment>
</SidePanel>

<Content>
  <Grid>
    <Row>
      <Column>
        <Button
          on:click={() => {
            currentStep = 0;
            open = true;
          }}
        >
          Open panel
        </Button>
      </Column>
    </Row>
  </Grid>
</Content>
