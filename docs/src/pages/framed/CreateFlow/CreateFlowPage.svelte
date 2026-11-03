<script>
  import {
    ButtonSet,
    Column,
    Content,
    CreateFlowActions,
    CreateFlowForm,
    CreateFlowStep,
    CreateFlowSteps,
    createStepFlow,
    Grid,
    Heading,
    Row,
    Section,
    Select,
    SelectItem,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let name = "";
  let subnet = "";
  let errors = {};

  const flow = createStepFlow({
    steps: [
      { id: "details", label: "Details" },
      { id: "networking", label: "Networking" },
      { id: "review", label: "Review" },
    ],
    validate(step) {
      errors = {};
      if (step.id === "details" && !name) errors.name = "Enter a name.";
      if (step.id === "networking" && !subnet) {
        errors.subnet = "Choose a subnet.";
      }
      return Object.keys(errors).length === 0;
    },
    submit: () => new Promise((resolve) => setTimeout(resolve, 300)),
  });
</script>

<Content>
  <Section>
    <Heading>Add a server</Heading>
    <Grid>
      <Row>
        <Column sm={4} md={2} lg={3}>
          <CreateFlowSteps {flow} />
        </Column>
        <Column sm={4} md={6} lg={9}>
          <Section>
            <Stack gap={7}>
              <CreateFlowForm {flow}>
                <CreateFlowStep {flow} id="details">
                  <TextInput
                    labelText="Name"
                    bind:value={name}
                    invalid={Boolean(errors.name)}
                    invalidText={errors.name}
                  />
                </CreateFlowStep>
                <CreateFlowStep {flow} id="networking">
                  <Select
                    labelText="Subnet"
                    bind:selected={subnet}
                    invalid={Boolean(errors.subnet)}
                    invalidText={errors.subnet}
                  >
                    <SelectItem value="" text="Choose a subnet" />
                    <SelectItem value="10.240.0.0/24" text="10.240.0.0/24" />
                  </Select>
                </CreateFlowStep>
                <CreateFlowStep {flow} id="review">
                  <p>{name} on {subnet}</p>
                </CreateFlowStep>
                <p slot="submitted">{name} was added.</p>
              </CreateFlowForm>
              <ButtonSet>
                <CreateFlowActions {flow} hideCancel submitText="Add" />
              </ButtonSet>
            </Stack>
          </Section>
        </Column>
      </Row>
    </Grid>
  </Section>
</Content>
