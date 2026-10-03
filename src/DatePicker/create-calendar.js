// @ts-check
import { createCalendarEngine } from "./calendar.js";

/**
 * Minimal calendar instance shape used by the Carbon hooks.
 * @typedef {import("./calendar.js").CalendarInstance} CalendarInstance
 */

/**
 * @typedef {{
 *   options: {
 *     locale?: string;
 *     mode?: import("./calendar.js").CalendarMode;
 *     dateFormat?: string;
 *     altFormat?: string;
 *     errorHandler?: (error: Error) => void;
 *     [option: string]: unknown;
 *   };
 *   base: HTMLInputElement;
 *   input: HTMLInputElement;
 *   dispatch: (event: string, detail?: unknown) => void;
 *   isDayBlocked?: (date: Date, instance: CalendarInstance) => boolean;
 * }} CreateCalendarArgs
 */

const MIRRORED_ATTRIBUTES = [
  "class",
  "disabled",
  "readonly",
  "placeholder",
  "pattern",
  "aria-describedby",
  "aria-invalid",
  "data-invalid",
];

/**
 * flatpickr copies the original input's attributes onto its `altInput` once,
 * at creation. Svelte keeps updating the original, which is hidden, so keep
 * the visible one in sync for state that changes later (`disabled`,
 * `readonly`, `invalid`).
 *
 * @param {HTMLInputElement} source
 * @param {HTMLInputElement} target
 * @returns {MutationObserver}
 */
function mirrorInputState(source, target) {
  function sync() {
    for (const name of MIRRORED_ATTRIBUTES) {
      if (name === "class") {
        // Only Carbon's classes: both inputs carry flatpickr's own as well.
        for (const token of [...target.classList]) {
          if (token.startsWith("bx--") && !source.classList.contains(token)) {
            target.classList.remove(token);
          }
        }
        for (const token of source.classList) {
          if (token.startsWith("bx--")) target.classList.add(token);
        }
        continue;
      }
      const value = source.getAttribute(name);
      if (value === null) target.removeAttribute(name);
      else target.setAttribute(name, value);
    }
  }

  sync();
  const observer = new MutationObserver(sync);
  observer.observe(source, {
    attributes: true,
    attributeFilter: MIRRORED_ATTRIBUTES,
  });
  return observer;
}

const FORWARDED_EVENTS = ["focus", "blur", "keydown", "keyup", "paste"];

/**
 * Consumer handlers (`on:focus`, `on:keydown`, ...) and Carbon's own are
 * bound to the original input, which `altInput` hides. Replay what happens
 * on the visible input there. The listeners die with the `altInput`.
 *
 * @param {HTMLInputElement} source
 * @param {HTMLInputElement} target
 */
function forwardInputEvents(source, target) {
  for (const type of FORWARDED_EVENTS) {
    source.addEventListener(type, (event) => {
      const EventType = /** @type {typeof Event} */ (event.constructor);
      const replay = new EventType(event.type, event);
      target.dispatchEvent(replay);
      if (replay.defaultPrevented) event.preventDefault();
    });
  }
}

/** @type {WeakMap<object, Record<string, Function[]>>} */
const hooksByInstance = new WeakMap();

/**
 * flatpickr accepts a hook as a single function or an array of them.
 *
 * @param {unknown} hook
 * @returns {Function[]}
 */
function toHookArray(hook) {
  if (Array.isArray(hook)) return hook;
  return hook ? [/** @type {Function} */ (hook)] : [];
}

/**
 * Carries the current `errorHandler` for a running calendar. flatpickr's own
 * `calendar.set("errorHandler", fn)` replaces `config.errorHandler` outright,
 * which would drop Carbon's wrapper (and the `error` event it dispatches), so
 * reactive updates go through `setErrorHandler` and this map instead.
 * @type {WeakMap<CalendarInstance, { current: ((error: Error) => void) | undefined }>}
 */
const errorHandlerBoxes = new WeakMap();

/**
 * @param {CalendarInstance} instance
 * @param {((error: Error) => void) | undefined} handler
 */
export function setErrorHandler(instance, handler) {
  const box = errorHandlerBoxes.get(instance);
  if (box) box.current = handler;
}

/**
 * Builds the calendar synchronously, as soon as the input is mounted: moving
 * the input into the calendar's wrapper would otherwise blur it if the user,
 * or a test, focused it in the meantime.
 *
 * @param {CreateCalendarArgs} args
 * @returns {Promise<CalendarInstance | null>}
 */
export function createCalendar(args) {
  return Promise.resolve(buildCalendar(args));
}

/**
 * @param {CreateCalendarArgs} args
 * @returns {CalendarInstance | null}
 */
