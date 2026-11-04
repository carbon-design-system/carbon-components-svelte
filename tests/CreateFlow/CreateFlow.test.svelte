<svelte:options accessors />

<script lang="ts">
  import CreateFlowActions from "carbon-components-svelte/CreateFlow/CreateFlowActions.svelte";
  import CreateFlowForm from "carbon-components-svelte/CreateFlow/CreateFlowForm.svelte";
  import CreateFlowStep from "carbon-components-svelte/CreateFlow/CreateFlowStep.svelte";
  import CreateFlowSteps from "carbon-components-svelte/CreateFlow/CreateFlowSteps.svelte";
  import {
    createStepFlow,
    type StepFlowOptions,
  } from "carbon-components-svelte/CreateFlow/step-flow.js";
  import Section from "carbon-components-svelte/Heading/Section.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import { createUnsavedChanges } from "carbon-components-svelte/UnsavedChanges/unsaved-changes.js";

  export let keepMounted = true;
  export let linear = true;
  export let validate: StepFlowOptions["validate"] = undefined;
  export let submit: StepFlowOptions["submit"] = undefined;
  export let skipStorage = false;
  export let cancelled = 0;
  export let done = 0;

  export const unsaved = createUnsavedChanges();
  export const flow = createStepFlow({
    linear,
    validate: (step) => validate?.(step),
    submit: (state) => submit?.(state),
    unsavedChanges: unsaved,
    steps: [
      { id: "details", label: "Details" },
      { id: "networking", label: "Networking" },
      { id: "storage", label: "Storage", optional: true },
      { id: "review", label: "Review" },
    ],
  });

  let name = "";
  export let invalid = false;

  $: flow.update("storage", { skipped: skipStorage });
</script>

<Section level={2} tag="div">
  <CreateFlowSteps {flow} />
  <CreateFlowForm {flow} unsavedChanges={unsaved}>
    <CreateFlowStep {flow} id="details" {keepMounted}>
      <TextInput labelText="Name" bind:value={name} {invalid} />
    </CreateFlowStep>
    <CreateFlowStep {flow} id="networking" {keepMounted}>
      <TextInput labelText="Subnet" />
    </CreateFlowStep>
    <CreateFlowStep {flow} id="storage" {keepMounted}>
      <TextInput labelText="Volume" />
    </CreateFlowStep>
    <CreateFlowStep {flow} id="review" {keepMounted}>
      <p>Review {name}</p>
    </CreateFlowStep>
    <p slot="submitted">All done</p>
  </CreateFlowForm>
  <CreateFlowActions
    {flow}
    on:cancel={() => (cancelled += 1)}
    on:done={() => (done += 1)}
  />
</Section>
