// @ts-check
import { get, writable } from "svelte/store";
import {
  createStepState,
  getStepFlags,
  goToStep,
  nextStep,
  previousStep,
  setStepComplete,
  setStepDisabled,
  setStepIds,
  setStepInvalid,
} from "../utils/step-state.js";

/**
 * @typedef {Object} StepStoreOptions
 * @property {ReadonlyArray<string>} [ids]
 * @property {number} [currentIndex]
 */

/**
 * @typedef {Object} StepStore
 * @property {import("svelte/store").Readable<import("../utils/step-state.js").StepState>["subscribe"]} subscribe
 * @property {(ids: ReadonlyArray<string>) => void} setIds
 * @property {(index: number) => boolean} goTo
 * @property {() => boolean} next
 * @property {() => boolean} back
 * @property {(id: string, complete?: boolean) => void} setComplete
 * @property {(id: string, invalid?: boolean) => void} setInvalid
 * @property {(id: string, disabled?: boolean) => void} setDisabled
 * @property {(id: string) => import("../utils/step-state.js").StepFlags} flags
 * @property {() => void} reset
 */

/**
 * Headless step navigation store for building custom wizard layouts without
 * the `Stepper` component.
 *
 * @param {StepStoreOptions} [options]
 * @returns {StepStore}
 */
export function createStepStore(options = {}) {
  const { ids = [], currentIndex = 0 } = options;
  const initial = createStepState(ids, currentIndex);
  const store = writable(initial);

  /**
   * Svelte's `writable` always notifies subscribers on `set`/`update` when
   * the value is an object, even if it's the same reference, so a plain
   * `store.update(reducer)` would break the reducers' no-op contract. Read
   * and compare manually instead, and only call `set` on an actual change.
   *
   * @param {(state: import("../utils/step-state.js").StepState) => import("../utils/step-state.js").StepState} reducer
   * @returns {boolean}
   */
  function apply(reducer) {
    const current = get(store);
    const next = reducer(current);
    if (next === current) return false;
    store.set(next);
    return true;
  }

  /**
   * @param {ReadonlyArray<string>} ids
   */
  function setIds(ids) {
    apply((state) => setStepIds(state, ids));
  }

  /**
   * @param {number} index
   */
  function goTo(index) {
    return apply((state) => goToStep(state, index));
  }

  function next() {
    return apply(nextStep);
  }

  function back() {
    return apply(previousStep);
  }

  /**
   * @param {string} id
   * @param {boolean} [complete]
   */
  function setComplete(id, complete = true) {
    apply((state) => setStepComplete(state, id, complete));
  }

  /**
   * @param {string} id
   * @param {boolean} [invalid]
   */
  function setInvalid(id, invalid = true) {
    apply((state) => setStepInvalid(state, id, invalid));
  }

  /**
   * @param {string} id
   * @param {boolean} [disabled]
   */
  function setDisabled(id, disabled = true) {
    apply((state) => setStepDisabled(state, id, disabled));
  }

  /**
   * @param {string} id
   */
  function flags(id) {
    return getStepFlags(get(store), id);
  }

  function reset() {
    store.set(initial);
  }

  return {
    subscribe: store.subscribe,
    setIds,
    goTo,
    next,
    back,
    setComplete,
    setInvalid,
    setDisabled,
    flags,
    reset,
  };
}
