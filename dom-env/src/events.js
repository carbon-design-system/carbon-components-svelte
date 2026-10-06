// Event, its subclasses, and EventTarget with the DOM dispatch algorithm.

import { defineConstants, domException, str, tag } from "./shared.js";

const NONE = 0;
const CAPTURING_PHASE = 1;
const AT_TARGET = 2;
const BUBBLING_PHASE = 3;

const EMPTY = Object.freeze({});

export class Event {
  constructor(type, init) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to construct 'Event': 1 argument required.");
    }
    const i = init == null ? EMPTY : init;
    this._type = str(type);
    this._bubbles = !!i.bubbles;
    this._cancelable = !!i.cancelable;
    this._composed = !!i.composed;
    this._target = null;
    this._currentTarget = null;
    this._phase = NONE;
    this._stop = false;
    this._stopImmediate = false;
    this._canceled = false;
    this._inPassive = false;
    this._dispatching = false;
    this._initialized = true;
    this._trusted = false;
    this._path = null;
    this._timeStamp = performance.now();
  }
  get type() {
    return this._type;
  }
  get target() {
    return this._target;
  }
  get srcElement() {
    return this._target;
  }
  get currentTarget() {
    return this._currentTarget;
  }
  get eventPhase() {
    return this._phase;
  }
  get bubbles() {
    return this._bubbles;
  }
  get cancelable() {
    return this._cancelable;
  }
  get composed() {
    return this._composed;
  }
  get defaultPrevented() {
    return this._canceled;
  }
  get isTrusted() {
    return this._trusted;
  }
  get timeStamp() {
    return this._timeStamp;
  }
  get returnValue() {
    return !this._canceled;
  }
  set returnValue(v) {
    if (!v) this.preventDefault();
  }
  get cancelBubble() {
    return this._stop;
  }
  set cancelBubble(v) {
    if (v) this._stop = true;
  }
  stopPropagation() {
    this._stop = true;
  }
  stopImmediatePropagation() {
    this._stop = true;
    this._stopImmediate = true;
  }
  preventDefault() {
    if (this._cancelable && !this._inPassive) this._canceled = true;
  }
  composedPath() {
    return this._path ? this._path.slice() : [];
  }
  initEvent(type, bubbles = false, cancelable = false) {
    if (this._dispatching) return;
    this._initialized = true;
    this._stop = false;
    this._stopImmediate = false;
    this._canceled = false;
    this._trusted = false;
    this._target = null;
    this._type = str(type);
    this._bubbles = !!bubbles;
    this._cancelable = !!cancelable;
  }
}
defineConstants(Event, { NONE, CAPTURING_PHASE, AT_TARGET, BUBBLING_PHASE });
tag(Event);

export class UIEvent extends Event {
  constructor(type, init) {
    super(type, init);
    const i = init == null ? EMPTY : init;
    this._view = i.view ?? null;
    this._detail = i.detail ?? 0;
    this._which = i.which;
  }
  get view() {
    return this._view;
  }
  get detail() {
    return this._detail;
  }
  get which() {
    return this._which ?? 0;
  }
  initUIEvent(type, bubbles, cancelable, view, detail) {
    this.initEvent(type, bubbles, cancelable);
    this._view = view ?? null;
    this._detail = detail ?? 0;
  }
}
tag(UIEvent);

function modifierState(event, key) {
  switch (key) {
    case "Alt":
      return event._altKey;
    case "Control":
      return event._ctrlKey;
    case "Meta":
      return event._metaKey;
    case "Shift":
      return event._shiftKey;
    default:
      return !!event._modifiers?.[key];
  }
}

function initModifiers(event, i) {
  event._ctrlKey = !!i.ctrlKey;
  event._shiftKey = !!i.shiftKey;
  event._altKey = !!i.altKey;
  event._metaKey = !!i.metaKey;
  event._modifiers = null;
  for (const k of [
    "modifierAltGraph",
    "modifierCapsLock",
    "modifierFn",
    "modifierFnLock",
    "modifierHyper",
    "modifierNumLock",
    "modifierScrollLock",
    "modifierSuper",
    "modifierSymbol",
    "modifierSymbolLock",
  ]) {
    if (i[k]) (event._modifiers ??= {})[k.slice(8)] = true;
  }
}

