<script>
  /**
   * @typedef {import("../utils/checklist-store.js").ChecklistTask} OnboardingChecklistTask
   * @restProps {div}
   * @slot {{ allSet: boolean }} complete - Replaces the "All set" description with your own content.
   * @event {{ id: string, checked: boolean }} check - Fires when the user checks or unchecks a task.
   * @event {{ id: string }} skip - Fires when the user skips an optional task.
   * @event {{ id: string }} unskip - Fires when the user undoes a skip.
   * @event {{ id: string, task: OnboardingChecklistTask }} action - Fires when a task's link or button is activated.
   * @event {{ allSet: true }} complete - Fires each time every task becomes done.
   * @event {null} dismiss - Fires when the dismiss button is pressed. Call `preventDefault()` to keep the checklist.
   */

  /**
   * Specify the tasks. A task is `{ id, title, description, section, cta,
   * completed, optional }`. Set `completed` to a boolean for a task the app
   * detects; leave it unset for a task the user checks.
   * @type {ReadonlyArray<OnboardingChecklistTask>}
   */
  export let tasks = [];

  /**
   * Specify the checklist's title. It names the region and the dismiss button.
   */
  export let title = "Getting started";

  /**
   * Specify the id. It is the DOM id, with the title, body and progress ids
   * derived from it, and the suffix of the default storage key.
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Provide the store that remembers what the user did. Defaults to the store
   * `setChecklistStore` shared, then to one of the component's own in
   * `localStorage`, under `carbon:onboarding:{id}`.
   * @type {import("../utils/checklist-store.js").ChecklistStore | undefined}
   */
  export let store = undefined;

  /**
   * Set to `true` to float the checklist in the bottom corner. Minimizing it
   * leaves a launcher button.
   */
  export let floating = false;

  /**
   * Set to `true` to hide the tasks and keep the header and progress. It sets
   * itself when every task becomes done.
   * @bindable writable
   */
  export let collapsed = false;

  /** Set to `false` to hide the dismiss button. */
  export let dismissible = true;

  /**
   * Specify the heading level of the title, to fit the page outline. Section
   * headings are one level lower. Inside a `Section`, defaults to one level
   * below the section's heading; otherwise to 2.
   * @type {1 | 2 | 3 | 4 | 5 | 6 | undefined}
   */
  export let headingLevel = undefined;

  /**
   * Specify the progress text, the ProgressBar's value text and the launcher's
   * second line.
   * @type {(complete: number, total: number) => string}
   */
  export let progressText = defaultProgressText;

  /**
   * Specify the text that says a section's progress.
   * @type {(complete: number, total: number) => string}
   */
  export let sectionProgressText = defaultProgressText;

  /** Specify the text that replaces the progress once every task is done. */
  export let allSetText = "All set";

  /** Specify the text under `allSetText`. */
  export let allSetDescriptionText = "You finished every task.";

  /**
   * Specify the text a screen reader hears, once, when every task becomes
   * done.
   * @type {(title: string) => string}
   */
  export let allSetAnnouncementText = defaultAllSetAnnouncement;

  /**
   * Specify the text a screen reader hears when the app completes a task.
   * @type {(title: string) => string}
   */
  export let taskCompletedText = defaultTaskCompleted;

  /** Specify the label of the tag on an optional task. */
  export let optionalText = "Optional";

  /** Specify the label of the skip button. */
  export let skipText = "Skip";

  /** Specify the label of the button that undoes a skip. */
  export let unskipText = "Undo skip";

  /** Specify the text that marks a skipped task. */
  export let skippedText = "Skipped";

  /** Specify the text a screen reader hears for a task the app completed. */
  export let completedText = "Completed";

  /** Specify the text a screen reader hears for a task the app has not completed. */
  export let incompleteText = "Not completed";

  /**
   * Override the label of the dismiss button.
   * @type {(title: string) => string}
   */
  export let dismissText = defaultDismissText;

  /**
   * Override the label of the minimize button.
   * @type {(title: string) => string}
   */
  export let minimizeText = defaultMinimizeText;

  /**
   * Obtain a reference to the checklist's region element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import Link from "../Link/Link.svelte";
  import ProgressBar from "../ProgressBar/ProgressBar.svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import CircleDash from "../icons/CircleDash.svelte";
  import Close from "../icons/Close.svelte";
  import Subtract from "../icons/Subtract.svelte";
  import {
    createChecklistStore,
    getChecklistStore,
    localChecklistStorage,
    resolveChecklist,
  } from "../utils/checklist-store.js";
  import { returnFocus } from "../utils/focus.js";
  import { uniqueId } from "../utils/unique-id.js";
  import OnboardingChecklistLauncher from "./OnboardingChecklistLauncher.svelte";

  /**
   * @param {number} complete
   * @param {number} total
   */
  function defaultProgressText(complete, total) {
    return `${complete} of ${total} complete`;
  }

  /** @param {string} title */
  function defaultAllSetAnnouncement(title) {
    return `All set. ${title} is complete.`;
  }

  /** @param {string} title */
  function defaultTaskCompleted(title) {
    return `Completed: ${title}`;
  }

  /** @param {string} title */
  function defaultDismissText(title) {
    return title ? `Dismiss ${title}` : "Dismiss";
  }

  /** @param {string} title */
  function defaultMinimizeText(title) {
    return title ? `Minimize ${title}` : "Minimize";
  }

  const dispatch = createEventDispatcher();
  const fallbackId = uniqueId();
  const sharedStore = getChecklistStore();

  // Undefined outside a `Section`; `$sectionLevel` is read only when it is set.
  /** @type {import("svelte/store").Readable<1 | 2 | 3 | 4 | 5 | 6>} */
  const sectionLevel = getContext("carbon:Section");

  /** @type {import("../utils/checklist-store.js").ChecklistStore | undefined} */
  let ownStore;
  /** @type {import("../utils/checklist-store.js").ChecklistStore | undefined} */
  let connectedStore;
  /** @type {undefined | (() => void)} */
  let disconnect;

  let mounted = false;
  /** @type {null | HTMLButtonElement} */
  let toggleRef = null;
  /** @type {null | HTMLButtonElement} */
  let launcherRef = null;
  /** @type {null | HTMLElement} */
  let prevFocus = null;

  // The tracking below compares each render with the one before it.
  /** @type {boolean | undefined} */
  let prevAllSet;
  /** @type {Set<string> | undefined} */
  let prevComplete;
  let celebrating = false;
  let announcement = "";

  onMount(() => {
    mounted = true;
    return () => disconnect?.();
  });

  /**
   * @param {import("../utils/checklist-store.js").ChecklistStore | undefined} given
   * @param {string | undefined} key
   */
  function resolveStore(given, key) {
    if (given) return given;
    if (sharedStore) return sharedStore;
    ownStore ??= createChecklistStore({
      storage: localChecklistStorage(
        key === undefined ? undefined : `carbon:onboarding:${key}`,
      ),
    });
    return ownStore;
  }

  /** @param {import("../utils/checklist-store.js").ChecklistStore} target */
  function connect(target) {
    if (target === connectedStore) return;
    disconnect?.();
    connectedStore = target;
    disconnect = target.connect();
  }

  $: checklist = resolveStore(store, id);
  // The store reads its storage once the component is mounted, never while
  // the server or the first client render runs, so both agree.
  $: if (mounted) connect(checklist);

  $: baseId = id ?? fallbackId;
  $: titleId = `${baseId}-title`;
  $: bodyId = `${baseId}-body`;
  $: progressId = `${baseId}-progress`;
  $: headingTag = `h${
    headingLevel ?? (sectionLevel ? Math.min($sectionLevel + 1, 6) : 2)
  }`;
  $: sectionHeadingTag = `h${Math.min(Number(headingTag.slice(1)) + 1, 6)}`;

  $: progress = resolveChecklist(tasks, $checklist);
  $: ({ allSet } = progress);
  $: visible = $checklist.ready
    ? !$checklist.dismissed
    : $checklist.pending === "show";
  $: minimized = floating && $checklist.minimized;

  $: track(progress, $checklist.ready, $checklist.celebrated);

  /**
   * Notice what changed since the last render: the first render only
   * records, so a user who comes back to a finished checklist sees it
   * collapsed, with no animation and nothing announced.
   *
   * @param {import("../utils/checklist-store.js").ChecklistProgress} next
   * @param {boolean} ready
   * @param {boolean} celebrated
   */
  function track(next, ready, celebrated) {
    if (!ready) return;
    const nowComplete = new Set(
      next.items
        .filter((item) => item.appOwned && item.status === "complete")
        .map((item) => item.task.id),
    );
    if (prevAllSet === undefined || prevComplete === undefined) {
      prevAllSet = next.allSet;
      prevComplete = nowComplete;
      if (next.allSet) collapsed = true;
      return;
    }
    const finished = next.allSet && !prevAllSet;
    if (finished) {
      collapsed = true;
      if (!celebrated) {
        celebrating = true;
        announcement = allSetAnnouncementText(title);
        checklist.celebrate();
      }
      dispatch("complete", { allSet: true });
    } else if (!next.allSet && prevAllSet) {
      collapsed = false;
      celebrating = false;
    }
    if (!finished) {
      // The app completed a task: say so, since nothing else does.
      const added = next.items.filter(
        (item) =>
          item.appOwned &&
          item.status === "complete" &&
          !(/** @type {Set<string>} */ (prevComplete).has(item.task.id)),
      );
      if (added.length > 0) {
        announcement = added
          .map((item) => taskCompletedText(item.task.title))
          .join(". ");
      }
    }
    prevAllSet = next.allSet;
    prevComplete = nowComplete;
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const from = event.relatedTarget;
    if (!(from instanceof Node && ref?.contains(from))) {
      prevFocus = from instanceof HTMLElement ? from : null;
    }
  }

  function handleToggle() {
    collapsed = !collapsed;
  }

  function handleMinimize() {
    checklist.minimize();
    // The panel is hidden, so focus would fall to the page. The launcher
    // takes its place.
    tick().then(() => launcherRef?.focus());
  }

  function handleLaunch() {
    checklist.expand();
    tick().then(() => toggleRef?.focus());
  }

  function handleDismiss() {
    if (!dispatch("dismiss", null, { cancelable: true })) return;
    const region = ref;
    const restore = region?.contains(document.activeElement) ? prevFocus : null;
    checklist.dismiss();
    // The checklist unmounts, so focus would fall to the page. Put it back
    // where it was before it entered the checklist.
    tick().then(() => returnFocus(restore, region));
  }

  /**
   * @param {import("../utils/checklist-store.js").ChecklistTask} task
   * @param {boolean} checked
   */
  function handleCheck(task, checked) {
    if (checked) checklist.check(task.id);
    else checklist.uncheck(task.id);
    dispatch("check", { id: task.id, checked });
  }

  /**
   * @param {string} taskId
   * @param {"skip" | "unskip"} action
   */
  function focusAction(taskId, action) {
    tick().then(() => {
      const row = ref?.querySelector(`[data-task-id="${CSS.escape(taskId)}"]`);
      /** @type {HTMLElement | null | undefined} */ (
        row?.querySelector(`[data-task-action="${action}"]`)
      )?.focus();
    });
  }

  /** @param {import("../utils/checklist-store.js").ChecklistTask} task */
  function handleSkip(task) {
    checklist.skip(task.id);
    dispatch("skip", { id: task.id });
    focusAction(task.id, "unskip");
  }

  /** @param {import("../utils/checklist-store.js").ChecklistTask} task */
  function handleUnskip(task) {
    checklist.unskip(task.id);
    dispatch("unskip", { id: task.id });
    focusAction(task.id, "skip");
  }

  /** @param {import("../utils/checklist-store.js").ChecklistTask} task */
  function handleAction(task) {
    dispatch("action", { id: task.id, task });
  }

  /**
   * @param {import("../utils/checklist-store.js").ChecklistItem} item
   */
  function statusText(item) {
    return item.status === "complete" ? completedText : incompleteText;
  }
