<script>
  import {
    Box,
    Button,
    createChecklistStore,
    localChecklistStorage,
    OnboardingChecklist,
    Stack,
  } from "carbon-components-svelte";

  const store = createChecklistStore({
    storage: localChecklistStorage("docs:onboarding:setup"),
  });

  const tasks = [
    {
      id: "invite",
      title: "Invite your team",
      description: "Add the people who review incidents with you.",
      section: "Team",
      cta: { text: "Invite teammates", href: "#invite" },
    },
    {
      id: "roles",
      title: "Assign on-call roles",
      description: "Choose who is paged first for each service.",
      section: "Team",
      optional: true,
    },
    {
      id: "source",
      title: "Connect a metrics source",
      description: "Point Acme Monitor at Prometheus, Datadog or CloudWatch.",
      section: "Monitoring",
      cta: { text: "Connect source" },
    },
    {
      id: "alert",
      title: "Create your first alert",
      description: "Page the on-call engineer when p95 latency passes 800 ms.",
      section: "Monitoring",
    },
    {
      id: "status",
      title: "Publish a status page",
      description: "Let customers follow an incident without asking support.",
      section: "Launch",
      optional: true,
      cta: { text: "Create status page", href: "#status-page" },
    },
  ];
</script>

<Box maxWidth="28rem">
  <Stack gap={5}>
    <OnboardingChecklist
      title="Set up Acme Monitor"
      {tasks}
      {store}
      allSetDescriptionText="Acme Monitor is watching your services."
    />
    <Button kind="ghost" size="small" on:click={() => store.reset()}>
      Reset progress
    </Button>
  </Stack>
</Box>