class ModifierMixin {
  get ctrlKey() {
    return this._ctrlKey;
  }
  get shiftKey() {
    return this._shiftKey;
  }
  get altKey() {
    return this._altKey;
  }
  get metaKey() {
    return this._metaKey;
  }
  getModifierState(key) {
    return modifierState(this, str(key));
  }
}

export class MouseEvent extends UIEvent {
  constructor(type, init) {
    super(type, init);
    const i = init == null ? EMPTY : init;
    this._screenX = +(i.screenX ?? 0);
    this._screenY = +(i.screenY ?? 0);
    this._clientX = +(i.clientX ?? 0);
    this._clientY = +(i.clientY ?? 0);
    this._movementX = +(i.movementX ?? 0);
    this._movementY = +(i.movementY ?? 0);
    this._button = i.button ?? 0;
    this._buttons = i.buttons ?? 0;
    this._relatedTarget = i.relatedTarget ?? null;
    initModifiers(this, i);
  }
  get screenX() {
    return this._screenX;
  }
  get screenY() {
    return this._screenY;
  }
  get clientX() {
    return this._clientX;
  }
  get clientY() {
    return this._clientY;
  }
  get x() {
    return this._clientX;
  }
  get y() {
    return this._clientY;
  }
  get pageX() {
    return this._clientX;
  }
  get pageY() {
    return this._clientY;
  }
  get offsetX() {
    return this._clientX;
  }
  get offsetY() {
    return this._clientY;
  }
  get movementX() {
    return this._movementX;
  }
  get movementY() {
    return this._movementY;
  }
  get button() {
    return this._button;
  }
  get buttons() {
    return this._buttons;
  }
  get relatedTarget() {
    return this._relatedTarget;
  }
  get which() {
    return this._which ?? this._button + 1;
  }
  initMouseEvent(
    type,
    bubbles,
    cancelable,
    view,
    detail,
    screenX,
    screenY,
    clientX,
    clientY,
    ctrlKey,
    altKey,
    shiftKey,
    metaKey,
    button,
    relatedTarget,
  ) {
    this.initUIEvent(type, bubbles, cancelable, view, detail);
    this._screenX = screenX ?? 0;
    this._screenY = screenY ?? 0;
    this._clientX = clientX ?? 0;
    this._clientY = clientY ?? 0;
    this._ctrlKey = !!ctrlKey;
    this._altKey = !!altKey;
    this._shiftKey = !!shiftKey;
    this._metaKey = !!metaKey;
    this._button = button ?? 0;
    this._relatedTarget = relatedTarget ?? null;
  }
}
for (const key of [
  "ctrlKey",
  "shiftKey",
  "altKey",
  "metaKey",
  "getModifierState",
]) {
  Object.defineProperty(
    MouseEvent.prototype,
    key,
    Object.getOwnPropertyDescriptor(ModifierMixin.prototype, key),
  );
}
tag(MouseEvent);

