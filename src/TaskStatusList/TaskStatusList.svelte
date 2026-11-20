<script context="module">
  /** @param {import("./task-status.js").TaskStatus} status */
  function defaultStatusText(status) {
    return {
      pending: "Pending",
      running: "Running",
      succeeded: "Succeeded",
      failed: "Failed",
      skipped: "Skipped",
      canceled: "Canceled",
    }[status];
  }

  /**
   * @param {{ status: string; counts: import("./task-status.js").TaskCounts; index: number }} summary
   */
  function defaultSummaryText({ status, counts, index }) {
    const { total, complete, failed } = counts;
    if (status === "pending") return total === 1 ? "1 step" : `${total} steps`;
    if (status === "succeeded") {
      return total === 1 ? "1 step complete" : `All ${total} steps complete`;
    }
    if (status === "failed") {
      return failed > 1
        ? `${failed} steps failed`
        : `Failed at step ${index + 1}`;
    }
    if (status === "canceled")
      return `Canceled, ${complete} of ${total} complete`;
    return failed > 0
      ? `${complete} of ${total} complete, ${failed} failed`
      : `${complete} of ${total} complete`;
  }

  /** @param {{ counts: import("./task-status.js").TaskCounts; index: number }} summary */
  function defaultRetryText({ counts, index }) {
    if (counts.failed > 1) return "Retry failed steps";
    if (index <= 0) return "Retry";
    // A step after the failure that finished is not run again.
    return counts.complete > index
      ? "Retry failed step"
      : `Retry from step ${index + 1}`;
  }

  /** @param {boolean} expanded */
  function defaultDetailsText(expanded) {
    return expanded ? "Hide details" : "Show details";
  }

  function defaultLogText() {
    return "View log";
  }
</script>

