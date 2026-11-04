// @ts-check

import { deepEqual } from "../utils/deep-equal.js";
import { uniqueId } from "../utils/unique-id.js";
import {
  compileFields,
  defaultFor,
  indexNodes,
  messageFor,
} from "./field-config.js";
import {
  getIn,
  isWithin,
  joinPath,
  parentPath,
  pathToId,
  setIn,
  templatePath,
} from "./form-path.js";
import { schemaToFields } from "./schema.js";

/**
 * @typedef {import("./field-config.js").FieldNode} FieldNode
 * @typedef {import("./create-form.js").FieldState} FieldState
 * @typedef {import("./create-form.js").FormError} FormError
 * @typedef {import("./create-form.js").CreateFormOptions} CreateFormOptions
 */

/**
 * @typedef {Object} Channel
 * @property {() => void} refresh
 * @property {string | undefined} scope The path of the field the store is for.
 * @property {boolean} stale
 * @property {Set<(state: any) => void>} subs
 */

/**
 * @param {Record<string, any> | undefined} a
 * @param {Record<string, any> | undefined} b
 * @returns {boolean}
 */
function shallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  for (const key of keys) if (!Object.is(a[key], b[key])) return false;
  return true;
}

/**
 * @param {any[]} a
 * @param {any[]} b
 * @returns {boolean}
 */