export class PointerEvent extends MouseEvent {
  constructor(type, init) {
    super(type, init);
    const i = init == null ? EMPTY : init;
    this._pointerId = i.pointerId ?? 0;
    this._width = i.width ?? 1;
    this._height = i.height ?? 1;
    this._pressure = i.pressure ?? 0;
    this._tangentialPressure = i.tangentialPressure ?? 0;
    this._tiltX = i.tiltX ?? 0;
    this._tiltY = i.tiltY ?? 0;
    this._twist = i.twist ?? 0;
    this._pointerType = i.pointerType ?? "";
    this._isPrimary = !!i.isPrimary;
  }
  get pointerId() {
    return this._pointerId;
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get pressure() {
    return this._pressure;
  }
  get tangentialPressure() {
    return this._tangentialPressure;
  }
  get tiltX() {
    return this._tiltX;
  }
  get tiltY() {
    return this._tiltY;
  }
  get twist() {
    return this._twist;
  }
  get pointerType() {
    return this._pointerType;
  }
  get isPrimary() {
    return this._isPrimary;
  }
  getCoalescedEvents() {
    return [];
  }
  getPredictedEvents() {
    return [];
  }
}
tag(PointerEvent);

export class WheelEvent extends MouseEvent {
  constructor(type, init) {
    super(type, init);
    const i = init == null ? EMPTY : init;
    this._deltaX = i.deltaX ?? 0;
    this._deltaY = i.deltaY ?? 0;
    this._deltaZ = i.deltaZ ?? 0;
    this._deltaMode = i.deltaMode ?? 0;
  }
  get deltaX() {
    return this._deltaX;
  }
  get deltaY() {
    return this._deltaY;
  }
  get deltaZ() {
    return this._deltaZ;
  }
  get deltaMode() {
    return this._deltaMode;
  }
}
defineConstants(WheelEvent, {
  DOM_DELTA_PIXEL: 0,
  DOM_DELTA_LINE: 1,
  DOM_DELTA_PAGE: 2,
});
tag(WheelEvent);

export class DragEvent extends MouseEvent {
  constructor(type, init) {
    super(type, init);
    this._dataTransfer = init?.dataTransfer ?? null;
  }
  get dataTransfer() {
    return this._dataTransfer;
  }
}
tag(DragEvent);

export class KeyboardEvent extends UIEvent {
  constructor(type, init) {
    super(type, init);
    const i = init == null ? EMPTY : init;
    this._key = str(i.key ?? "");
    this._code = str(i.code ?? "");
    this._location = i.location ?? 0;
    this._repeat = !!i.repeat;
    this._isComposing = !!i.isComposing;
    this._charCode = i.charCode ?? 0;
    this._keyCode = i.keyCode ?? 0;
    initModifiers(this, i);
  }
  get key() {
    return this._key;
  }
  get code() {
    return this._code;
  }
  get location() {
    return this._location;
  }
  get repeat() {
    return this._repeat;
  }
  get isComposing() {
    return this._isComposing;
  }
  get charCode() {
    return this._charCode;
  }
  get keyCode() {
    return this._keyCode;
  }
  get which() {
    return this._which ?? (this._keyCode || this._charCode);
  }
  initKeyboardEvent(
    type,
    bubbles,
    cancelable,
    view,
    key,
    location,
    ctrlKey,
    altKey,
    shiftKey,
    metaKey,
  ) {
    this.initUIEvent(type, bubbles, cancelable, view, 0);
    this._key = str(key ?? "");
    this._location = location ?? 0;
    this._ctrlKey = !!ctrlKey;
    this._altKey = !!altKey;
    this._shiftKey = !!shiftKey;
    this._metaKey = !!metaKey;
  }
}
for (const key of [
  "ctrlKey",
  "shiftKey",
  "altKey",
  "metaKey",
  "getModifierState",
]) {
  Object.defineProperty(
    KeyboardEvent.prototype,
    key,
    Object.getOwnPropertyDescriptor(ModifierMixin.prototype, key),
  );
}
defineConstants(KeyboardEvent, {
  DOM_KEY_LOCATION_STANDARD: 0,
  DOM_KEY_LOCATION_LEFT: 1,
  DOM_KEY_LOCATION_RIGHT: 2,
  DOM_KEY_LOCATION_NUMPAD: 3,
});
tag(KeyboardEvent);

export class FocusEvent extends UIEvent {
  constructor(type, init) {
    super(type, init);
    this._relatedTarget = init?.relatedTarget ?? null;
  }
  get relatedTarget() {
    return this._relatedTarget;
  }
}
tag(FocusEvent);

export class InputEvent extends UIEvent {
  constructor(type, init) {
    super(type, init);
    const i = init == null ? EMPTY : init;
    this._data = i.data ?? null;
    this._isComposing = !!i.isComposing;
    this._inputType = str(i.inputType ?? "");
    this._dataTransfer = i.dataTransfer ?? null;
  }
  get data() {
    return this._data;
  }
  get isComposing() {
    return this._isComposing;
  }
  get inputType() {
    return this._inputType;
  }
  get dataTransfer() {
    return this._dataTransfer;
  }
  getTargetRanges() {
    return [];
  }
}
tag(InputEvent);

export class CompositionEvent extends UIEvent {
  constructor(type, init) {
    super(type, init);
    this._data = str(init?.data ?? "");
  }
  get data() {
    return this._data;
  }
}
tag(CompositionEvent);

export class TouchEvent extends UIEvent {
  constructor(type, init) {
    super(type, init);
    const i = init == null ? EMPTY : init;
    this._touches = i.touches ?? [];
    this._targetTouches = i.targetTouches ?? [];
    this._changedTouches = i.changedTouches ?? [];
    initModifiers(this, i);
  }
  get touches() {
    return this._touches;
  }
  get targetTouches() {
    return this._targetTouches;
  }
  get changedTouches() {
    return this._changedTouches;
  }
}
for (const key of ["ctrlKey", "shiftKey", "altKey", "metaKey"]) {
  Object.defineProperty(
    TouchEvent.prototype,
    key,
    Object.getOwnPropertyDescriptor(ModifierMixin.prototype, key),
  );
}
tag(TouchEvent);

export class CustomEvent extends Event {
  constructor(type, init) {
    super(type, init);
    this._detail = init?.detail ?? null;
  }
  get detail() {
    return this._detail;
  }
  initCustomEvent(type, bubbles, cancelable, detail) {
    this.initEvent(type, bubbles, cancelable);
    this._detail = detail ?? null;
  }
}
tag(CustomEvent);

/** Event subclasses that only add read-only init fields. */
function simpleEvent(name, fields, base = Event) {
  const cls = {
    [name]: class extends base {
      constructor(type, init) {
        super(type, init);
        const i = init == null ? EMPTY : init;
        for (const [key, def] of fields) this[`_${key}`] = i[key] ?? def;
      }
    },
  }[name];
  for (const [key] of fields) {
    Object.defineProperty(cls.prototype, key, {
      get() {
        return this[`_${key}`];
      },
      configurable: true,
      enumerable: true,
    });
  }
  tag(cls, name);
  return cls;
}

export const TransitionEvent = simpleEvent("TransitionEvent", [
  ["propertyName", ""],
  ["elapsedTime", 0],
  ["pseudoElement", ""],
]);
export const AnimationEvent = simpleEvent("AnimationEvent", [
  ["animationName", ""],
  ["elapsedTime", 0],
  ["pseudoElement", ""],
]);
export const ClipboardEvent = simpleEvent("ClipboardEvent", [
  ["clipboardData", null],
]);
export const SubmitEvent = simpleEvent("SubmitEvent", [["submitter", null]]);
export const ErrorEvent = simpleEvent("ErrorEvent", [
  ["message", ""],
  ["filename", ""],
  ["lineno", 0],
  ["colno", 0],
  ["error", undefined],
]);
export const ProgressEvent = simpleEvent("ProgressEvent", [
  ["lengthComputable", false],
  ["loaded", 0],
  ["total", 0],
]);
export const PopStateEvent = simpleEvent("PopStateEvent", [["state", null]]);
export const HashChangeEvent = simpleEvent("HashChangeEvent", [
  ["oldURL", ""],
  ["newURL", ""],
]);
export const PageTransitionEvent = simpleEvent("PageTransitionEvent", [
  ["persisted", false],
]);
export const StorageEvent = simpleEvent("StorageEvent", [
  ["key", null],
  ["oldValue", null],
  ["newValue", null],
  ["url", ""],
  ["storageArea", null],
]);
export const ToggleEvent = simpleEvent("ToggleEvent", [
  ["oldState", ""],
  ["newState", ""],
]);
export const BeforeUnloadEvent = simpleEvent("BeforeUnloadEvent", []);

/** `document.createEvent` interface names (case-insensitive). */
export const CREATE_EVENT_INTERFACES = {
  event: Event,
  events: Event,
  htmlevents: Event,
  svgevents: Event,
  uievent: UIEvent,
  uievents: UIEvent,
  mouseevent: MouseEvent,
  mouseevents: MouseEvent,
  keyboardevent: KeyboardEvent,
  focusevent: FocusEvent,
  customevent: CustomEvent,
  compositionevent: CompositionEvent,
  touchevent: TouchEvent,
  dragevent: DragEvent,
  storageevent: StorageEvent,
  hashchangeevent: HashChangeEvent,
  errorevent: ErrorEvent,
  beforeunloadevent: BeforeUnloadEvent,
};

// --- EventTarget ------------------------------------------------------------

/**
 * Hooks set by other modules so dispatch can stay generic:
 * - `getParent(target, event)`: next target up the event path, or null
 * - `activationBehavior(target)`: { pre, run, cancel } for click activation
 * - `reportError(error)`: listener exceptions
 * - `beforeDispatch(target, event)`: input-modality tracking for :focus-visible
 */
export const hooks = {
  getParent: () => null,
  activation: null,
  reportError: (e) => {
    throw e;
  },
  beforeDispatch: null,
};

function flattenCapture(options) {
  if (typeof options === "boolean") return options;
  return options != null && !!options.capture;
}

export class EventTarget {
  constructor() {
    this._listeners = null;
  }

