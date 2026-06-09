// @ts-check

/**
 * Svelte action that adds `window` listeners only while `enabled` is true.
 * Handlers refresh in place on update without re-registering listeners.
 * SSR-safe.
 *
 * @param {unknown} _node Host element (unused; listeners attach to `window`).
 * @param {import("./dismiss.js").DismissParams} params
 * @returns {{ update: (params: import("./dismiss.js").DismissParams) => void, destroy: () => void }}
 */
export function dismiss(_node, params) {
  let specs = normalize(params);
  let enabled = !!params.enabled;

  /**
   * @type {Array<{ type: string, options: boolean | AddEventListenerOptions | undefined, listener: (event: Event) => void, ref: { handler: (event: Event) => void } }>}
   */
  let registered = [];

  function add() {
    if (typeof window === "undefined") return;
    registered = specs.map((spec) => {
      const ref = { handler: spec.handler };
      const listener = (/** @type {Event} */ event) => ref.handler(event);
      window.addEventListener(spec.type, listener, spec.options);
      return { type: spec.type, options: spec.options, listener, ref };
    });
  }

  function remove() {
    for (const r of registered) {
      window.removeEventListener(r.type, r.listener, r.options);
    }
    registered = [];
  }

  if (enabled) add();

  return {
    /** @param {import("./dismiss.js").DismissParams} next */
    update(next) {
      const nextSpecs = normalize(next);
      const nextEnabled = !!next.enabled;
      const sameShape =
        registered.length === nextSpecs.length &&
        nextSpecs.every(
          (s, i) => registered[i] && registered[i].type === s.type,
        );

      if (enabled && nextEnabled && sameShape) {
        nextSpecs.forEach((s, i) => {
          registered[i].ref.handler = s.handler;
        });
        specs = nextSpecs;
        return;
      }

      remove();
      specs = nextSpecs;
      enabled = nextEnabled;
      if (enabled) add();
    },
    destroy() {
      remove();
    },
  };
}

/**
 * @param {import("./dismiss.js").DismissParams} params
 * @returns {Array<{ type: string, handler: (event: Event) => void, options: boolean | AddEventListenerOptions | undefined }>}
 */
function normalize(params) {
  if (params.listeners) {
    return params.listeners.map((l) => ({
      type: l.type,
      handler: l.handler,
      options: l.options,
    }));
  }
  const types = Array.isArray(params.type)
    ? params.type
    : params.type == null
      ? []
      : [params.type];
  return types.map((type) => ({
    type,
    handler: /** @type {(event: Event) => void} */ (params.handler),
    options: params.options,
  }));
}
