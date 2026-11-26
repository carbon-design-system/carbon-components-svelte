<script>
  /**
   * @restProps {div}
   * @event {null} extend - The user stayed signed in and the session was extended.
   * @event {null} signout - The user chose to sign out. The timer has ended
   *   the session in every tab; sign out of the server here.
   * @event {null} signin - The user chose to sign in again after the session ended.
   */

  /**
   * The idle timer from `createIdleTimer`. The dialog opens for its
   * warning and for the end of the session, and starts it on mount.
   * @type {import("../utils/idle-timer.js").IdleTimer}
   */
  export let timer;

  /** Specify the heading while the session is about to end */
  export let heading = "Your session is about to end";

  /**
   * Specify the text while the session is about to end. `{time}` is
   * replaced by the time left, which counts down every second.
   */
  export let description =
    "You have been inactive. Your session will end in {time}.";

  /** Specify the text of the button that keeps the session going */
  export let extendText = "Stay signed in";

  /** Specify the text of the button that ends the session */
  export let signOutText = "Sign out";

  /** Specify the text of the button while the server is asked to extend */
  export let extendingText = "Extending…";

  /** Specify the message shown when the server could not extend the session */
  export let errorText = "We could not extend your session. Try again.";

  /** Specify the heading once the session has ended */
  export let expiredHeading = "You've been signed out";

  /** Specify the text once the session has ended */
  export let expiredDescription =
    "Your session ended because you were inactive. Sign in again to continue.";

  /**
   * Specify the text once the user, here or in another tab, chose to sign out
   */
  export let signedOutDescription =
    "You were signed out. Sign in again to continue.";

  /** Specify the text of the button once the session has ended */
  export let signInText = "Sign in";

  /**
   * Specify the seconds left at which screen readers hear `announcement`.
   * The countdown on screen changes every second; it is not announced.
   * A threshold already passed when the dialog opens is skipped, as the
   * dialog reads its text on opening.
   * @type {ReadonlyArray<number>}
   */
  export let announceAt = [60, 30, 10];

  /**
   * Specify the text screen readers hear at each of `announceAt`.
   * @type {(seconds: number) => string}
   */
  export let announcement = (seconds) =>
    `Your session will end in ${
      seconds % 60 === 0
        ? `${seconds / 60} ${seconds === 60 ? "minute" : "minutes"}`
        : `${seconds} ${seconds === 1 ? "second" : "seconds"}`
    }`;

  /**
   * Set the size of the modal.
   * @type {"xs" | "sm" | "md" | "lg"}
   */
  export let size = "xs";

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the top-level HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Countdown from "../Countdown/Countdown.svelte";
  import Modal from "../Modal/Modal.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  let mounted = false;
  /** What the status region says. */
  let message = "";
  /**
   * The last end time shown, so the text holds while the dialog closes.
   * @type {null | Date}
   */
  let shownEnd = null;
  /** @type {Array<ReturnType<typeof setTimeout>>} */
  let timeouts = [];

  $: status = $timer.status;
  $: expired = status === "expired";
  $: open = status !== "active";
  $: endedText =
    $timer.reason === "signout" ? signedOutDescription : expiredDescription;
  $: if ($timer.expiresAt) shownEnd = $timer.expiresAt;
  $: [before, after] = splitTime(description);

  /** @param {string} text */
  function splitTime(text) {
    const at = text.indexOf("{time}");
    return at === -1
      ? [text, ""]
      : [text.slice(0, at), text.slice(at + "{time}".length)];
  }

  function clearTimeouts() {
    for (const timeout of timeouts) clearTimeout(timeout);
    timeouts = [];
  }

  /**
   * Say the thresholds that are still ahead, each at the wall clock's time.
   * One that fires late (a hidden tab) is dropped when it is no longer
   * true, instead of saying 30 seconds with 10 left.
   * @param {typeof status} next
   * @param {null | Date} end
   * @param {string} endedText
   */
  function plan(next, end, endedText) {
    clearTimeouts();
    if (next === "expired") {
      message = `${expiredHeading}. ${endedText}`;
      return;
    }
    message = "";
    if (next !== "warning" || !end) return;
    for (const seconds of announceAt) {
      const delay = +end - Date.now() - seconds * 1000;
      if (delay <= 0) continue;
      timeouts.push(
        setTimeout(() => {
          const left = (+end - Date.now()) / 1000;
          if (left > seconds - 2) message = announcement(seconds);
        }, delay),
      );
    }
  }

  $: if (mounted) plan(status, $timer.expiresAt, endedText);

  // The button pressed to sign out goes away with the warning. Keep focus
  // in the dialog, on the one button left.
  $: if (mounted && expired) {
    tick().then(() => {
      if (!ref?.contains(document.activeElement)) focusPrimary();
    });
  }

  function focusPrimary() {
    /** @type {null | HTMLElement} */ (
      ref?.querySelector(".bx--modal-footer .bx--btn--primary")
    )?.focus();
  }

  /**
   * A press on the backdrop leaves the dialog open but takes focus to the
   * page, past the reach of the dialog's Tab handling. Bring it back.
   * @param {MouseEvent} event
   */
  function handleClick(event) {
    if (event.target !== ref || ref?.contains(document.activeElement)) return;
    focusPrimary();
  }

  async function handlePrimary() {
    if (expired) {
      dispatch("signin");
    } else if (await timer.extend("user")) {
      dispatch("extend");
    }
  }

  function handleSecondary() {
    timer.signOut();
    dispatch("signout");
  }

  /** @param {CustomEvent<{ trigger: string }>} event */
  function handleClose(event) {
    // The user must choose: Escape and a click outside do not dismiss.
    if (event.detail.trigger !== "programmatic") event.preventDefault();
  }

  onMount(() => {
    timer.start();
    mounted = true;
    return clearTimeouts;
  });
</script>

<Modal
  {open}
  bind:ref
  {id}
  alert
  {size}
  hideCloseButton
  modalHeading={expired ? expiredHeading : heading}
  primaryButtonText={expired
    ? signInText
    : $timer.extending
      ? extendingText
      : extendText}
  secondaryButtons={expired ? [] : [{ text: signOutText }]}
  {...$$restProps}
  on:close={handleClose}
  on:click={handleClick}
  on:click:button--primary={handlePrimary}
  on:click:button--secondary={handleSecondary}
>
  {#if expired}
    <p>{endedText}</p>
  {:else}
    <p>
      {before}{#if shownEnd}<Countdown
          until={shownEnd}
          warnAt={0}
          expiredDescription=""
        />{/if}{after}
    </p>
    {#if $timer.error}
      <InlineNotification
        kind="error"
        role="alert"
        lowContrast
        hideCloseButton
        title=""
        subtitle={errorText}
      />
    {/if}
  {/if}
  <span class:bx--visually-hidden={true} role="status">{message}</span>
</Modal>