function arrayEqual(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * @param {any} value
 * @returns {value is PromiseLike<any>}
 */
function isThenable(value) {
  return value != null && typeof value.then === "function";
}

/**
 * Move the entries of a path-keyed record that sit under array `arrayPath`
 * to a new row, or drop them.
 * @template T
 * @param {Record<string, T>} record
 * @param {string} arrayPath
 * @param {(index: number) => number} to The new index, or -1 to drop.
 * @returns {Record<string, T>}
 */
function remap(record, arrayPath, to) {
  const prefix = `${arrayPath}.`;
  /** @type {Record<string, T>} */
  const out = {};
  for (const key of Object.keys(record)) {
    if (!key.startsWith(prefix)) {
      out[key] = record[key];
      continue;
    }
    const rest = key.slice(prefix.length);
    const dot = rest.indexOf(".");
    const index = Number(dot < 0 ? rest : rest.slice(0, dot));
    if (Number.isNaN(index)) {
      out[key] = record[key];
      continue;
    }
    const next = to(index);
    if (next < 0) continue;
    out[`${prefix}${next}${dot < 0 ? "" : rest.slice(dot)}`] = record[key];
  }
  return out;
}

/**
 * Fill a value tree from the initial values: defaults where a key is
 * missing, array rows merged with their row defaults, unknown keys kept.
 * @param {FieldNode} node
 * @param {any} base
 * @param {any} given
 * @returns {any}
 */
function mergeInitial(node, base, given) {
  if (given === undefined) return base;
  if (node.kind === "group") {
    if (!given || typeof given !== "object") return base;
    const out = { ...given };
    for (const child of node.children) {
      out[child.name] = mergeInitial(
        child,
        base[child.name],
        given[child.name],
      );
    }
    return out;
  }
  if (node.kind === "array") {
    if (!Array.isArray(given)) return base;
    const item = /** @type {FieldNode} */ (node.item);
    return given.map((row) => mergeInitial(item, defaultFor(item), row));
  }
  return given;
}

/**
 * Create a headless form: values, touched, dirty, errors and submit state
 * for a field config, with a store for each field so typing in one does not
 * wake the others.
 * @param {CreateFormOptions} [options]
 * @returns {import("./create-form.js").SchemaFormStore}
 */
export function createForm(options = {}) {
  const {
    schema,
    uiSchema,
    initialValues = {},
    validateOn = "blur",
    messages,
    validate: validateForm,
    hidden = "omit",
    id: formId = uniqueId("ccs-schema-form"),
  } = options;

  const fields =
    options.fields ?? (schema ? schemaToFields(schema, uiSchema) : []);
  const root = compileFields(fields);
  const nodes = indexNodes(root);

  /** @param {string} path */
  const nodeAt = (path) => nodes.get(templatePath(path));

  /** @type {any} */
  let initial = mergeInitial(root, defaultFor(root), initialValues);
  /** @type {any} */
  let values = initial;
  /** @type {Record<string, string>} */
  let errors = {};
  /** @type {Record<string, string>} */
  let warns = {};
  /** @type {Record<string, true>} */
  let touched = {};
  /** @type {Record<string, true>} */
  let validating = {};
  /** @type {Record<string, string[]>} */
  let rowIds = {};
  let rowSeq = 0;
  let submitCount = 0;
  let isSubmitting = false;
  /** @type {Map<string, AbortController>} */
  const controllers = new Map();
  /** @type {Map<string, boolean>} */
  let visibleCache = new Map();

  /** @type {Set<Channel>} */
  const channels = new Set();

  /**
   * @template T
   * @param {() => T} compute
   * @param {(a: T, b: T) => boolean} equal
   * @param {() => void} [onIdle]
   * @param {string} [scope] The path of the field the store is for.
   */
  function channel(compute, equal, onIdle, scope) {
    /** @type {T} */
    let state;
    /** @type {Set<(state: T) => void>} */
    const subs = new Set();
    /** @type {Channel} */
    const entry = {
      scope,
      stale: false,
      subs,
      refresh() {
        const next = compute();
        if (equal(next, state)) return;
        state = next;
        for (const run of [...subs]) run(state);
      },
    };
    return {
      /** @param {(state: T) => void} run */
      subscribe(run) {
        if (subs.size === 0 || entry.stale) {
          state = compute();
          entry.stale = false;
        }
        if (subs.size === 0) channels.add(entry);
        subs.add(run);
        run(state);
        return () => {
          subs.delete(run);
          if (subs.size === 0) {
            channels.delete(entry);
            onIdle?.();
          }
        };
      },
    };
  }

  /**
   * Tell the stores their state may have changed.
   * @param {string} [restructured] The path of an array whose rows moved. The
   *  fields inside it are not notified: each one's component is handed a new
   *  path and reads the right state when it subscribes to it. Notifying the
   *  old path first would give the component the new value of its old path
   *  and then the right one, and Svelte 3 and 4 drop the second change of a
   *  bound value inside one flush.
   */
  function flush(restructured) {
    for (const entry of [...channels]) {
      if (
        restructured !== undefined &&
        entry.scope !== undefined &&
        entry.scope !== restructured &&
        isWithin(entry.scope, restructured)
      ) {
        entry.stale = true;
      } else {
        entry.refresh();
      }
    }
  }

  /**
   * Values changed: drop what was derived from them, then notify.
   * @param {string} [restructured] The path of an array whose rows moved.
   */
  function changed(restructured) {
    visibleCache = new Map();
    flush(restructured);
  }

  /**
   * @param {any} setting A boolean, or a function of the form values.
   * @param {string} path
   * @returns {boolean}
   */
  function resolve(setting, path) {
    if (typeof setting !== "function") return !!setting;
    return !!setting(values, {
      path,
      parent: getIn(values, parentPath(path)),
    });
  }

  /**
   * @param {string} path
   * @returns {boolean}
   */
  function isVisible(path) {
    if (path === "") return true;
    const cached = visibleCache.get(path);
    if (cached !== undefined) return cached;
    const node = nodeAt(path);
    let visible = false;
    if (node && isVisible(parentPath(path))) {
      const condition = node.config.visibleIf;
      visible = condition ? evaluateCondition(condition, path) : true;
    }
    visibleCache.set(path, visible);
    return visible;
  }

  /**
   * @param {any} condition
   * @param {string} path
   * @returns {boolean}
   */
  function evaluateCondition(condition, path) {
    const parent = getIn(values, parentPath(path));
    if (typeof condition === "function") {
      return !!condition(values, { path, parent });
    }
    const list = Array.isArray(condition) ? condition : [condition];
    return list.every((/** @type {any} */ rule) => {
      const ref = String(rule.field);
      const current = ref.startsWith("/")
        ? getIn(values, ref.slice(1))
        : getIn(parent, ref);
      let ok = true;
      if ("equals" in rule) ok = ok && deepEqual(current, rule.equals);
      if ("in" in rule)
        ok =
          ok &&
          rule.in.some((/** @type {unknown} */ v) => deepEqual(current, v));
      if ("notEmpty" in rule) {
        const empty =
          current == null ||
          current === "" ||
          current === false ||
          (Array.isArray(current) && current.length === 0);
        ok = ok && (rule.notEmpty ? !empty : empty);
      }
      return ok;
    });
  }

  /**
   * Visit the visible nodes in document order. Rows of an array follow the
   * array itself.
   * @param {(path: string, node: FieldNode) => void} visit
   */
  function walk(visit) {
    /**
     * @param {FieldNode} node
     * @param {string} path
     */
    const step = (node, path) => {
      if (path !== "") {
        if (!isVisible(path)) return;
        visit(path, node);
      }
      if (node.kind === "group") {
        for (const child of node.children) {
          step(child, joinPath(path, child.name));
        }
      } else if (node.kind === "array") {
        const rows = getIn(values, path);
        const length = Array.isArray(rows) ? rows.length : 0;
        for (let i = 0; i < length; i++) {
          step(/** @type {FieldNode} */ (node.item), joinPath(path, i));
        }
      }
    };
    step(root, "");
  }

  /**
   * @param {FieldNode} node
   * @param {any} raw
   * @param {string} path
   * @returns {any}
   */
  function pick(node, raw, path) {
    if (node.kind === "group") {
      const out = { ...raw };
      for (const child of node.children) {
        const childPath = joinPath(path, child.name);
        if (hidden === "omit" && !isVisible(childPath)) {
          delete out[child.name];
        } else {
          out[child.name] = pick(child, raw?.[child.name], childPath);
        }
      }
      return out;
    }
    if (node.kind === "array") {
      const item = /** @type {FieldNode} */ (node.item);
      return Array.isArray(raw)
        ? raw.map((row, i) => pick(item, row, joinPath(path, i)))
        : [];
    }
    return raw;
  }

  /** The submitted values: hidden fields left out unless `hidden` is `"keep"`. */
  const output = () => pick(root, values, "");

  /**
   * @param {string} path
   * @returns {string[]}
   */
  function rowsOf(path) {
    const rows = getIn(values, path);
    const length = Array.isArray(rows) ? rows.length : 0;
    let ids = rowIds[path];
    if (!ids) ids = rowIds[path] = [];
    while (ids.length < length) ids.push(`row-${rowSeq++}`);
    if (ids.length > length) ids.length = length;
    return ids;
  }

  /**
   * @param {string} path
   * @returns {FieldState}
   */
  function computeState(path) {
    const node = nodeAt(path);
    const leaf = node?.kind === "field";
    const config = node?.config ?? {};
    return {
      value: leaf ? getIn(values, path) : undefined,
      error: errors[path],
      warn: warns[path],
      touched: !!touched[path],
      dirty: leaf
        ? !deepEqual(getIn(values, path), getIn(initial, path))
        : false,
      validating: !!validating[path],
      visible: isVisible(path),
      required: resolve(config.required, path),
      disabled: resolve(config.disabled, path),
      readonly: resolve(config.readonly, path),
    };
  }

  /** @type {Map<string, any>} */
  const fieldStores = new Map();

  /** @type {Map<string, any>} */
  const rowStores = new Map();

  /** @param {string} path */
  function abort(path) {
    controllers.get(path)?.abort();
    controllers.delete(path);
    delete validating[path];
  }

  /**
   * @param {string} path
   * @param {string | undefined} message
   */
  function setError(path, message) {
    if (message) errors = { ...errors, [path]: message };
    else if (path in errors) {
      errors = { ...errors };
      delete errors[path];
    }
  }

  /**
   * @param {string} path
   * @param {string | undefined} message
   */
  function setWarn(path, message) {
    if (message) warns = { ...warns, [path]: message };
    else if (path in warns) {
      warns = { ...warns };
      delete warns[path];
    }
  }

  /**
   * Run the rules of one node. The synchronous part settles before this
   * returns; the promise settles when an async validator does.
   * @param {string} path
   * @returns {Promise<void>}
   */
  function validatePath(path) {
    const node = nodeAt(path);
    abort(path);
    if (!node) return Promise.resolve();
    if (!isVisible(path) || resolve(node.config.disabled, path)) {
      setError(path, undefined);
      setWarn(path, undefined);
      return Promise.resolve();
    }
    const value = getIn(values, path);
    const context = {
      node,
      message: messageFor(messages, node),
      required: resolve(node.config.required, path),
    };
    for (const rule of node.rules) {
      const message = rule(value, context);
      if (message) {
        setError(path, message);
        return Promise.resolve();
      }
    }

    const { validate, warn } = node.config;
    setWarn(path, warn ? warn(value, values) || undefined : undefined);
    if (!validate) {
      setError(path, undefined);
      return Promise.resolve();
    }

    const controller = new AbortController();
    controllers.set(path, controller);
    const result = validate(value, values, {
      signal: controller.signal,
      path,
      parent: getIn(values, parentPath(path)),
    });
    if (!isThenable(result)) {
      setError(path, result || undefined);
      return Promise.resolve();
    }
    validating[path] = true;
    /** @param {string | void | undefined} message */
    const settle = (message) => {
      if (controllers.get(path) !== controller) return;
      controllers.delete(path);
      delete validating[path];
      setError(path, message || undefined);
      flush();
    };
    return Promise.resolve(result).then(settle, (error) => {
      if (controller.signal.aborted) return;
      settle(error instanceof Error ? error.message : String(error));
    });
  }

  /** Re-check what depends on `path`, once the user has seen that field. */
  const dependents = new Map();
  for (const node of nodes.values()) {
    for (const dep of node.config.dependsOn ?? []) {
      const absolute = dep.startsWith("/");
      const key = absolute
        ? dep.slice(1)
        : joinPath(parentPath(node.template), dep);
      const list = dependents.get(key) ?? [];
      list.push({ node, absolute });
      dependents.set(key, list);
    }
  }

  /** @param {string} path */
  function revalidateDependents(path) {
    const hits = dependents.get(templatePath(path));
    if (!hits) return;
    for (const { node, absolute } of hits) {
      const target = absolute
        ? node.template
        : joinPath(parentPath(path), node.name);
      if (target.includes("*")) continue;
      if (errors[target] || touched[target] || submitCount > 0) {
        validatePath(target);
      }
    }
  }

  /**
   * @param {string} path
   * @param {"change" | "blur"} trigger
   */
  function validateOnTrigger(path, trigger) {
    const node = nodeAt(path);
    const mode = node?.config.validateOn ?? validateOn;
    const live = mode === "change" || !!errors[path] || submitCount > 0;
    if (trigger === "change" ? live : live || mode === "blur") {
      return validatePath(path);
    }
    return Promise.resolve();
  }

  /**
   * @param {string} path
   * @param {unknown} value
   */
  function setValue(path, value) {
    if (Object.is(getIn(values, path), value)) return;
    values = setIn(values, path, value);
    visibleCache = new Map();
    const pending = validateOnTrigger(path, "change");
    revalidateDependents(path);
    flush();
    return pending;
  }

  /** @param {string} path */
  function blur(path) {
    if (!touched[path]) touched = { ...touched, [path]: true };
    validateOnTrigger(path, "blur");
    flush();
  }

  /** @returns {Promise<boolean>} */
  async function validate() {
    /** @type {Promise<void>[]} */
    const pending = [];
    /** @type {string[]} */
    const paths = [];
    visibleCache = new Map();
    walk((path) => {
      paths.push(path);
      pending.push(validatePath(path));
    });
    if (validateForm) {
      const extra = validateForm(output());
      for (const [path, message] of Object.entries(extra ?? {})) {
        if (message && !errors[path] && isVisible(path)) {
          errors = { ...errors, [path]: message };
        }
      }
    }
    flush();
    await Promise.all(pending);
    // An error on a path that is no longer shown (a row removed while an
    // async check ran) must not block the submit.
    const live = new Set(paths);
    return !Object.keys(errors).some((path) => live.has(path));
  }

  /**
   * @param {string} arrayPath
   * @param {unknown} [item]
   * @param {number} [at]
   * @returns {number} The index of the new row, or -1 at `maxItems`.
   */
  function add(arrayPath, item, at) {
    const node = nodeAt(arrayPath);
    if (node?.kind !== "array") return -1;
    const rows = getIn(values, arrayPath) ?? [];
    if (node.config.maxItems != null && rows.length >= node.config.maxItems) {
      return -1;
    }
    const index = Math.min(Math.max(at ?? rows.length, 0), rows.length);
    rowsOf(arrayPath);
    const row = item ?? defaultFor(/** @type {FieldNode} */ (node.item));
    values = setIn(values, arrayPath, [
      ...rows.slice(0, index),
      row,
      ...rows.slice(index),
    ]);
    rowIds = remap(rowIds, arrayPath, (i) => (i >= index ? i + 1 : i));
    rowIds[arrayPath] = [
      ...rowIds[arrayPath].slice(0, index),
      `row-${rowSeq++}`,
      ...rowIds[arrayPath].slice(index),
    ];
    reindex(arrayPath, (i) => (i >= index ? i + 1 : i));
    if (errors[arrayPath]) validatePath(arrayPath);
    changed(arrayPath);
    return index;
  }

  /**
   * @param {string} arrayPath
   * @param {number} index
   */
  function remove(arrayPath, index) {
    const rows = getIn(values, arrayPath);
    if (!Array.isArray(rows) || index < 0 || index >= rows.length) return;
    rowsOf(arrayPath);
    values = setIn(
      values,
      arrayPath,
      rows.filter((_, i) => i !== index),
    );
    rowIds = remap(rowIds, arrayPath, (i) =>
      i === index ? -1 : i > index ? i - 1 : i,
    );
    rowIds[arrayPath] = rowIds[arrayPath].filter((_, i) => i !== index);
    reindex(arrayPath, (i) => (i === index ? -1 : i > index ? i - 1 : i));
    if (errors[arrayPath] || submitCount > 0) validatePath(arrayPath);
    changed(arrayPath);
  }

  /**
   * @param {string} arrayPath
   * @param {number} from
   * @param {number} to
   */
  function move(arrayPath, from, to) {
    const rows = getIn(values, arrayPath);
    if (
      !Array.isArray(rows) ||
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= rows.length ||
      to >= rows.length
    ) {
      return;
    }
    rowsOf(arrayPath);
    /** @param {any[]} list */
    const reorder = (list) => {
      const next = list.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    };
    /** @param {number} i */
    const target = (i) => {
      if (i === from) return to;
      if (from < to && i > from && i <= to) return i - 1;
      if (from > to && i >= to && i < from) return i + 1;
      return i;
    };
    values = setIn(values, arrayPath, reorder(rows));
    rowIds = remap(rowIds, arrayPath, target);
    rowIds[arrayPath] = reorder(rowIds[arrayPath]);
    reindex(arrayPath, target);
    changed(arrayPath);
  }

  /**
   * Keep per-field state with its row when rows shift.
   * @param {string} arrayPath
   * @param {(index: number) => number} to
   */
  function reindex(arrayPath, to) {
    const prefix = `${arrayPath}.`;
    for (const key of [...controllers.keys()]) {
      if (key.startsWith(prefix)) abort(key);
    }
    errors = remap(errors, arrayPath, to);
    warns = remap(warns, arrayPath, to);
    touched = remap(touched, arrayPath, to);
  }

  /**
   * @param {any} [next] New starting values; the form resets to them, and
   *  to them again on later resets.
   */
  function reset(next) {
    for (const path of [...controllers.keys()]) abort(path);
    if (next !== undefined) {
      initial = mergeInitial(root, defaultFor(root), next);
    }
    values = initial;
    errors = {};
    warns = {};
    touched = {};
    validating = {};
    rowIds = {};
    submitCount = 0;
    isSubmitting = false;
    changed();
  }

  /** @param {Record<string, string>} map */
  function setErrors(map) {
    errors = { ...errors, ...map };
    flush();
  }

  /**
   * Touch and validate every visible field, then run `handler` with the
   * values when they pass.
   * @param {(values: any) => unknown} [handler]
   * @returns {Promise<boolean>} Whether the form was valid and the handler
   *  reported no errors.
   */
  async function submit(handler) {
    if (isSubmitting) return false;
    submitCount += 1;
    const all = /** @type {Record<string, true>} */ ({});
    walk((path) => {
      all[path] = true;
    });
    touched = { ...touched, ...all };
    const valid = await validate();
    flush();
    if (!valid) return false;
    isSubmitting = true;
    flush();
    try {
      const result = /** @type {any} */ (await handler?.(output()));
      if (result && typeof result === "object" && result.errors) {
        setErrors(result.errors);
        return false;
      }
      return true;
    } finally {
      isSubmitting = false;
      flush();
    }
  }

  /** @param {string} path */
  function fieldStore(path) {
    let store = fieldStores.get(path);
    if (!store) {
      store = channel(
        () => computeState(path),
        shallowEqual,
        () => fieldStores.delete(path),
        path,
      );
      fieldStores.set(path, store);
    }
    return store;
  }

  /** @param {string} path */
  function rowStore(path) {
    let store = rowStores.get(path);
    if (!store) {
      store = channel(
        () => rowsOf(path).slice(),
        arrayEqual,
        () => rowStores.delete(path),
      );
      rowStores.set(path, store);
    }
    return store;
  }

  const errorList = channel(
    () => {
      /** @type {FormError[]} */
      const list = [];
      walk((path, node) => {
        const message = errors[path];
        if (message) {
          list.push({
            path,
            id: pathToId(formId, path),
            message,
            label: node.label,
          });
        }
      });
      return list;
    },
    (a, b) =>
      a.length === b.length &&
      a.every((e, i) => e.path === b[i].path && e.message === b[i].message),
  );

  const stores = {
    values: channel(output, deepEqual),
    rawValues: channel(() => values, Object.is),
    errors: channel(() => errors, Object.is),
    touched: channel(() => touched, Object.is),
    dirty: channel(() => !deepEqual(values, initial), Object.is),
    isSubmitting: channel(() => isSubmitting, Object.is),
    submitCount: channel(() => submitCount, Object.is),
    isValidating: channel(() => Object.keys(validating).length > 0, Object.is),
    errorList,
  };

  return /** @type {any} */ ({
    id: formId,
    ...stores,
    field: fieldStore,
    rows: rowStore,
    node: nodeAt,
    root,
    setValue,
    blur,
    validate,
    submit,
    reset,
    add,
    remove,
    move,
    setErrors,
    getValues: output,
    getRawValues: () => values,
    getErrors: () => errors,
    destroy() {
      for (const path of [...controllers.keys()]) abort(path);
      channels.clear();
    },
  });
}
