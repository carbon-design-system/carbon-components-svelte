<script>
  /**
   * @restProps {div}
   * @event {null} retry - Dispatched when Retry is activated. With `autosave` set, it also calls `autosave.retry()`.
   * @slot {{ error: unknown; attempts: number }} details - Replace the error details in the popover beside Retry. Without it, the popover shows the error's message, and is left out when there is none.
   */

  /**
   * Follow a `createAutosave` store. Its state sets the status, the time and
   * the error, and Retry calls its `retry()`.
   * @type {undefined | import("../utils/autosave.js").Autosave<any>}
   */
  export let autosave = undefined;

  /**
   * Set the status when no `autosave` is given, such as for a save of your
   * own.
   * @type {"idle" | "unsaved" | "saving" | "saved" | "error" | "offline"}
   */
  export let status = "idle";

  /**
   * Set when the last save finished, as a `Date` or a timestamp. The saved
   * status shows it as the exact time in a tooltip, and as "2 min ago" once
   * `relativeAfter` has passed.
   * @type {Date | number | undefined}
   */
  export let savedAt = undefined;

  /**
   * Set why the save failed. Its `message` shows in the error details.
   * @type {unknown}
   */
  export let error = undefined;

  /**
   * Set how many tries failed, for a `details` slot to show.
   */
  export let attempts = 0;

  /**
   * Set the size: `"sm"` is a line of small text for a page header or a
   * toolbar, and `"md"` suits the foot of a form.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /**
   * Specify the text for the unsaved status.
   */
  export let unsavedText = "Unsaved changes";

  /**
   * Specify the text for the saving status.
   */
  export let savingText = "Saving…";

  /**
   * Specify the text for the saved status.
   */
  export let savedText = "Saved";

  /**
   * Specify the text for the error status.
   */
  export let errorText = "Couldn't save";

  /**
   * Specify the text for the offline status. It shows only while something
   * is unsaved.
   */
  export let offlineText = "Offline: changes will save when you reconnect";

  /**
   * Specify the text of the Retry button.
   */
  export let retryText = "Retry";

  /**
   * Specify the label for the button that opens the error details.
   */
  export let detailsDescription = "Show error details";

  /**
   * Write the saved status once `relativeAfter` has passed. It receives the
   * time as the locale writes it, such as "2 min. ago".
   * @type {(relative: string) => string}
   */
  export let formatSaved = (relative) => `Saved ${relative}`;

  /**
   * Specify the milliseconds after a save before "Saved" gives way to "Saved
   * 2 min. ago". It is not live to the second: the time updates as a
   * `RelativeTime` does.
   */
  export let relativeAfter = 60_000;

  /**
   * Specify the locale for the time. The runtime locale when unset.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Specify the milliseconds a save must run before "Saving…" shows, so a
   * fast save shows "Unsaved changes" and then "Saved" and nothing between.
   * Once shown, it stays for 600 ms. Set to `0` to show it at once. Read
   * once, when the component is created.
   */
  export let savingDelay = 400;

  /**
   * Set to `false` to leave screen readers silent. By default "Saved" is
   * spoken once, politely, after typing has settled; "Couldn't save" is
   * spoken at once, assertively; and the offline status is spoken politely.
   * "Saving…" and "Unsaved changes" are never spoken.
   */
  export let announce = true;

  /**
   * Obtain a reference to the root element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import Button from "../Button/Button.svelte";
  import IconIndicator from "../IconIndicator/IconIndicator.svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import RelativeTime from "../RelativeTime/RelativeTime.svelte";
  import Toggletip from "../Toggletip/Toggletip.svelte";
  import { createStatusDisplay } from "./status-display.js";

  const dispatch = createEventDispatcher();

  /** How long "Saved" must last before a screen reader hears it. */
  const SAVED_ANNOUNCE_DELAY_MS = 1500;

  let mounted = false;

  // `$autosave` is `undefined` with no store, so the props stay in charge.
  /** @type {import("../utils/autosave.js").AutosaveView} */
  $: view = autosave
    ? /** @type {import("../utils/autosave.js").AutosaveView} */ ($autosave)
    : {
        status,
        savedAt: savedAt === undefined ? undefined : +savedAt,
        error,
        attempts,
        dirty: false,
        saving: status === "saving",
        retrying: false,
        online: status !== "offline",
      };
  $: rawStatus = view.status;

  // The status the user sees. It lags the real one so work that follows
  // continuous typing does not flash. The first value applies at once, so
  // the server HTML, the first client render and a status mounted for work
  // in progress agree.
  /** @type {import("../utils/autosave-state.js").AutosaveStatus} */
  let shown = "idle";
  const display = createStatusDisplay(
    (value) => {
      shown = value;
    },
    {
      savingDelay,
      savingMinimum: savingDelay > 0 ? 600 : 0,
      savedDelay: savingDelay > 0 ? 250 : 0,
    },
  );
  $: display(rawStatus);

  // "Saved", then "Saved 2 min. ago". The server and the first client
  // render both say "Saved"; the age is read from the clock after mount.
  let relative = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let relativeTimer;

  /**
   * @param {boolean} ready
   * @param {Date | number | undefined} at
   */
  function scheduleRelative(ready, at) {
    clearTimeout(relativeTimer);
    relativeTimer = undefined;
    if (!ready || at === undefined) {
      relative = false;
      return;
    }
    const remaining = +at + relativeAfter - Date.now();
    relative = remaining <= 0;
    if (!relative) {
      relativeTimer = setTimeout(() => {
        relative = true;
      }, remaining);
    }
  }
  $: scheduleRelative(mounted, shown === "saved" ? view.savedAt : undefined);

  // What a screen reader hears, never what typing does. Statuses are edges:
  // "Saved" after the status held for a moment, an error at once, offline
  // once. A status that leaves clears its text, so the same one is heard
  // again next time.
  let politeText = "";
  let assertiveText = "";
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let announceTimer;

  /** @param {import("../utils/autosave-state.js").AutosaveStatus} value */
  function speak(value) {
    clearTimeout(announceTimer);
    announceTimer = undefined;
    politeText = "";
    assertiveText = "";
    if (!mounted || !announce) return;
    if (value === "saved") {
      announceTimer = setTimeout(() => {
        politeText = savedText;
      }, SAVED_ANNOUNCE_DELAY_MS);
    } else if (value === "error") {
      assertiveText = errorText;
    } else if (value === "offline") {
      politeText = offlineText;
    }
  }
  $: speak(shown);

  onMount(() => {
    mounted = true;
    return () => {
      display.cancel();
      clearTimeout(relativeTimer);
      clearTimeout(announceTimer);
    };
  });

  /** @type {"sm" | "md"} */
  $: iconSize = size === "sm" ? "sm" : "md";

  $: detailsMessage =
    typeof view.error === "string"
      ? view.error
      : view.error instanceof Error
        ? view.error.message
        : typeof (/** @type {any} */ (view.error)?.message) === "string"
          ? /** @type {any} */ (view.error).message
          : "";
  $: hasDetails = !!detailsMessage || !!$$slots.details;

  function handleRetry() {
    // Retry leaves with the error. Keep focus in the status, not on <body>.
    if (ref) {
      ref.tabIndex = -1;
      ref.focus({ preventScroll: true });
    }
    dispatch("retry");
    autosave?.retry();
  }
