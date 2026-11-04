<script>
  import {
    ButtonSet,
    Checkbox,
    Content,
    CreateFlowActions,
    CreateFlowForm,
    CreateFlowStep,
    CreateFlowSteps,
    createStepFlow,
    Section,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let email = "";
  let updates = false;
  let errors = {};

  // Any step can be entered from the rail. Submitting checks the steps the
  // user has not completed, and shows the first one that fails.
  const flow = createStepFlow({
    linear: false,
    steps: [
      { id: "account", label: "Account" },
      { id: "preferences", label: "Preferences", optional: true },
      { id: "review", label: "Review" },
    ],
    validate(step) {
      errors = {};
      if (step.id === "account" && !email.includes("@")) {
        errors.email = "Enter an email address.";
      }
      return Object.keys(errors).length === 0;
    },
    submit: () => new Promise((resolve) => setTimeout(resolve, 600)),
  });
</script>

<Content>
  <Section>
    <Stack gap={7}>
      <CreateFlowSteps {flow} vertical={false} />
      <Section>
        <Stack gap={7}>
          <CreateFlowForm {flow}>
            <CreateFlowStep {flow} id="account">
              <TextInput
                labelText="Email"
                bind:value={email}
                invalid={Boolean(errors.email)}
                invalidText={errors.email}
              />
            </CreateFlowStep>
            <CreateFlowStep {flow} id="preferences">
              <Checkbox
                labelText="Send me product updates"
                bind:checked={updates}
              />
            </CreateFlowStep>
            <CreateFlowStep {flow} id="review">
              <p>
                {email || "No email yet"}, updates {updates ? "on" : "off"}.
              </p>
            </CreateFlowStep>
            <p slot="submitted">Account created for {email}.</p>
          </CreateFlowForm>
          <ButtonSet>
            <CreateFlowActions {flow} hideCancel submitText="Create account" />
          </ButtonSet>
        </Stack>
      </Section>
    </Stack>
  </Section>
</Content>
