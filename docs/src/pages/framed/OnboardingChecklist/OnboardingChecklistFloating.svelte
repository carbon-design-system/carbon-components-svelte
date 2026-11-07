<script>
  import {
    Button,
    createChecklistStore,
    localChecklistStorage,
    OnboardingChecklist,
    Stack,
  } from "carbon-components-svelte";

  const store = createChecklistStore({
    storage: localChecklistStorage("docs:onboarding:floating"),
  });

  const tasks = [
    {
      id: "source",
      title: "Connect a metrics source",
      section: "Monitoring",
      completed: false,
    },
    {
      id: "alert",
      title: "Create your first alert",
      description: "Page the on-call engineer when p95 latency passes 800 ms.",
      section: "Monitoring",
    },
    {
      id: "invite",
      title: "Invite your team",
      section: "Team",
      optional: true,
    },
  ];
</script>

<Stack gap={5}>
  <p>
    The checklist floats in the bottom corner of this frame. Minimize it to a
    launcher, then reopen it from the launcher or from the button below.
  </p>
  <Stack orientation="horizontal" gap={3}>
    <Button size="small" kind="tertiary" on:click={() => store.restore()}>
      Open setup guide
    </Button>
    <Button size="small" kind="ghost" on:click={() => store.reset()}>
      Reset progress
    </Button>
  </Stack>
</Stack>

<OnboardingChecklist floating title="Getting started" {tasks} {store} />
