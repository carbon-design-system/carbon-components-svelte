<script>
  /**
   * Catches errors thrown while rendering or running effects in its
   * content, and shows a fallback in their place. Requires Svelte 5: it
   * wraps `<svelte:boundary>`, which Svelte 3 and 4 do not compile. Import
   * it from `carbon-components-svelte/boundary`, not the package root.
   * Errors in event handlers and async callbacks are not caught.
   * @restProps {div}
   * @slot {{}} - The content to guard.
   * @slot {{ error: unknown; reset: () => void }} failed - Replaces the default fallback. Call `reset` to render the content again.
   * @event {{ error: unknown; reset: () => void }} error
   */

  /** Specify the title of the default fallback. */
  export let titleText = "Something went wrong";

  /** Specify the text under the title of the default fallback. */
  export let subtitleText =
    "Try again. If the problem continues, reload the page.";

  /**
   * Specify the label of the default fallback's retry button.
   * Set to an empty string to hide the button.
   */
  export let retryText = "Try again";

  /**
   * Set to `true` to show the error's message in the default fallback.
   * Messages can expose internals, so it is off by default.
   */
  export let showError = false;

  import { createEventDispatcher } from "svelte";
  import Callout from "../Notification/Callout.svelte";
  import NotificationActionButton from "../Notification/NotificationActionButton.svelte";

  const dispatch = createEventDispatcher();

  /** @param {unknown} error */
  function messageOf(error) {
    if (error instanceof Error) return error.message;
    return typeof error === "string" ? error : "";
  }

  /**
   * @param {unknown} error
   * @param {() => void} reset
   */
  function handleError(error, reset) {
    dispatch("error", { error, reset });
  }
</script>

<svelte:boundary onerror={handleError}>
  <slot />
  {#snippet failed(error, reset)}
    <slot name="failed" {error} {reset}>
      <Callout
        role="alert"
        kind="error"
        fullWidth
        title={titleText}
        subtitle={subtitleText}
        {...$$restProps}
      >
        {#if showError && messageOf(error)}
          <p class:bx--inline-notification__subtitle={true}>
            {messageOf(error)}
          </p>
        {/if}
        <svelte:fragment slot="actions">
          {#if retryText}
            <NotificationActionButton on:click={reset}>
              {retryText}
            </NotificationActionButton>
          {/if}
        </svelte:fragment>
      </Callout>
    </slot>
  {/snippet}
</svelte:boundary>
