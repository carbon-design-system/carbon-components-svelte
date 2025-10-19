<script lang="ts">
  import { ProgressIndicator, ProgressStep } from "carbon-components-svelte";

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
  export let onchange: ((e: CustomEvent<number>) => void) | undefined =
    undefined;
</script>

<ProgressIndicator
  {currentIndex}
  {vertical}
  {spaceEqually}
  {preventChangeOnClick}
  onchange={(e) => {
    console.log("change", e.detail);
    if (onchange) onchange(e);
  }}
>
  {#each steps as step}
    <ProgressStep
      label={step.label}
      description={step.description}
      complete={step.complete}
      invalid={step.invalid}
      disabled={step.disabled}
    />
  {/each}
</ProgressIndicator>
