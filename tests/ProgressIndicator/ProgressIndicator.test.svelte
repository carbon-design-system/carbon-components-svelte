<script lang="ts">
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";

  export let currentIndex = 0;
  export let vertical = false;
  export let spaceEqually = false;
  export let preventChangeOnClick = false;
  export let steps: Array<{
    label: string;
    description: string;
    complete: boolean;
    invalid?: boolean;
    disabled?: boolean;
  }> = [];
  export let onchange: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<ProgressIndicator
  {currentIndex}
  {vertical}
  {spaceEqually}
  {preventChangeOnClick}
  on:change={onchange || ((e) => {
    console.log("change", e.detail);
  })}
>
  {#each steps as step}
    <ProgressStep
      label={step.label}
      description={step.description}
      complete={step.complete}
      invalid={step.invalid}
      disabled={step.disabled}
      on:focus={() => {
        console.log("focus", step.label);
      }}
      on:blur={() => {
        console.log("blur", step.label);
      }}
    />
  {/each}
</ProgressIndicator>
