<script>
  import { Coachmark, Stack, Text } from "carbon-components-svelte";

  const steps = [
    { title: "Select rows", text: "Tick the rows you want to act on." },
    {
      title: "Open the toolbar",
      text: "Batch actions appear above the table.",
    },
    { title: "Export", text: "Download the selected rows together." },
  ];

  let step = 0;
</script>

<Stack orientation="horizontal" gap={7}>
  <Coachmark
    title={steps[step].title}
    align="bottom-start"
    stepCount={steps.length}
    bind:step
  >
    {steps[step].text}
  </Coachmark>
  <Text>Step {step + 1}</Text>
</Stack>
