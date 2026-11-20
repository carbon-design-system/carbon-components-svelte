<script>
  import { Button, Stack, Timeline } from "carbon-components-svelte";

  let events = [
    {
      id: 1,
      time: Date.now() - 3 * 60_000,
      title: "Build started",
      status: "info",
    },
  ];

  const steps = [
    { title: "Tests passed", status: "success" },
    { title: "Deployed to staging", status: "success" },
    { title: "Smoke test failed", status: "error" },
  ];

  function addEvent() {
    const step = steps[events.length % steps.length];
    events = [...events, { id: events.length + 1, time: Date.now(), ...step }];
  }
</script>

<Stack gap={5}>
  <Button kind="tertiary" size="small" on:click={addEvent}>Add an event</Button>
  <Timeline aria-label="Pipeline" items={events} order="desc" live />
</Stack>
