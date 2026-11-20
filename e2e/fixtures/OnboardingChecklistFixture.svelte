<script>
  import {
    Button,
    createChecklistStore,
    OnboardingChecklist,
    setChecklistStore,
  } from "carbon-components-svelte";

  const store = createChecklistStore();
  setChecklistStore(store);

  const params = new URLSearchParams(location.search);
  const count = Number(params.get("n")) || 0;

  // The app's own state: a data source is connected, kept across reloads.
  let connected = localStorage.getItem("fixture:connected") === "true";
  $: localStorage.setItem("fixture:connected", String(connected));
  let events = [];

  $: setup = [
    {
      id: "connect-source",
      title: "Connect a data source",
      description: "Detected for you once your first source syncs.",
      section: "Connect",
      cta: { text: "Connect source" },
      completed: connected,
    },
    {
      id: "invite",
      title: "Invite a teammate",
      description: "Share the workspace so reviews have a second pair of eyes.",
      section: "Connect",
      cta: { text: "Invite", href: "#invite" },
      optional: true,
    },
    {
      id: "alert",
      title: "Create an alert",
      description: "Get an email when a metric crosses a threshold.",
      section: "Configure",
    },
    {
      id: "dashboard",
      title: "Build a dashboard",
      description: "Pin the charts you check every morning.",
      section: "Configure",
      cta: { text: "Open builder" },
    },
    {
      id: "roles",
      title: "Set team permissions",
      section: "Configure",
      completed: false,
      optional: true,
    },
    {
      id: "publish",
      title: "Publish your first report",
      description: "Schedule it to land in your team's inbox every Monday.",
      section: "Launch",
    },
  ];

  $: many = Array.from({ length: count }, (_, index) => ({
    id: `task-${index + 1}`,
    title: `Task ${index + 1}`,
    description: `What to do for task number ${index + 1}.`,
    section: `Section ${Math.floor(index / 5) + 1}`,
    cta: index % 3 === 0 ? { text: "Start" } : undefined,
    optional: index % 4 === 3,
    completed: index % 7 === 6 ? connected : undefined,
  }));

  /** @param {CustomEvent} event */
  function log(event) {
    events = [...events, event.type];
  }
</script>

<div style:max-width="480px" style:padding="1rem">
  <OnboardingChecklist
    data-testid="checklist"
    id="setup"
    title="Set up Acme Cloud"
    tasks={count ? many : setup}
    on:check={log}
    on:skip={log}
    on:unskip={log}
    on:action={log}
    on:complete={log}
    on:dismiss={log}
  />
  <p data-testid="events">{events.join(",")}</p>
  <p>
    <Button size="small" on:click={() => (connected = !connected)}>
      Toggle connected
    </Button>
    <Button size="small" kind="tertiary" on:click={() => store.reset()}>
      Reset progress
    </Button>
    <Button size="small" kind="tertiary" on:click={() => store.restore()}>
      Restore checklist
    </Button>
  </p>
</div>
