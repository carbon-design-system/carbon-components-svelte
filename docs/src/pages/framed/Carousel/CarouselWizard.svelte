<script>
  import {
    Carousel,
    CarouselItem,
    ProgressIndicator,
    ProgressStep,
    RadioButton,
    RadioButtonGroup,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  const steps = ["Project", "Region", "Review"];

  let selectedIndex = 0;
  let projectName = "checkout-service";
  let region = "us-east";
</script>

<Stack gap={7}>
  <ProgressIndicator
    currentIndex={selectedIndex}
    spaceEqually
    on:change={(e) => (selectedIndex = e.detail)}
  >
    {#each steps as step, index}
      <ProgressStep label={step} complete={index < selectedIndex} />
    {/each}
  </ProgressIndicator>

  <Carousel
    labelText="Create project"
    prevButtonLabelText="Previous step"
    nextButtonLabelText="Next step"
    bind:selectedIndex
  >
    <CarouselItem label="Step 1: Project">
      <TextInput
        labelText="Project name"
        helperText="Lowercase letters, numbers, and dashes"
        bind:value={projectName}
      />
    </CarouselItem>
    <CarouselItem label="Step 2: Region">
      <RadioButtonGroup
        legendText="Region"
        orientation="vertical"
        bind:selected={region}
      >
        <RadioButton labelText="US East (Virginia)" value="us-east" />
        <RadioButton labelText="EU West (Frankfurt)" value="eu-west" />
        <RadioButton labelText="AP South (Mumbai)" value="ap-south" />
      </RadioButtonGroup>
    </CarouselItem>
    <CarouselItem label="Step 3: Review">
      <Stack gap={3}>
        <h4>Ready to create</h4>
        <p>
          <strong>{projectName || "Untitled"}</strong>
          will be created in <strong>{region}</strong>.
        </p>
      </Stack>
    </CarouselItem>
  </Carousel>
</Stack>