  addEventListener(type, callback, options) {
    if (callback == null) return;
    type = str(type);
    let capture = false;
    let once = false;
    let passive = null;
    let signal = null;
    if (typeof options === "boolean") {
      capture = options;
    } else if (options != null) {
      capture = !!options.capture;
      once = !!options.once;
      if (options.passive !== undefined) passive = !!options.passive;
      signal = options.signal ?? null;
    }
    if (signal?.aborted) return;
    const map = (this._listeners ??= new Map());
    let list = map.get(type);
    if (list) {
      for (const l of list)
        if (l.callback === callback && l.capture === capture) return;
    } else {
      list = [];
      map.set(type, list);
    }
    const listener = {
      callback,
      capture,
      once,
      passive: passive ?? false,
      removed: false,
    };
    list.push(listener);
    if (signal) {
      signal.addEventListener(
        "abort",
        () => removeListener(this, type, listener),
        {
          once: true,
        },
      );
    }
  }

  removeEventListener(type, callback, options) {
    if (callback == null || !this._listeners) return;
    type = str(type);
    const capture = flattenCapture(options);
    const list = this._listeners.get(type);
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const l = list[i];
      if (l.callback === callback && l.capture === capture) {
        l.removed = true;
        list.splice(i, 1);
        return;
      }
    }
  }

