<script>
  /**
   * Internal: the title, custom content and step progress that
   * `InterstitialScreenHeader` renders in both hosting modes.
   * @slot {{}}
   */

  /** @type {string} */
  export let title;

  /** @type {string} */
  export let subTitle;

  /** @type {string} */
  export let headingTag;

  /** @type {boolean} */
  export let hideProgressIndicator;

  import { getContext } from "svelte";
  import ProgressIndicator from "../ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "../ProgressIndicator/ProgressStep.svelte";

  const { progStep, views } = getContext("carbon:InterstitialScreen");

  $: isMultiStep = $views.length > 1;
</script>

{#if title || subTitle}
  <div class:bx--interstitial-screen__titles={true}>
    {#if title}
      <svelte:element this={headingTag} class="bx--interstitial-screen__title"
        >{title}</svelte:element
      >
    {/if}
    {#if subTitle}
      <p class:bx--interstitial-screen__subtitle={true}>{subTitle}</p>
    {/if}
  </div>
{/if}
<slot />
{#if !hideProgressIndicator && isMultiStep}
  <div class:bx--interstitial-screen__progress={true}>
    <ProgressIndicator
      currentIndex={$progStep}
      preventChangeOnClick
      spaceEqually
    >
      {#each $views as view, index (view.id)}
        <ProgressStep
          label={view.stepTitle || `Step ${index + 1}`}
          complete={index < $progStep}
        />
      {/each}
    </ProgressIndicator>
    <div aria-live="polite" aria-atomic="true" class:bx--visually-hidden={true}>
      Step {$progStep + 1} of {$views.length}
    </div>
  </div>
{/if}
