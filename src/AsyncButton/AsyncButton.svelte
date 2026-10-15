<script>
  /**
   * @template [Icon=any]
   * @restProps {button}
   * @event {null} finish
   * @slot {{}} - The button label.
   */

  /**
   * Specify the work to run on click, such as a request. While a returned
   * promise is pending, the button is replaced by an inline loading status
   * that holds its width.
   * @type {() => void | Promise<void>}
   */
  export let onClick = () => {};

  /**
   * Set the status: `"idle"` shows the button, `"active"` and `"finished"`
   * show the status in its place, and `"error"` shows the button again with
   * the error beside it. Set it back to `"idle"` to offer the action again,
   * such as when the inputs it acted on change.
   * @type {"idle" | "active" | "finished" | "error"}
   * @bindable writable
   */
  export let status = "idle";

  /** Specify the text shown while the work is pending */
  export let activeText = "Working";

  /** Specify the text shown once the work is done */
  export let finishedText = "Done";

  /** Specify the error shown when the work rejects without a message */
  export let errorText = "Something went wrong. Try again.";

  /**
   * Specify the kind of button.
   * @type {"primary" | "secondary" | "tertiary" | "ghost" | "danger"}
   */
  export let kind = "primary";

  /**
   * Specify the size of the button.
   * @type {"xs" | "small" | "field" | "lg" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify an icon to render in the button.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /** Set to `true` to disable the button */
  export let disabled = false;

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";

  const dispatch = createEventDispatcher();

  /** The button's width, kept by the status so the layout does not jump. */
  let width = 0;
  /** @type {string | undefined} */
  let error = undefined;

  async function run() {
    if (status === "active") return;
    status = "active";
    error = undefined;
    try {
      await onClick();
      status = "finished";
      dispatch("finish");
    } catch (reason) {
      error =
        reason instanceof Error && reason.message ? reason.message : errorText;
      status = "error";
    }
  }
</script>

<div
  class:bx--async-button={true}
  style:min-width={status === "idle" || status === "error"
    ? undefined
    : `${width}px`}
>
  {#if status === "active" || status === "finished"}
    <InlineLoading
      status={status === "active" ? "active" : "finished"}
      description={status === "active" ? activeText : finishedText}
    />
  {:else}
    <div bind:clientWidth={width} class:bx--async-button__button={true}>
      <Button {kind} {size} {icon} {disabled} {...$$restProps} on:click={run}>
        <slot />
      </Button>
    </div>
    {#if status === "error"}
      <InlineLoading status="error" description={error} />
    {/if}
  {/if}
</div>
