// MutationObserver. Mutation sites check `observing.count` first, so a page
// with no observers pays nothing for record bookkeeping.

import { staticNodeList } from "./collections.js";
import { hooks } from "./events.js";
import { INTERNAL, illegalConstructor, str, tag } from "./shared.js";

/** Number of live registrations across all observers in this realm. */
export const observing = { count: 0 };

const pending = new Set();
let scheduled = false;

export class MutationRecord {
  constructor(token) {
    if (token !== INTERNAL) illegalConstructor();
  }
  get type() {
    return this._type;
  }
  get target() {
    return this._target;
  }
  get addedNodes() {
    return (this._addedList ??= staticNodeList(this._added));
  }
  get removedNodes() {
    return (this._removedList ??= staticNodeList(this._removed));
  }
  get previousSibling() {
    return this._prev;
  }
  get nextSibling() {
    return this._next;
  }
  get attributeName() {
    return this._name;
  }
  get attributeNamespace() {
    return this._ns;
  }
  get oldValue() {
    return this._oldValue;
  }
}
tag(MutationRecord);

export class MutationObserver {
  constructor(callback) {
    if (typeof callback !== "function") {
      throw new TypeError(
        "Failed to construct 'MutationObserver': parameter 1 is not of type 'MutationCallback'.",
      );
    }
    this._callback = callback;
    this._records = [];
    this._nodes = [];
  }

  observe(target, options = {}) {
    let {
      childList,
      attributes,
      characterData,
      subtree,
      attributeOldValue,
      characterDataOldValue,
      attributeFilter,
    } = options;
    if (
      (attributeOldValue !== undefined || attributeFilter !== undefined) &&
      attributes === undefined
    ) {
      attributes = true;
    }
    if (characterDataOldValue !== undefined && characterData === undefined)
      characterData = true;
    if (!childList && !attributes && !characterData) {
      throw new TypeError(
        "The options object must set at least one of 'attributes', 'characterData', or 'childList' to true.",
      );
    }
    if (attributeOldValue && !attributes) {
      throw new TypeError(
        "The options object may only set 'attributeOldValue' to true when 'attributes' is true or not present.",
      );
    }
    if (attributeFilter && !attributes) {
      throw new TypeError(
        "The options object may only set 'attributeFilter' when 'attributes' is true or not present.",
      );
    }
    if (characterDataOldValue && !characterData) {
      throw new TypeError(
        "The options object may only set 'characterDataOldValue' to true when 'characterData' is true or not present.",
      );
    }
    const opts = {
      childList: !!childList,
      attributes: !!attributes,
      characterData: !!characterData,
      subtree: !!subtree,
      attributeOldValue: !!attributeOldValue,
      characterDataOldValue: !!characterDataOldValue,
      attributeFilter: attributeFilter
        ? Array.from(attributeFilter, str)
        : null,
    };
    const regs = (target._regs ??= []);
    for (const r of regs) {
      if (r.observer === this) {
        r.options = opts;
        return;
      }
    }
    regs.push({ observer: this, options: opts });
    this._nodes.push(target);
    observing.count++;
  }

  disconnect() {
    for (const node of this._nodes) {
      const regs = node._regs;
      const i = regs.findIndex((r) => r.observer === this);
      if (i !== -1) {
        regs.splice(i, 1);
        observing.count--;
      }
    }
    this._nodes = [];
    this._records = [];
    pending.delete(this);
  }

  takeRecords() {
    const records = this._records;
    this._records = [];
    return records;
  }
}
tag(MutationObserver);

function deliver() {
  scheduled = false;
  const observers = [...pending];
  pending.clear();
  for (const observer of observers) {
    const records = observer.takeRecords();
    if (records.length === 0) continue;
    try {
      observer._callback.call(observer, records, observer);
    } catch (error) {
      hooks.reportError(error);
    }
  }
}

/**
 * Queues a record for every observer interested in a mutation of `target`.
 * `type` is "childList" | "attributes" | "characterData".
 */
export function queueMutation(
  type,
  target,
  name,
  ns,
  oldValue,
  added,
  removed,
  prev,
  next,
) {
  let interested = null;
  for (let node = target; node; node = node._parent) {
    const regs = node._regs;
    if (!regs || regs.length === 0) continue;
    for (const { observer, options } of regs) {
      if (node !== target && !options.subtree) continue;
      if (type === "attributes") {
        if (!options.attributes) continue;
        if (
          options.attributeFilter &&
          (ns !== null || !options.attributeFilter.includes(name))
        )
          continue;
      } else if (type === "characterData") {
        if (!options.characterData) continue;
      } else if (!options.childList) {
        continue;
      }
      interested ??= new Map();
      const wantsOld =
        (type === "attributes" && options.attributeOldValue) ||
        (type === "characterData" && options.characterDataOldValue);
      if (!interested.has(observer) || wantsOld)
        interested.set(observer, wantsOld);
    }
  }
  if (!interested) return;
  for (const [observer, wantsOld] of interested) {
    const record = new MutationRecord(INTERNAL);
    record._type = type;
    record._target = target;
    record._added = added ?? [];
    record._removed = removed ?? [];
    record._prev = prev ?? null;
    record._next = next ?? null;
    record._name = name ?? null;
    record._ns = ns ?? null;
    record._oldValue = wantsOld ? oldValue : null;
    observer._records.push(record);
    pending.add(observer);
  }
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(deliver);
  }
}
