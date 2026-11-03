// @ts-check

import { writable } from "svelte/store";
import { uniqueId } from "../utils/unique-id.js";

/**
 * @typedef {import("./step-flow.d.ts").StepDefinition} StepDefinition
 * @typedef {import("./step-flow.d.ts").StepInfo} StepInfo
 * @typedef {import("./step-flow.d.ts").StepFlowState} StepFlowState
 * @typedef {import("./step-flow.d.ts").StepFlowOptions} StepFlowOptions
 * @typedef {import("./step-flow.d.ts").StepFlowFocusRequest} StepFlowFocusRequest
 * @typedef {"ok" | "invalid" | "error" | "stale"} CheckResult
 */

/** @param {unknown} value */
function isThenable(value) {
  return (
    typeof (/** @type {PromiseLike<unknown>} */ (value)?.then) === "function"
  );
}

/**
 * Create the state of a multi-step "create" flow: which step is current, which
 * are complete, whether a validation or the submit is running, and the error
 * of the last one that failed. It touches no DOM, so a flow can be made on the
 * server.
 *
 * @param {StepFlowOptions} [options]
 * @returns {import("./step-flow.d.ts").StepFlow}
 */
export function createStepFlow(options = {}) {
  const id = options.id ?? uniqueId("ccs-create-flow");
  const linear = options.linear !== false;
  const optionalText = options.optionalText ?? "Optional";

  /** @type {StepDefinition[]} */
  let defs = [...(options.steps ?? [])];
  /** Ids of steps that passed validation (or that the owner marked). */
  const done = new Set();
  /** Ids of steps the user has been on. */
  const seen = new Set();
  /** Ids of steps whose validation failed (or that the owner marked). */
  const flagged = new Set();
  /** @type {import("./step-flow.d.ts").StepFlowStatus} */
  let status = "idle";
  /** @type {unknown} */
  let error = null;
  /** Bumped by `reset()`, so a request that finishes after it is ignored. */
  let run = 0;
  /** @type {string | undefined} */
  let currentId = options.initial ?? defs.find((step) => !step.skipped)?.id;
  if (currentId !== undefined) seen.add(currentId);

  const focusStore = writable(
    /** @type {StepFlowFocusRequest} */ ({ target: null, count: 0 }),
  );
  let focusCount = 0;

  /** @returns {StepFlowState} */
  function compute() {
    const visible = defs.filter((step) => !step.skipped);
    let index = visible.findIndex((step) => step.id === currentId);
    if (index === -1) {
      // The step the user was on dropped out (an earlier answer skipped it):
      // move to the next one, or the last.
      const position = defs.findIndex((step) => step.id === currentId);
      index = visible.findIndex((step) => defs.indexOf(step) > position);
      if (index === -1) index = visible.length - 1;
      currentId = visible[index]?.id;
      if (currentId !== undefined) seen.add(currentId);
    }
    const submitted = status === "submitted";
    // Linear: a step can be entered once every step before it is complete.
    let lead = 0;
    while (lead < visible.length && done.has(visible[lead].id)) lead++;
    const total = visible.length;
    const steps = visible.map((step, position) => ({
      id: step.id,
      label: step.label,
      secondaryLabel:
        step.secondaryLabel ?? (step.optional ? optionalText : undefined),
      optional: step.optional === true,
      disabled: step.disabled === true,
      invalid: flagged.has(step.id) && !submitted,
      complete: submitted || done.has(step.id),
      current: position === index && !submitted,
      visited: seen.has(step.id),
      reachable:
        step.disabled !== true &&
        (!linear || position <= lead || position <= index),
      index: position,
      number: position + 1,
      total,
    }));
    const busy = status === "validating" || status === "submitting";
    return {
      id,
      steps,
      current: steps[index],
      index,
      total,
      first: index <= 0,
      last: index === total - 1,
      status,
      busy,
      submitted,
      error,
    };
  }

  let state = compute();
  const store = writable(state);

  function emit() {
    state = compute();
    store.set(state);
  }

  /** @param {StepFlowFocusRequest["target"]} target */
  function requestFocus(target) {
    focusCount += 1;
    focusStore.set({ target, count: focusCount });
  }

  /** @param {string} stepId */
  function enter(stepId) {
    currentId = stepId;
    seen.add(stepId);
    error = null;
    if (status === "failed") status = "idle";
  }

  /**
   * @param {StepInfo} step
   * @param {number} startedRun
   * @returns {Promise<CheckResult>}
   */
  async function check(step, startedRun) {
    if (!options.validate) return "ok";
    /** @type {unknown} */
    let result;
    try {
      result = options.validate(step);
      if (isThenable(result)) {
        status = "validating";
        emit();
        result = await result;
      }
    } catch (caught) {
      if (run !== startedRun) return "stale";
      error = caught;
      return "error";
    }
    if (run !== startedRun) return "stale";
    return result === false ? "invalid" : "ok";
  }

  /**
   * Land on a step that failed: show why and put focus where the user fixes it.
   * @param {StepInfo} step
   * @param {CheckResult} result
   */
  function fail(step, result) {
    status = result === "error" ? "failed" : "idle";
    if (result === "invalid") flagged.add(step.id);
    done.delete(step.id);
    if (!step.current) enter(step.id);
    emit();
    requestFocus(result === "error" ? "error" : "invalid");
  }

  async function submit() {
    const startedRun = run;
    status = "submitting";
    error = null;
    emit();
    try {
      await options.submit?.(state);
    } catch (caught) {
      if (run !== startedRun) return false;
      status = "failed";
      error = caught;
      emit();
      requestFocus("error");
      return false;
    }
    if (run !== startedRun) return false;
    status = "submitted";
    flagged.clear();
    options.unsavedChanges?.markSaved();
    emit();
    requestFocus("submitted");
    return true;
  }

  /** Whether a `next()` is in flight, from its first line to its last. */
  let advancing = false;

  async function next() {
    if (advancing || state.busy || state.submitted || !state.current) {
      return false;
    }
    advancing = true;
    try {
      return await advance();
    } finally {
      advancing = false;
    }
  }

  async function advance() {
    const startedRun = run;
    const step = state.current;
    error = null;
    const result = await check(step, startedRun);
    if (result === "stale") return false;
    if (result !== "ok") {
      fail(step, result);
      return false;
    }
    flagged.delete(step.id);
    done.add(step.id);
    if (!state.last) {
      status = "idle";
      enter(state.steps[state.index + 1].id);
      emit();
      requestFocus("step");
      return true;
    }
    // The last step submits. A step the user never completed (any step, in a
    // non-linear flow) is checked first, and the first that fails is shown.
    for (const other of state.steps) {
      if (other.complete || other.id === step.id) continue;
      // biome-ignore lint/performance/noAwaitInLoops: one check at a time; the first failure stops
      const otherResult = await check(other, startedRun);
      if (otherResult === "stale") return false;
      if (otherResult !== "ok") {
        fail(other, otherResult);
        return false;
      }
      flagged.delete(other.id);
      done.add(other.id);
    }
    return submit();
  }

  /** @param {string} stepId */
  function goTo(stepId) {
    if (state.busy || state.submitted) return false;
    const step = state.steps.find((item) => item.id === stepId);
    if (!step?.reachable) return false;
    if (step.current) return true;
    enter(stepId);
    emit();
    requestFocus("step");
    return true;
  }

  function back() {
    if (state.first) return false;
    return goTo(state.steps[state.index - 1].id);
  }

  /**
   * @param {string} stepId
   * @param {Partial<StepDefinition> & { complete?: boolean, invalid?: boolean }} patch
   */
  function update(stepId, patch) {
    const position = defs.findIndex((step) => step.id === stepId);
    if (position === -1) return;
    const { complete, invalid, ...rest } = patch;
    const before = defs[position];
    const after = { ...before, ...rest };
    const keys = /** @type {Array<keyof StepDefinition>} */ (Object.keys(rest));
    let changed = keys.some((key) => before[key] !== after[key]);
    if (changed) {
      defs = defs.map((step, i) => (i === position ? after : step));
    }
    if (complete !== undefined && complete !== done.has(stepId)) {
      if (complete) done.add(stepId);
      else done.delete(stepId);
      changed = true;
    }
    if (invalid !== undefined && invalid !== flagged.has(stepId)) {
      if (invalid) flagged.add(stepId);
      else flagged.delete(stepId);
      changed = true;
    }
    if (changed) emit();
  }

  /** @param {StepDefinition[]} steps */
  function setSteps(steps) {
    defs = [...steps];
    emit();
  }

  function reset() {
    run += 1;
    done.clear();
    seen.clear();
    flagged.clear();
    status = "idle";
    error = null;
    currentId = defs.find((step) => !step.skipped)?.id;
    if (currentId !== undefined) seen.add(currentId);
    emit();
  }

  function clearError() {
    if (error === null && status !== "failed") return;
    error = null;
    if (status === "failed") status = "idle";
    emit();
  }

  return {
    id,
    subscribe: store.subscribe,
    focus: { subscribe: focusStore.subscribe },
    next,
    back,
    goTo,
    update,
    setSteps,
    reset,
    clearError,
  };
}

/**
 * The text of the step announcement, such as `Step 2 of 4`.
 *
 * @param {{ number: number, total: number }} info
 * @returns {string}
 */
export function defaultStepText({ number, total }) {
  return `Step ${number} of ${total}`;
}