<script>
  /**
   * @typedef {import("./task-status.js").TaskStatus} TaskStatus
   * @typedef {object} TaskStep
   * @property {string} id - A unique id, which keys the row and the open error.
   * @property {string} label
   * @property {TaskStatus} status
   * @property {number | Date} [startedAt] - When the step began, in milliseconds or as a `Date`. A running step shows the time since.
   * @property {number | Date} [endedAt] - When the step ended. With `startedAt`, the step shows how long it took.
   * @property {string} [detail] - One line under the label, such as "2 of 3 nodes ready".
   * @property {string} [href] - A link to the step's log.
   * @property {string | Error} [error] - The failure, in full. It opens under a toggle on the row.
   * @typedef {object} TaskSummary
   * @property {"pending" | "running" | "succeeded" | "failed" | "canceled"} status - What the steps add up to.
   * @property {import("./task-status.js").TaskCounts} counts
   * @property {number} index - The first failed step, the first one a cancel stopped, or the latest running one; else `-1`.
   * @property {TaskStep | undefined} step - The step at `index`.
   * @restProps {div} Naming and description (`aria-label`, `aria-labelledby`, `aria-describedby`) go to the list instead.
   * @event {{ from: "failed" | "start"; index: number }} retry - Retry was pressed. `from: "failed"` runs again what did not finish; `"start"` runs every step. `index` is the first failed step.
   * @event {null} cancel
   * @slot {{ status: TaskSummary["status"]; counts: import("./task-status.js").TaskCounts; text: string }} summary - Replaces the summary line.
   * @slot {{ step: TaskStep; index: number; status: TaskStatus }} step - Replaces a step's label.
   */

  /**
   * Specify the steps, in order. The list shows them; it does not run
   * them. Replace the array, or a step in it, as work progresses, or take
   * the steps from `createTaskRunner`.
   * @type {ReadonlyArray<TaskStep>}
   */
  export let steps = [];

  /**
   * Set the size: `"sm"` is a compact list for a modal or a panel, with
   * smaller type and tighter rows.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /** Set to `true` to hide the summary line, such as when a heading already says it */
  export let hideSummary = false;

  /**
   * Set to `true` to show a Cancel button while a step runs. It dispatches
   * `cancel`; stopping the work is yours (`runner.cancel()`).
   */
  export let cancelable = false;

  /**
   * Set to `true` to show Retry buttons after a failure or a cancel. They
   * dispatch `retry`; running the steps again is yours (`runner.retry()`).
   */
  export let retryable = false;

  /**
   * Specify the ids of the steps whose error is open.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let expandedIds = [];

  /**
   * Set to `false` to stop announcing progress. A finished list, a failure
   * and a cancel are announced once; progress is announced at most every
   * `announceDelay`.
   */
  export let announce = true;

  /** Specify the least time in milliseconds between progress announcements */
  export let announceDelay = 1000;

  /**
   * Specify the text of the summary line.
   * @type {(summary: TaskSummary) => string}
   */
  export let summaryText = defaultSummaryText;

  /**
   * Specify the text announced as the steps change. Return an empty string
   * to say nothing. Defaults to `summaryText` and the label of the step it
   * is about.
   * @type {undefined | ((summary: TaskSummary) => string)}
   */
  export let announceText = undefined;

  /**
   * Specify the status that screen readers hear after a step's label.
   * @type {(status: TaskStatus) => string}
   */
  export let statusText = defaultStatusText;

  /**
   * Specify how a step's time is written, from its length in milliseconds.
   * @type {(ms: number) => string}
   */
  export let durationText = formatDuration;

  /**
   * Specify the text of the button that opens a step's error.
   * @type {(expanded: boolean) => string}
   */
  export let detailsText = defaultDetailsText;

  /**
   * Specify the text of a step's log link.
   * @type {(step: TaskStep) => string}
   */
  export let logText = defaultLogText;

  /** Specify the text of the Cancel button */
  export let cancelText = "Cancel";

  /**
   * Specify the text of the button that retries from the failed step.
   * @type {(summary: TaskSummary) => string}
   */
  export let retryText = defaultRetryText;

  /** Specify the text of the button that retries every step */
  export let retryAllText = "Retry all";

  /** Specify an id for the top-level element. Inner ids derive from it. */
  export let id = uniqueId();

  import {
    afterUpdate,
    beforeUpdate,
    createEventDispatcher,
    onMount,
  } from "svelte";
  import Button from "../Button/Button.svelte";
  import Link from "../Link/Link.svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import CircleDash from "../icons/CircleDash.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import InProgress from "../icons/InProgress.svelte";
  import StopOutline from "../icons/StopOutline.svelte";
  import SubtractAlt from "../icons/SubtractAlt.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { focusQuietly } from "../utils/focus.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    createThrottledSpeaker,
    describeSteps,
    formatDuration,
    isoDuration,
    normalizeStatus,
    stepDuration,
  } from "./task-status.js";

  const dispatch = createEventDispatcher();

  const icons = {
    pending: CircleDash,
    succeeded: CheckmarkFilled,
    failed: ErrorFilled,
    skipped: SubtractAlt,
    canceled: StopOutline,
  };

  /** @type {null | HTMLElement} */
  let summaryRef = null;
  /** @type {null | HTMLDivElement} */
  let actionsRef = null;
  let mounted = false;
  /** The time a running step is measured against. Unset on the server and until mount, so the first render matches the server's. */
  let now = /** @type {number | null} */ (null);
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let timer;
  let politeText = "";
  let assertiveText = "";

  // The list is what the name and description are about.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: info = describeSteps(steps);
  $: summary = summaryText(info);
  $: expandedSet = new Set(expandedIds);
  $: iconSize = size === "sm" ? 16 : 20;
  $: showCancel = cancelable && info.status === "running";
  $: showRetry =
    retryable && (info.status === "failed" || info.status === "canceled");
  $: hasActions = showCancel || showRetry;
  // From the start, "retry from the failed step" is "retry all".
  $: showRetryAll = showRetry && info.counts.complete > 0;

  $: syncTimer(mounted, info.counts.running > 0);

  /**
   * One interval for the whole list, only while a step runs.
   * @param {boolean} isMounted
   * @param {boolean} active
   */
  function syncTimer(isMounted, active) {
    if (!isMounted || !active) {
      clearInterval(timer);
      timer = undefined;
      return;
    }
    now = Date.now();
    if (timer === undefined) {
      timer = setInterval(() => {
        now = Date.now();
      }, 1000);
    }
  }

  /**
   * @param {boolean} assertive
   * @param {string} text
   */
  function setRegion(assertive, text) {
    if (assertive) assertiveText = text;
    else politeText = text;
  }

  // One message in each region at a time. The other region is emptied, so
  // a failure's text is not left behind once the list moves on.
  /**
   * @param {string} text
   * @param {boolean} assertive
   */
  function speak(text, assertive) {
    const repeated = (assertive ? assertiveText : politeText) === text;
    setRegion(!assertive, "");
    // The same text twice is no change to the region and would stay
    // silent, so it is emptied first.
    setRegion(assertive, repeated ? "" : text);
    if (repeated) Promise.resolve().then(() => setRegion(assertive, text));
  }

  const speaker = createThrottledSpeaker(speak, () => announceDelay);

  /** @type {Map<string, TaskStatus> | undefined} */
  let prevStatuses;
  let prevStatus = /** @type {TaskSummary["status"]} */ ("pending");

  $: track(steps, info, announce);

  /**
   * Announce edges: the whole list finishing, failing or being canceled
   * goes out at once, and other progress goes out throttled. A list that
   * mounts in any state says nothing.
   * @param {ReadonlyArray<TaskStep>} current
   * @param {TaskSummary} next
   * @param {boolean} enabled
   */
  function track(current, next, enabled) {
    const before = prevStatuses;
    const beforeStatus = prevStatus;
    prevStatuses = new Map(
      current.map((step) => [step.id, normalizeStatus(step.status)]),
    );
    prevStatus = next.status;
    if (!before || !enabled || next.status === "pending") return;
    if (
      current.every(
        (step) => before.get(step.id) === normalizeStatus(step.status),
      )
    ) {
      return;
    }

    const aboutStep =
      next.step && (next.status === "failed" || next.status === "running");
    const text = announceText
      ? announceText(next)
      : aboutStep
        ? `${summaryText(next)}: ${next.step?.label}`
        : summaryText(next);
    if (!text) return;

    const finished = next.status !== "running";
    if (finished && next.status !== beforeStatus) {
      speaker.now(text, next.status === "failed");
    } else {
      speaker.progress(text);
    }
  }

  /** @param {string} stepId */
  function toggleError(stepId) {
    expandedIds = expandedSet.has(stepId)
      ? expandedIds.filter((expandedId) => expandedId !== stepId)
      : [...expandedIds, stepId];
  }

  /** @param {string | Error} error */
  function errorToText(error) {
    return typeof error === "string" ? error : error.message || String(error);
  }

  function handleCancel() {
    dispatch("cancel");
  }

  /** @param {"failed" | "start"} from */
  function handleRetry(from) {
    dispatch("retry", { from, index: info.index });
  }

  // A button that has focus is gone once its press changes the list: Cancel
  // after a cancel, Retry once it runs. Focus would fall to the page, so it
  // moves to the next action, or to the summary.
  let heldFocus = false;

  function restoreFocus() {
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const target = actionsRef?.querySelector("button") ?? summaryRef;
    if (target) focusQuietly(target);
  }

  beforeUpdate(() => {
    heldFocus =
      typeof document !== "undefined" &&
      actionsRef != null &&
      actionsRef.contains(document.activeElement);
  });

  // Svelte 3 and 4 run this after the DOM changed. Svelte 5 can run it
  // first, with the button still there, so the check runs again after.
  afterUpdate(() => {
    if (!heldFocus) return;
    heldFocus = false;
    restoreFocus();
    queueMicrotask(restoreFocus);
  });

  onMount(() => {
    mounted = true;
    return () => {
      speaker.cancel();
      clearInterval(timer);
    };
  });
