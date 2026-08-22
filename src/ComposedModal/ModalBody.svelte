<script>
  /** Set to `true` if the modal contains form elements */
  export let hasForm = false;

  /** Set to `true` if the modal contains scrolling content */
  export let hasScrollingContent = false;

  import { getContext } from "svelte";
  import { writable } from "svelte/store";
  import { scrollIntoViewWithinMenu } from "../utils/scrollIntoViewWithinMenu.js";

  const composedModalCtx = getContext("carbon:ComposedModal");
  const modalLabel = composedModalCtx?.label ?? writable(undefined);
  const modalTitle = composedModalCtx?.title ?? writable(undefined);

  // Name the region with ModalHeader's label/title heading when the
  // consumer hasn't already supplied their own aria-label/aria-labelledby.
  $: regionLabelledby =
    !$$restProps["aria-label"] && !$$restProps["aria-labelledby"]
      ? $modalLabel
        ? composedModalCtx.labelId
        : $modalTitle
          ? composedModalCtx.titleId
          : undefined
      : undefined;
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  tabindex={hasScrollingContent ? "0" : undefined}
  role={hasScrollingContent ? "region" : undefined}
  aria-labelledby={hasScrollingContent ? regionLabelledby : undefined}
  class:bx--modal-content={true}
  class:bx--modal-content--with-form={hasForm}
  class:bx--modal-scroll-content={hasScrollingContent}
  on:focusin={(event) => {
    // Keep a newly-focused element (e.g. via Tab) from being hidden under
    // the scroll gradient at the bottom of the content area.
    if (event.target instanceof HTMLElement) {
      scrollIntoViewWithinMenu(event.target, ".bx--modal-content");
    }
  }}
  {...$$restProps}
>
  <slot />
</div>
{#if hasScrollingContent}
  <div class:bx--modal-content--overflow-indicator={true}></div>
{/if}
