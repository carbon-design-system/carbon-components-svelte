<script lang="ts">
  import CreateFlowForm from "carbon-components-svelte/CreateFlow/CreateFlowForm.svelte";
  import CreateFlowStep from "carbon-components-svelte/CreateFlow/CreateFlowStep.svelte";
  import CreateFlowSteps from "carbon-components-svelte/CreateFlow/CreateFlowSteps.svelte";
  import { createStepFlow } from "carbon-components-svelte/CreateFlow/step-flow.js";

  export let part: "steps" | "form" | "step";

  const flow = createStepFlow({
    steps: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
  });
</script>

{#if part === "steps"}
  <CreateFlowSteps {flow} {...$$restProps} />
{:else if part === "form"}
  <CreateFlowForm {flow} {...$$restProps} />
{:else}
  <CreateFlowStep {flow} id="a" {...$$restProps}>Fields</CreateFlowStep>
{/if}
