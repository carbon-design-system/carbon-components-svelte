// @ts-check
import { getContext, setContext } from "svelte";
import { derived, readable, writable } from "svelte/store";

/**
 * @typedef {import("./context.js").MotionRole} MotionRole
 * @typedef {import("./context.js").MotionSettings} MotionSettings
 * @typedef {import("./context.js").MotionValue} MotionValue
 * @typedef {(role: MotionRole) => MotionValue} MotionResolver
 */

const MOTION_CONTEXT_KEY = "carbon:Motion";

/** Params every preset accepts, so a role setting fits each component in it. */
const SHARED_KEYS = /** @type {const} */ ([
  "delay",
  "duration",
  "easing",
  "mode",
  "reducedMotion",
]);

const hasOwn = Object.prototype.hasOwnProperty;

/** Outside any `Motion`, every role is unset. */
const unset = readable(undefined);

/**
 * Keep only the params every preset accepts. An object with none of them is
 * `true`: the role is on with its presets.
 * @param {MotionValue} value
 * @returns {MotionValue}
 */
function toValue(value) {
  if (value == null || typeof value === "boolean") return value ?? undefined;
  /** @type {Record<string, unknown> | undefined} */
  let shared;
  for (const key of SHARED_KEYS) {
    if (hasOwn.call(value, key)) {
      shared ??= {};
      shared[key] = /** @type {Record<string, unknown>} */ (value)[key];
    }
  }
  return shared ?? true;
}

/**
 * Read one role from a `Motion`'s props. `undefined` means the role is unset
 * here, so the enclosing `Motion` decides. A role prop wins over
 * `transition`; when both are on, the role's params override the shared
 * ones.
 * @param {MotionSettings} settings
 * @param {MotionRole} role
 * @returns {MotionValue}
 */
export function pickRole(settings, role) {
  const all = toValue(settings.transition);
  const own = toValue(settings[role]);
  if (own === undefined) return all;
  if (own === false) return false;
  const base = all && all !== true ? all : undefined;
  if (own === true) return base ?? true;
  return { ...base, ...own };
}

/**
 * Set the motion defaults for the components inside. Unset roles fall back
 * to the enclosing `Motion`.
 * @param {MotionSettings} initial
 * @returns {import("svelte/store").Writable<MotionSettings>}
 */
export function provideMotion(initial) {
  /** @type {import("svelte/store").Readable<MotionResolver> | undefined} */
  const parent = getContext(MOTION_CONTEXT_KEY);
  const settings = writable(initial);

  /** @type {import("svelte/store").Readable<MotionResolver>} */
  const resolver = parent
    ? derived([parent, settings], ([$parent, $settings]) =>
        /** @param {MotionRole} role */
        (role) => {
          const value = pickRole($settings, role);
          return value === undefined ? $parent(role) : value;
        },
      )
    : derived(
        settings,
        ($settings) =>
          /** @param {MotionRole} role */
          (role) =>
            pickRole($settings, role),
      );

  setContext(MOTION_CONTEXT_KEY, resolver);
  return settings;
}

/**
 * The default `transition` for a component in `role`, from the nearest
 * `Motion`. A component uses it only when its own `transition` is
 * `undefined`. Call during component init.
 * @param {MotionRole} role
 * @returns {import("svelte/store").Readable<MotionValue>}
 */
export function getMotionDefault(role) {
  /** @type {import("svelte/store").Readable<MotionResolver> | undefined} */
  const resolver = getContext(MOTION_CONTEXT_KEY);
  return resolver ? derived(resolver, ($resolve) => $resolve(role)) : unset;
}
