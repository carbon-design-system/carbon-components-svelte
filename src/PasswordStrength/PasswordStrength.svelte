<script>
  /**
   * @restProps {div}
   * @event {{ level: "empty" | "weak" | "fair" | "good" | "strong"; score: 0 | 1 | 2 | 3 | 4; previousLevel: "empty" | "weak" | "fair" | "good" | "strong" }} change
   * @event {unknown} error
   */

  /**
   * @typedef {object} PasswordStrengthTexts
   * @property {string} [empty]
   * @property {string} [weak]
   * @property {string} [fair]
   * @property {string} [good]
   * @property {string} [strong]
   */

  /**
   * @typedef {object} PasswordEstimateLike
   * @property {number} score - 0 to 4, as zxcvbn: 0 and 1 are weak, 2 fair, 3 good, 4 strong.
   * @property {{ warning?: string | null, suggestions?: string[] }} [feedback] - Codes of `feedbackTexts`, or text to show as is (zxcvbn-ts returns text).
   */

  /**
   * Specify the password to rate.
   * It is read and never stored, logged, or sent in an event.
   */
  export let value = "";

  /**
   * Specify strings the password should not contain, such as a name or
   * email address. An email contributes its local part and its domain.
   * @type {string[]}
   */
  export let userInputs = [];

  /**
   * Replace the built-in estimator, for example with zxcvbn-ts or a call to
   * your server. It may return a promise: a result that arrives after the
   * password changed again is dropped, and `signal` is aborted. If it throws,
   * the built-in estimate is shown and `error` is dispatched.
   * @type {((password: string, context: { userInputs: string[]; signal: AbortSignal }) => PasswordEstimateLike | Promise<PasswordEstimateLike>) | undefined}
   */
  export let estimate = undefined;

  /** Specify the time (ms) to wait after the last keystroke before calling `estimate`. */
  export let estimateDelay = 300;

  /**
   * Replace the common-password list the built-in estimator uses.
   * Pass `decodeBlocklist(commonPasswords10k)` for the top 10,000.
   * @type {import("./blocklist.js").Blocklist | Iterable<string> | undefined}
   */
  export let blocklist = undefined;

  /** Specify the label text. */
  export let labelText = "Password strength";

  /** Set to `true` to visually hide the label text. */
  export let hideLabel = false;

  /**
   * Override the text for each level. It is shown, and read as
   * `valueText(level text)`.
   * @type {PasswordStrengthTexts}
   */
  export let levelTexts = {};

  /**
   * Override the `aria-valuetext` and the announcement, for example
   * `(level) => "Strength: " + level`. Receives the level text.
   * @type {(level: string) => string}
   */
  export let valueText = function valueText(level) {
    return `Strength: ${level}`;
  };

  /**
   * Override the feedback text. Keys are the warning and suggestion codes
   * of the built-in estimator.
   * @type {Record<string, string>}
   */
  export let feedbackTexts = {};

  /** Set to `false` to hide the warning and suggestions. */
  export let showFeedback = true;

  /**
   * Specify the size of the bar.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /** Specify the time (ms) typing must pause before the strength is announced. */
  export let announceDelay = PAUSE_ANNOUNCEMENT_DELAY_MS;

  /**
   * Specify the result of the last estimate. It never holds the password.
   * @type {import("./estimate.js").PasswordEstimate | undefined}
   * @bindable readonly
   */
  export let result = undefined;

  /**
   * Set an id for the root element, which `aria-describedby` on the input
   * can point to: it holds the label, the level and the feedback.
   * The label and feedback ids derive from it as `{id}-label` and
   * `{id}-feedback`.
   */
  export let id = uniqueId();

  /**
   * Announce a pending strength now, for example on blur of the input:
   * `<PasswordInput on:blur={() => strength.flush()} />`.
   */
  export function flush() {
    announcement.flush();
  }

  import { createEventDispatcher, onMount } from "svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import {
    createPauseAnnouncer,
    PAUSE_ANNOUNCEMENT_DELAY_MS,
  } from "../utils/pause-announcer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    DEFAULT_FEEDBACK_TEXTS,
    estimatePasswordStrength,
    levelFromScore,
  } from "./estimate.js";

  const dispatch = createEventDispatcher();
  const announcement = createPauseAnnouncer(announceDelay);

  const LEVELS = ["empty", "weak", "fair", "good", "strong"];
  const DEFAULT_LEVEL_TEXTS = {
    empty: "None",
    weak: "Weak",
    fair: "Fair",
    good: "Good",
    strong: "Strong",
  };

  let mounted = false;
  let pending = false;
  let runId = 0;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {AbortController | undefined} */
  let controller;
  /** @type {string} */
  let previousLevel = "empty";

  /**
   * @param {PasswordEstimateLike} raw
   * @param {string} password
   * @returns {import("./estimate.js").PasswordEstimate}
   */
  function normalize(raw, password) {
    const score = /** @type {0 | 1 | 2 | 3 | 4} */ (
      Math.min(4, Math.max(0, Math.round(Number(raw?.score) || 0)))
    );
    const bits = Number(/** @type {any} */ (raw)?.bits) || 0;
    return {
      ...estimatePasswordStrength(""),
      score,
      level: password ? levelFromScore(score) : "empty",
      bits,
      length: [...password].length,
      feedback: {
        warning: raw?.feedback?.warning || null,
        suggestions: raw?.feedback?.suggestions ?? [],
      },
    };
  }

  function stop() {
    clearTimeout(timer);
    controller?.abort();
    controller = undefined;
  }

  /**
   * @param {string} password
   * @param {string[]} inputs
   * @param {typeof blocklist} list
   * @param {typeof estimate} custom
   * @param {number} delay
   * @param {boolean} ready
   */
  function run(password, inputs, list, custom, delay, ready) {
    const id = ++runId;
    stop();
    const local = () =>
      estimatePasswordStrength(password, {
        userInputs: inputs,
        blocklist: list,
      });
    if (!custom || !password || !ready) {
      pending = false;
      result = local();
      return;
    }
    // Keep the last result on screen while the custom estimate is on its way.
    if (!result) result = local();
    pending = true;
    timer = setTimeout(async () => {
      controller = new AbortController();
      try {
        const raw = await custom(password, {
          userInputs: inputs,
          signal: controller.signal,
        });
        if (id === runId) result = normalize(raw, password);
      } catch (error) {
        if (id === runId) {
          result = local();
          dispatch("error", error);
        }
      } finally {
        if (id === runId) pending = false;
      }
    }, delay);
  }

  $: run(value ?? "", userInputs, blocklist, estimate, estimateDelay, mounted);

  // Consumer naming and description go on the `role="meter"` element.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  $: level = result?.level ?? "empty";
  $: segments = LEVELS.indexOf(level);
  $: texts = { ...DEFAULT_LEVEL_TEXTS, ...levelTexts };
  $: levelText = texts[level] ?? "";
  $: allFeedbackTexts = { ...DEFAULT_FEEDBACK_TEXTS, ...feedbackTexts };
  $: warning = result?.feedback.warning
    ? (allFeedbackTexts[result.feedback.warning] ?? result.feedback.warning)
    : "";
  $: suggestions = (result?.feedback.suggestions ?? []).map(
    (code) => allFeedbackTexts[code] ?? code,
  );
  $: hasFeedback = showFeedback && !!(warning || suggestions.length);
  $: label = valueText(levelText);
  $: if (level !== previousLevel && result) {
    const prev = previousLevel;
    previousLevel = level;
    if (mounted)
      dispatch("change", { level, score: result.score, previousLevel: prev });
  }

  // Speak the level (and why) once typing pauses. A custom estimate that is
  // still on its way says nothing yet.
  $: if (mounted && !pending) {
    // Every keystroke restarts the wait, whether or not the text changed.
    value;
    announcement.schedule(
      level === "empty" ? "" : warning ? `${label}. ${warning}` : label,
    );
  }

  onMount(() => {
    announcement.prime(
      level === "empty" ? "" : warning ? `${label}. ${warning}` : label,
    );
    mounted = true;
    return () => {
      stop();
      announcement.cancel();
    };
  });
