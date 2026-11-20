<script>
  import {
    Button,
    createChecklistStore,
    localChecklistStorage,
    OnboardingChecklist,
  } from "carbon-components-svelte";

  const store = createChecklistStore({
    storage: localChecklistStorage("carbon:onboarding:floating"),
  });

  const tasks = [
    {
      id: "connect-source",
      title: "Connect a data source",
      section: "Connect",
      completed: false,
      cta: { text: "Connect source" },
    },
    {
      id: "invite",
      title: "Invite a teammate",
      section: "Connect",
      optional: true,
    },
    { id: "alert", title: "Create an alert", section: "Configure" },
    { id: "dashboard", title: "Build a dashboard", section: "Configure" },
    { id: "publish", title: "Publish your first report", section: "Launch" },
    { id: "review", title: "Review your plan", section: "Launch" },
  ];
</script>

<main style:padding="1rem 1rem 6rem">
  <h1>Reports</h1>
  {#each [1, 2, 3, 4, 5, 6] as index (index)}
    <p data-testid="content">
      Quarterly revenue is up 12 percent on the same quarter last year, led by
      the enterprise tier. Churn held steady at 2.1 percent, and the new
      onboarding flow cut time to first dashboard from nine days to four.
    </p>
  {/each}
  <p data-testid="last-content">End of the report. Nothing else follows.</p>
  <Button size="small" on:click={() => store.restore()}>Open setup guide</Button
  >
</main>

<OnboardingChecklist
  data-testid="checklist"
  id="floating"
  title="Getting started"
  floating
  {store}
  {tasks}
/>