</script>

<div
  bind:this={ref}
  class:bx--saving-status={true}
  class:bx--saving-status--sm={size === "sm"}
  class:bx--saving-status--md={size === "md"}
  class:bx--saving-status--unsaved={shown === "unsaved"}
  class:bx--saving-status--saving={shown === "saving"}
  class:bx--saving-status--saved={shown === "saved"}
  class:bx--saving-status--error={shown === "error"}
  class:bx--saving-status--offline={shown === "offline"}
  {...$$restProps}
>
  <div class:bx--saving-status__content={true}>
    {#if shown === "saving"}
      <!-- Spoken by the live regions below, never by the spinner. -->
      <InlineLoading
        size={iconSize}
        status="active"
        description={savingText}
        role={undefined}
        aria-live="off"
      />
    {:else if shown === "saved"}
      <IconIndicator kind="succeeded" label={savedText}>
        <svelte:fragment slot="labelChildren">
          <RelativeTime
            date={view.savedAt}
            {locale}
            style={size === "sm" ? "short" : "long"}
            let:formatted
          >
            {relative ? formatSaved(formatted) : savedText}
          </RelativeTime>
        </svelte:fragment>
      </IconIndicator>
    {:else if shown === "unsaved"}
      <IconIndicator kind="pending" label={unsavedText} />
    {:else if shown === "offline"}
      <IconIndicator kind="caution-minor" label={offlineText} />
    {:else if shown === "error"}
      <IconIndicator kind="failed" label={errorText} />
      <Button
        kind="ghost"
        size={size === "sm" ? "xs" : "sm"}
        on:click={handleRetry}
      >
        {retryText}
      </Button>
      {#if hasDetails}
        <Toggletip
          align="end"
          iconDescription={detailsDescription}
          portalTooltip={false}
        >
          <slot name="details" error={view.error} attempts={view.attempts}>
            <p>{detailsMessage}</p>
          </slot>
        </Toggletip>
      {/if}
    {/if}
  </div>
  <span
    class:bx--visually-hidden={true}
    class:bx--saving-status__live={true}
    role="status"
    aria-live="polite"
    aria-atomic="true">{politeText}</span
  >
  <span
    class:bx--visually-hidden={true}
    class:bx--saving-status__live={true}
    role="alert"
    aria-live="assertive"
    aria-atomic="true">{assertiveText}</span
  >
</div>