</script>

<div
  {id}
  class:bx--task-status-list={true}
  class:bx--task-status-list--sm={size === "sm"}
  {...wrapperProps}
>
  {#if !hideSummary || hasActions}
    <div class:bx--task-status-list__header={true}>
      {#if !hideSummary}
        <p
          bind:this={summaryRef}
          id="{id}-summary"
          class:bx--task-status-list__summary={true}
          tabindex="-1"
        >
          <slot
            name="summary"
            status={info.status}
            counts={info.counts}
            text={summary}>{summary}</slot
          >
        </p>
      {/if}
      {#if hasActions}
        <div bind:this={actionsRef} class:bx--task-status-list__actions={true}>
          {#if showRetry}
            <Button size="small" on:click={() => handleRetry("failed")}>
              {retryText(info)}
            </Button>
          {/if}
          {#if showRetryAll}
            <Button
              size="small"
              kind="tertiary"
              on:click={() => handleRetry("start")}
            >
              {retryAllText}
            </Button>
          {/if}
          {#if showCancel}
            <Button size="small" kind="tertiary" on:click={handleCancel}>
              {cancelText}
            </Button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
  <ol
    class:bx--task-status-list__steps={true}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
  >
    {#each steps as step, index (step.id ?? index)}
      {@const status = normalizeStatus(step.status)}
      {@const duration = stepDuration(step, now)}
      {@const errorMessage = step.error ? errorToText(step.error) : ""}
      {@const expanded = expandedSet.has(step.id)}
      <li
        class:bx--task-status-list__step={true}
        class:bx--task-status-list__step--pending={status === "pending"}
        class:bx--task-status-list__step--running={status === "running"}
        class:bx--task-status-list__step--succeeded={status === "succeeded"}
        class:bx--task-status-list__step--failed={status === "failed"}
        class:bx--task-status-list__step--skipped={status === "skipped"}
        class:bx--task-status-list__step--canceled={status === "canceled"}
        aria-current={status === "running" ? "step" : undefined}
      >
        <div class:bx--task-status-list__icon={true}>
          {#if status === "running"}
            <!-- The spinner turns; where motion is reduced, CSS swaps it for the static icon. -->
            <div class:bx--task-status-list__spinner={true}>
              <div class:bx--loading={true} class:bx--loading--small={true}>
                <svg
                  class:bx--loading__svg={true}
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                >
                  <circle
                    class:bx--loading__background={true}
                    cx="50%"
                    cy="50%"
                    r="42"
                  ></circle>
                  <circle
                    class:bx--loading__stroke={true}
                    cx="50%"
                    cy="50%"
                    r="42"
                  ></circle>
                </svg>
              </div>
            </div>
            <div class:bx--task-status-list__static={true}>
              <InProgress size={iconSize} />
            </div>
          {:else}
            <svelte:component this={icons[status]} size={iconSize} />
          {/if}
        </div>
        <div class:bx--task-status-list__content={true}>
          <div class:bx--task-status-list__line={true}>
            <span
              id="{id}-step-{index}"
              class:bx--task-status-list__label={true}
            >
              <slot name="step" {step} {index} {status}>{step.label}</slot><span
                class:bx--visually-hidden={true}>, {statusText(status)}</span
              >
            </span>
            {#if duration !== undefined}
              <time
                class:bx--task-status-list__duration={true}
                datetime={isoDuration(duration)}>{durationText(duration)}</time
              >
            {/if}
          </div>
          {#if step.detail}
            <p class:bx--task-status-list__detail={true}>{step.detail}</p>
          {/if}
          {#if step.href || errorMessage}
            <div class:bx--task-status-list__meta={true}>
              {#if step.href}
                <Link
                  href={step.href}
                  size={size === "sm" ? "sm" : "md"}
                  aria-describedby="{id}-step-{index}">{logText(step)}</Link
                >
              {/if}
              {#if errorMessage}
                <Button
                  kind="ghost"
                  size="small"
                  icon={ChevronDown}
                  class="bx--task-status-list__toggle"
                  aria-expanded={expanded ? "true" : "false"}
                  aria-controls="{id}-error-{index}"
                  aria-describedby="{id}-step-{index}"
                  on:click={() => toggleError(step.id)}
                >
                  {detailsText(expanded)}
                </Button>
              {/if}
            </div>
          {/if}
          {#if errorMessage}
            <div
              id="{id}-error-{index}"
              class:bx--task-status-list__error={true}
              hidden={!expanded}
            >
              <code class:bx--task-status-list__error-text={true}
                >{errorMessage}</code
              >
            </div>
          {/if}
        </div>
      </li>
    {/each}
  </ol>
  <div
    class:bx--visually-hidden={true}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {politeText}
  </div>
  <div
    class:bx--visually-hidden={true}
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    {assertiveText}
  </div>
</div>
