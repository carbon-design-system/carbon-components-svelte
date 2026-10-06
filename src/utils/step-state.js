// @ts-check
import { clampIndex } from "./clamp-index.js";

/**
 * @typedef {Object} StepState
 * @property {ReadonlyArray<string>} ids       Step ids in display order
 * @property {number} currentIndex            -1 when `ids` is empty
 * @property {ReadonlySet<string>} completed
 * @property {ReadonlySet<string>} invalid
 * @property {ReadonlySet<string>} disabled
 */

/**
 * @typedef {Object} StepFlags
 * @property {number} index    -1 when the id is unknown
 * @property {boolean} current
 * @property {boolean} complete
 * @property {boolean} invalid
 * @property {boolean} disabled
 */

/**
 * @param {ReadonlyArray<string>} a
 * @param {ReadonlyArray<string>} b
 * @returns {boolean}
 */
function shallowEqual(a, b) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * @param {ReadonlySet<string>} set
 * @param {ReadonlyArray<string>} ids
 * @returns {ReadonlySet<string>}
 */
function pruneSet(set, ids) {
  if (set.size === 0) return set;
  const idSet = new Set(ids);
  let changed = false;
  const next = new Set();
  for (const id of set) {
    if (idSet.has(id)) {
      next.add(id);
    } else {
      changed = true;
    }
  }
  return changed ? next : set;
}

/**
 * @param {StepState} state
 * @param {number} index
 * @returns {boolean}
 */
function isEnabledIndex(state, index) {
  const id = state.ids[index];
  return id !== undefined && !state.disabled.has(id);
}

/**
 * @param {ReadonlyArray<string>} [ids]
 * @param {number} [currentIndex]
 * @returns {StepState}
 */
export function createStepState(ids = [], currentIndex = 0) {
  return {
    ids,
    currentIndex: clampIndex(currentIndex, 0, ids.length),
    completed: new Set(),
    invalid: new Set(),
    disabled: new Set(),
  };
}

/**
 * @param {StepState} state
 * @param {ReadonlyArray<string>} ids
 * @returns {StepState}
 */
export function setStepIds(state, ids) {
  const completed = pruneSet(state.completed, ids);
  const invalid = pruneSet(state.invalid, ids);
  const disabled = pruneSet(state.disabled, ids);

  if (
    shallowEqual(state.ids, ids) &&
    completed === state.completed &&
    invalid === state.invalid &&
    disabled === state.disabled
  ) {
    return state;
  }

  const currentId = state.ids[state.currentIndex];
  const survivedIndex = currentId === undefined ? -1 : ids.indexOf(currentId);

  const currentIndex =
    survivedIndex === -1
      ? clampIndex(state.currentIndex, 0, ids.length)
      : survivedIndex;

  return { ids, currentIndex, completed, invalid, disabled };
}

/**
 * @param {StepState} state
 * @param {number} index
 * @returns {StepState}
 */
export function goToStep(state, index) {
  const clamped = clampIndex(index, 0, state.ids.length);
  if (clamped === state.currentIndex) return state;
  if (!isEnabledIndex(state, clamped)) return state;
  return { ...state, currentIndex: clamped };
}

/**
 * @param {StepState} state
 * @returns {StepState}
 */
export function nextStep(state) {
  for (let i = state.currentIndex + 1; i < state.ids.length; i++) {
    if (isEnabledIndex(state, i)) {
      return { ...state, currentIndex: i };
    }
  }
  return state;
}

/**
 * @param {StepState} state
 * @returns {StepState}
 */
export function previousStep(state) {
  for (let i = state.currentIndex - 1; i >= 0; i--) {
    if (isEnabledIndex(state, i)) {
      return { ...state, currentIndex: i };
    }
  }
  return state;
}

/**
 * @param {StepState} state
 * @returns {boolean}
 */
export function isFirstStep(state) {
  for (let i = 0; i < state.currentIndex; i++) {
    if (isEnabledIndex(state, i)) return false;
  }
  return true;
}

/**
 * @param {StepState} state
 * @returns {boolean}
 */
export function isLastStep(state) {
  for (let i = state.currentIndex + 1; i < state.ids.length; i++) {
    if (isEnabledIndex(state, i)) return false;
  }
  return true;
}

/**
 * @param {StepState} state
 * @param {ReadonlySet<string>} set
 * @param {string} id
 * @param {boolean} flag
 * @returns {ReadonlySet<string>}
 */
function toggleMembership(state, set, id, flag) {
  if (!state.ids.includes(id)) return set;
  const has = set.has(id);
  if (has === flag) return set;
  const next = new Set(set);
  if (flag) {
    next.add(id);
  } else {
    next.delete(id);
  }
  return next;
}

/**
 * @param {StepState} state
 * @param {string} id
 * @param {boolean} [complete]
 * @returns {StepState}
 */
export function setStepComplete(state, id, complete = true) {
  const completed = toggleMembership(state, state.completed, id, complete);
  if (completed === state.completed) return state;
  return { ...state, completed };
}

/**
 * @param {StepState} state
 * @param {string} id
 * @param {boolean} [invalid]
 * @returns {StepState}
 */
export function setStepInvalid(state, id, invalid = true) {
  const nextInvalid = toggleMembership(state, state.invalid, id, invalid);
  if (nextInvalid === state.invalid) return state;
  return { ...state, invalid: nextInvalid };
}

/**
 * @param {StepState} state
 * @param {string} id
 * @param {boolean} [disabled]
 * @returns {StepState}
 */
export function setStepDisabled(state, id, disabled = true) {
  const nextDisabled = toggleMembership(state, state.disabled, id, disabled);
  if (nextDisabled === state.disabled) return state;
  return { ...state, disabled: nextDisabled };
}

/**
 * @param {StepState} state
 * @param {string} id
 * @returns {StepFlags}
 */
export function getStepFlags(state, id) {
  const index = state.ids.indexOf(id);
  return {
    index,
    current: index !== -1 && index === state.currentIndex,
    complete: state.completed.has(id),
    invalid: state.invalid.has(id),
    disabled: state.disabled.has(id),
  };
}