  dispatchEvent(event) {
    if (!(event instanceof Event)) {
      throw new TypeError(
        "Failed to execute 'dispatchEvent': parameter 1 is not of type 'Event'.",
      );
    }
    if (event._dispatching || !event._initialized) {
      throw domException(
        "The event is already being dispatched.",
        "InvalidStateError",
      );
    }
    event._trusted = false;
    return dispatch(this, event);
  }
}
tag(EventTarget);

function removeListener(target, type, listener) {
  const list = target._listeners?.get(type);
  if (!list) return;
  const i = list.indexOf(listener);
  if (i !== -1) {
    listener.removed = true;
    list.splice(i, 1);
  }
}

function invoke(target, event, phase, capturePass) {
  const list = target._listeners?.get(event._type);
  if (!list || list.length === 0) return;
  event._currentTarget = target;
  event._phase = phase;
  // Listeners added during this dispatch don't run; removed ones are skipped.
  const snapshot = list.length === 1 ? [list[0]] : list.slice();
  for (const l of snapshot) {
    if (l.removed || l.capture !== capturePass) continue;
    if (l.once) removeListener(target, event._type, l);
    if (l.passive) event._inPassive = true;
    const cb = l.callback;
    try {
      if (typeof cb === "function") cb.call(target, event);
      else if (cb && typeof cb.handleEvent === "function")
        cb.handleEvent(event);
    } catch (error) {
      hooks.reportError(error);
    }
    event._inPassive = false;
    if (event._stopImmediate) return;
  }
}

/** The DOM dispatch algorithm, minus shadow-tree retargeting. */
export function dispatch(target, event) {
  event._dispatching = true;
  event._target = target;
  hooks.beforeDispatch?.(target, event);

  const path = [target];
  for (let p = hooks.getParent(target, event); p; p = hooks.getParent(p, event))
    path.push(p);
  event._path = path;

  // Click activation: the target, or the nearest ancestor with activation behavior.
  let activation = null;
  if (
    hooks.activation &&
    event._type === "click" &&
    event instanceof MouseEvent
  ) {
    activation = hooks.activation(path, event);
    activation?.pre?.();
  }

  for (let i = path.length - 1; i >= 0; i--) {
    invoke(path[i], event, i === 0 ? AT_TARGET : CAPTURING_PHASE, true);
    if (event._stop) break;
  }
  if (!event._stop) {
    for (let i = 0; i < path.length; i++) {
      if (i > 0 && !event._bubbles) break;
      invoke(path[i], event, i === 0 ? AT_TARGET : BUBBLING_PHASE, false);
      if (event._stop) break;
    }
  }

  event._phase = NONE;
  event._currentTarget = null;
  event._path = null;
  event._dispatching = false;
  event._stop = false;
  event._stopImmediate = false;

  if (activation) {
    if (event._canceled) activation.cancel?.();
    else activation.run?.();
  }
  return !event._canceled;
}

/** Fires a simple event the way the platform does (untrusted flag aside). */
export function fire(target, type, init, Ctor = Event) {
  const event = new Ctor(type, init);
  event._trusted = true;
  return dispatch(target, event);
}
