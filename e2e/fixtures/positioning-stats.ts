// Counts the listeners and observers a page holds, so a test can say how many
// a page of open overlays costs. Imported before anything mounts.
const stats = {
  listeners: new Map<string, number>(),
  resizeObservers: 0,
  mutationObservers: 0,
  observed: 0,
};

declare global {
  interface Window {
    __positioningStats: typeof stats & { reset: () => void };
  }
}

/** Starts counting. Call before anything mounts. */
export function installStats() {
  const add = EventTarget.prototype.addEventListener;
  const remove = EventTarget.prototype.removeEventListener;
  const live = new WeakMap<EventTarget, Map<string, Set<unknown>>>();

  EventTarget.prototype.addEventListener = function (
    this: EventTarget,
    type: string,
    listener: unknown,
    options?: unknown,
  ) {
    if (
      type === "scroll" ||
      type === "resize" ||
      type.startsWith("transition")
    ) {
      let byType = live.get(this);
      if (!byType) live.set(this, (byType = new Map()));
      let set = byType.get(type);
      if (!set) byType.set(type, (set = new Set()));
      if (!set.has(listener)) {
        set.add(listener);
        stats.listeners.set(type, (stats.listeners.get(type) ?? 0) + 1);
      }
    }
    return add.call(this, type, listener as EventListener, options as boolean);
  };
  EventTarget.prototype.removeEventListener = function (
    this: EventTarget,
    type: string,
    listener: unknown,
    options?: unknown,
  ) {
    const set = live.get(this)?.get(type);
    if (set?.delete(listener)) {
      stats.listeners.set(type, (stats.listeners.get(type) ?? 1) - 1);
    }
    return remove.call(
      this,
      type,
      listener as EventListener,
      options as boolean,
    );
  };

  const ResizeObserverBase = window.ResizeObserver;
  window.ResizeObserver = class extends ResizeObserverBase {
    constructor(callback: ResizeObserverCallback) {
      super(callback);
      stats.resizeObservers++;
    }
    observe(target: Element, options?: ResizeObserverOptions) {
      stats.observed++;
      super.observe(target, options);
    }
  };

  const MutationObserverBase = window.MutationObserver;
  window.MutationObserver = class extends MutationObserverBase {
    constructor(callback: MutationCallback) {
      super(callback);
      stats.mutationObservers++;
    }
  };

  window.__positioningStats = Object.assign(stats, {
    reset() {
      stats.listeners.clear();
    },
  });
}
