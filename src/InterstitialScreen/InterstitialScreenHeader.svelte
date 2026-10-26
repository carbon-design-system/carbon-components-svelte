<script>
  /**
   * @slot {{}} - Custom header content, after the title and before the step progress indicator.
   */

  /** Specify the header title */
  export let title = "";

  /** Specify the header subtitle */
  export let subTitle = "";

  /**
   * Specify the heading level of the title, to fit the page outline.
   * A full-screen takeover defaults to 1, or one level below an enclosing
   * `Section`'s heading. In a modal it defaults to 2, as a modal title.
   * @type {1 | 2 | 3 | 4 | 5 | 6 | undefined}
   */
  export let headingLevel = undefined;

  /** Set to `true` to hide the step progress indicator (only relevant when there is more than one `InterstitialScreenView`) */
  export let hideProgressIndicator = false;

  /** Specify the ARIA label for the close icon */
  export let iconDescription = "Close";

  import { getContext } from "svelte";
  import Button from "../Button/Button.svelte";
  import ModalHeader from "../ComposedModal/ModalHeader.svelte";
  import Close from "../icons/Close.svelte";
  import InterstitialScreenHeaderContent from "./InterstitialScreenHeaderContent.svelte";

  const { isFullScreen, handleClose } = getContext("carbon:InterstitialScreen");

  /** @type {undefined | import("svelte/store").Readable<1 | 2 | 3 | 4 | 5 | 6>} */
  const sectionLevel = getContext("carbon:Section");

  $: headingTag = `h${
    headingLevel ??
    ($isFullScreen ? (sectionLevel ? Math.min($sectionLevel + 1, 6) : 1) : 2)
  }`;
  $: hasTitle = Boolean(title || subTitle || $$slots.default);
  $: headerClass = [
    "bx--interstitial-screen__header",
    hasTitle && "bx--interstitial-screen__header--has-title",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

{#if $isFullScreen}
  <header class:bx--modal-header={true} {...$$restProps} class={headerClass}>
    <InterstitialScreenHeaderContent
      {title}
      {subTitle}
      {headingTag}
      {hideProgressIndicator}
    >
      <slot />
    </InterstitialScreenHeaderContent>
    <div class:bx--modal-close-button={true}>
      <Button
        kind="ghost"
        class="bx--modal-close"
        {iconDescription}
        aria-label={iconDescription}
        tooltipPosition="left"
        portalTooltip
        on:click={() => handleClose("close")}
      >
        <Close
          slot="icon"
          size={20}
          class="bx--modal-close__icon"
          aria-hidden="true"
        />
      </Button>
    </div>
  </header>
{:else}
  <ModalHeader {iconDescription} {...$$restProps} class={headerClass}>
    <InterstitialScreenHeaderContent
      {title}
      {subTitle}
      {headingTag}
      {hideProgressIndicator}
    >
      <slot />
    </InterstitialScreenHeaderContent>
  </ModalHeader>
{/if}