</script>

{#if visible}
  <div
    class:bx--onboarding-host={true}
    class:bx--onboarding-host--floating={floating}
  >
    <div
      role="region"
      aria-labelledby={$$restProps["aria-label"] ? undefined : titleId}
      {...$$restProps}
      id={baseId}
      bind:this={ref}
      hidden={minimized || undefined}
      class:bx--onboarding={true}
      class:bx--onboarding--floating={floating}
      class:bx--onboarding--collapsed={collapsed}
      class:bx--onboarding--complete={allSet}
      on:focusin={handleFocusin}
    >
      <div class:bx--onboarding__header={true}>
        <svelte:element this={headingTag} class:bx--onboarding__heading={true}>
          <button
            bind:this={toggleRef}
            type="button"
            id={titleId}
            class:bx--onboarding__toggle={true}
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            on:click={handleToggle}
          >
            <span class:bx--onboarding__title={true}>{title}</span>
            <ChevronDown class="bx--onboarding__chevron" />
          </button>
        </svelte:element>
        <div class:bx--onboarding__actions={true}>
          {#if floating}
            <button
              type="button"
              class:bx--onboarding__icon-button={true}
              aria-label={minimizeText(title)}
              title={minimizeText(title)}
              on:click={handleMinimize}
            >
              <Subtract size={16} />
            </button>
          {/if}
          {#if dismissible}
            <button
              type="button"
              class:bx--onboarding__icon-button={true}
              aria-label={dismissText(title)}
              title={dismissText(title)}
              on:click={handleDismiss}
            >
              <Close size={16} />
            </button>
          {/if}
        </div>
      </div>

      <div class:bx--onboarding__summary={true}>
        {#if allSet}
          <div
            class:bx--onboarding__celebrate={true}
            class:bx--onboarding__celebrate--animate={celebrating}
          >
            <CheckmarkFilled size={24} class="bx--onboarding__celebrate-icon" />
            <div>
              <p class:bx--onboarding__celebrate-title={true}>{allSetText}</p>
              <div class:bx--onboarding__celebrate-text={true}>
                <slot name="complete" {allSet}>{allSetDescriptionText}</slot>
              </div>
            </div>
          </div>
        {:else}
          <ProgressBar
            id={progressId}
            size="sm"
            hideLabel
            labelText={title}
            value={progress.complete}
            max={Math.max(progress.total, 1)}
            valueText={progressText(progress.complete, progress.total)}
          />
        {/if}
      </div>

      <div id={bodyId} class:bx--onboarding__body={true}>
        <div class:bx--onboarding__body-inner={true}>
          {#each progress.sections as section, index (section.title ?? "")}
            {@const sectionId = `${baseId}-section-${index}`}
            <div
              class:bx--onboarding__section={true}
              role={section.title ? "group" : undefined}
              aria-labelledby={section.title ? sectionId : undefined}
            >
              {#if section.title}
                <svelte:element
                  this={sectionHeadingTag}
                  class:bx--onboarding__section-heading={true}
                >
                  <span id={sectionId}>{section.title}</span>
                  <span class:bx--onboarding__section-count={true}>
                    {sectionProgressText(section.complete, section.total)}
                  </span>
                </svelte:element>
              {/if}
              <ul class:bx--onboarding__tasks={true}>
                {#each section.items as item (item.task.id)}
                  {@const task = item.task}
                  {@const taskId = `${baseId}-task-${task.id}`}
                  {@const done = item.status === "complete"}
                  {@const skipped = item.status === "skipped"}
                  <li
                    data-task-id={task.id}
                    class:bx--onboarding__task={true}
                    class:bx--onboarding__task--complete={done}
                    class:bx--onboarding__task--skipped={skipped}
                  >
                    <div class:bx--onboarding__task-control={true}>
                      {#if item.appOwned}
                        <span
                          class:bx--onboarding__status={true}
                          class:bx--onboarding__status--complete={done}
                          aria-hidden="true"
                        >
                          {#if done}
                            <CheckmarkFilled size={16} />
                          {:else}
                            <CircleDash size={16} />
                          {/if}
                        </span>
                      {:else}
                        <Checkbox
                          id="{taskId}-check"
                          hideLabel
                          noMargin
                          labelText={task.title}
                          checked={done}
                          aria-labelledby="{taskId}-title"
                          aria-describedby={task.description
                            ? `${taskId}-description`
                            : undefined}
                          on:check={(event) => handleCheck(task, event.detail)}
                        />
                      {/if}
                    </div>
                    <div class:bx--onboarding__task-body={true}>
                      <div class:bx--onboarding__task-heading={true}>
                        {#if item.appOwned}
                          <span
                            id="{taskId}-title"
                            class:bx--onboarding__task-title={true}
                            >{task.title}</span
                          >
                          <span class:bx--visually-hidden={true}
                            >, {statusText(item)}</span
                          >
                        {:else}
                          <label
                            id="{taskId}-title"
                            for="{taskId}-check"
                            class:bx--onboarding__task-title={true}
                            >{task.title}</label
                          >
                        {/if}
                        {#if task.optional}
                          <span class:bx--onboarding__optional={true}
                            >{optionalText}</span
                          >
                        {/if}
                        {#if skipped}
                          <span class:bx--onboarding__skipped={true}
                            >{skippedText}</span
                          >
                        {/if}
                      </div>
                      {#if task.description}
                        <p
                          id="{taskId}-description"
                          class:bx--onboarding__task-description={true}
                        >
                          {task.description}
                        </p>
                      {/if}
                      {#if !done && (task.cta || task.optional)}
                        <div class:bx--onboarding__task-actions={true}>
                          {#if skipped}
                            <Button
                              kind="ghost"
                              size="small"
                              data-task-action="unskip"
                              aria-describedby="{taskId}-title"
                              on:click={() => handleUnskip(task)}
                            >
                              {unskipText}
                            </Button>
                          {:else}
                            {#if task.cta}
                              {#if task.cta.href}
                                <Link
                                  href={task.cta.href}
                                  size="sm"
                                  aria-describedby="{taskId}-title"
                                  on:click={() => handleAction(task)}
                                >
                                  {task.cta.text}
                                </Link>
                              {:else}
                                <Button
                                  kind="tertiary"
                                  size="small"
                                  aria-describedby="{taskId}-title"
                                  on:click={() => handleAction(task)}
                                >
                                  {task.cta.text}
                                </Button>
                              {/if}
                            {/if}
                            {#if task.optional}
                              <Button
                                kind="ghost"
                                size="small"
                                data-task-action="skip"
                                aria-describedby="{taskId}-title"
                                on:click={() => handleSkip(task)}
                              >
                                {skipText}
                              </Button>
                            {/if}
                          {/if}
                        </div>
                      {/if}
                    </div>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </div>
    </div>

    {#if minimized}
      <OnboardingChecklistLauncher
        bind:ref={launcherRef}
        {title}
        complete={progress.complete}
        total={progress.total}
        {progressText}
        {allSet}
        {allSetText}
        controls={baseId}
        on:click={handleLaunch}
      />
    {/if}

    <div
      class:bx--visually-hidden={true}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement}
    </div>
  </div>
{/if}