function buildCalendar({ options, base, input, dispatch, isDayBlocked }) {
  /** @type {MutationObserver | undefined} */
  let altInputObserver;

  /**
   * Runs before the engine removes the `altInput`, so hand the id back or
   * the label would point at nothing once the calendar is rebuilt without
   * one.
   *
   * @param {any} _s
   * @param {any} _d
   * @param {CalendarInstance} instance
   */
  function disconnectAltInputObserver(_s, _d, instance) {
    altInputObserver?.disconnect();
    altInputObserver = undefined;
    if (instance?.altInput?.id) {
      instance.input.id = instance.altInput.id;
      instance.altInput.removeAttribute("id");
    }
    // `prepareOnReady` moved an inline calendar out of the engine's mount
    // point. Teardown unwraps `calendarContainer.parentNode`, so put the
    // calendar back or it dismantles Carbon's own container instead.
    if (options.inline && instance?.calendarContainer) {
      instance.input.parentNode?.appendChild(instance.calendarContainer);
    }
  }

  const errorHandlerBox = { current: options.errorHandler };

  /**
   * `errorHandler` is a single function, not a hook array, and it never says
   * which input produced the bad text. The focused range input (if any) is
   * assumed to be the source, since that is the field the engine just tried
   * to parse; `base` is the only candidate otherwise.
   * @param {Error} error
   */
  function handleParseError(error) {
    const value =
      input && document.activeElement === input ? input.value : base.value;
    dispatch("error", { error, value });
    const userErrorHandler = errorHandlerBox.current;
    if (userErrorHandler) {
      userErrorHandler(error);
    } else {
      console.warn(error);
    }
  }

  /**
   * @param {any} _s
   * @param {any} _d
   * @param {CalendarInstance} instance
   */
  function prepareOnReady(_s, _d, instance) {
    // `altInput` hides the original input and shows a generated one.
    // Hand it the id so the label and `for` clicks reach a visible field.
    if (instance.altInput && instance.input.id) {
      instance.altInput.id = instance.input.id;
      instance.input.removeAttribute("id");
    }
    if (instance.altInput) {
      altInputObserver = mirrorInputState(instance.input, instance.altInput);
      forwardInputEvents(instance.altInput, instance.input);
    }
    // An `inline` calendar is always visible and never fires `onOpen`.
    if (!options.inline) return;
    // The engine mounts it next to the input, inside the wrapper whose
    // height vertically centers the calendar icon. Move it just below.
    instance.input
      .closest(".bx--date-picker-input__wrapper")
      ?.after(instance.calendarContainer);
  }

  /**
   * Carbon's own hooks. They are merged with the consumer's rather than
   * spread under `...options`, where a `flatpickrProps.onOpen` or an inline
   * `onDayCreate` would silently replace them.
   *
   * @type {Record<string, Function[]>}
   */
  const carbonHooks = {
    onChange: [() => dispatch("change")],
    onClose: [() => dispatch("close")],
    onOpen: [() => dispatch("open")],
    onReady: [prepareOnReady],
    onDestroy: [disconnectAltInputObserver],
  };

  /** @type {Record<string, Function[]>} */
  const mergedHooks = {};
  for (const [name, hooks] of Object.entries(carbonHooks)) {
    mergedHooks[name] = [...hooks, ...toHookArray(options[name])];
  }
  for (const name of Object.keys(options)) {
    if (name.startsWith("on") && !(name in mergedHooks)) {
      mergedHooks[name] = toHookArray(options[name]);
    }
  }

  /** @type {CalendarInstance | null} */
  let instance = null;
  try {
    instance = createCalendarEngine(base, {
      allowInput: true,
      animate: false,
      clickOpens: true,
      ariaDateFormat: "l, F j, Y",
      ...options,
      ...mergedHooks,
      ...(options.mode === "range" && input && { secondInput: input }),
      ...(isDayBlocked && { isDayBlocked }),
      // Placed after `...options` so a consumer's own `errorHandler` (from
      // `flatpickrProps`) can never replace this wrapper; it is still
      // called, via `errorHandlerBox`, from inside `handleParseError`.
      errorHandler: handleParseError,
    });
  } catch (error) {
    // Report an init failure like flatpickr did: log it and return no
    // calendar, so callers never treat it as one.
    console.error(error);
    return null;
  }
  if (!instance) return null;
  hooksByInstance.set(instance, carbonHooks);
  errorHandlerBoxes.set(instance, errorHandlerBox);
  return instance;
}

/**
 * Value to pass to `calendar.set(name, ...)` for a consumer option, keeping
 * Carbon's hooks in front of a consumer hook instead of replacing them.
 *
 * @param {object} instance
 * @param {string} name
 * @param {unknown} value
 * @returns {unknown}
 */
export function resolveOptionValue(instance, name, value) {
  const carbonHooks = hooksByInstance.get(instance)?.[name];
  return carbonHooks ? [...carbonHooks, ...toHookArray(value)] : value;
}