</script>

<div
  {id}
  class:bx--password-strength={true}
  class:bx--password-strength--sm={size === "sm"}
  class:bx--password-strength--weak={level === "weak"}
  class:bx--password-strength--fair={level === "fair"}
  class:bx--password-strength--good={level === "good"}
  class:bx--password-strength--strong={level === "strong"}
  {...wrapperProps}
>
  <div class:bx--password-strength__label={true}>
    <span
      id="{id}-label"
      class:bx--password-strength__label-text={true}
      class:bx--visually-hidden={hideLabel}
    >
      {labelText}
    </span>
    {#if level !== "empty"}
      <span class:bx--password-strength__level={true}>{levelText}</span>
    {/if}
  </div>
  <div
    role="meter"
    class:bx--password-strength__track={true}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : `${id}-label`)}
    aria-valuemin={0}
    aria-valuemax={4}
    aria-valuenow={segments}
    aria-valuetext={label}
    aria-busy={pending ? "true" : undefined}
    aria-describedby={joinDescribedBy(
      hasFeedback && `${id}-feedback`,
      ariaDescribedBy,
    )}
  >
    {#each [1, 2, 3, 4] as segment (segment)}
      <span
        class:bx--password-strength__segment={true}
        class:bx--password-strength__segment--filled={segment <= segments}
      ></span>
    {/each}
  </div>
  {#if hasFeedback}
    <div id="{id}-feedback" class:bx--password-strength__feedback={true}>
      {#if warning}
        <p class:bx--password-strength__warning={true}>{warning}</p>
      {/if}
      {#if suggestions.length}
        <!-- Safari drops the list role of a list with no bullets. -->
        <!-- svelte-ignore a11y-no-redundant-roles -->
        <ul role="list" class:bx--password-strength__suggestions={true}>
          {#each suggestions as suggestion (suggestion)}
            <li>{suggestion}</li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
<div
  class:bx--visually-hidden={true}
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {$announcement}
</div>
