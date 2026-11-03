// @ts-check
import { writable } from "svelte/store";

/**
 * @typedef {import("../utils/icon-component.js").IconComponent} IconComponent
 * @typedef {import("./icon-items.js").IconPickerItem} IconPickerItem
 */

/**
 * The component to draw for an item: the one it carries, or the one the
 * loader imported. `null` while it is still coming.
 *
 * @param {IconPickerItem | undefined} item
 * @param {ReadonlyMap<string, IconComponent>} imported
 * @returns {IconComponent}
 */
export function resolveIcon(item, imported) {
  if (!item) return null;
  return item.icon ?? imported.get(item.id) ?? null;
}

/**
 * The icon a loader returned: the component itself, a module's default
 * export, or the export named for the icon, so one chunk can hold the icons
 * of a whole section and every item in it can `load` that chunk.
 *
 * @param {unknown} module
 * @param {string} id
 * @returns {IconComponent}
 */
function pickIcon(module, id) {
  if (module && typeof module === "object") {
    const named = /** @type {Record<string, IconComponent>} */ (module)[id];
    if (named) return named;
    if ("default" in module)
      return /** @type {IconComponent} */ (module.default);
  }
  return /** @type {IconComponent} */ (module);
}

/**
 * Imports the icons a picker shows, as they come on screen. One loader holds
 * the icons of one picker, so a server never shares them between requests.
 * A batch of icons is imported together and the store updates once, so the
 * grid renders once for a screenful.
 *
 * @returns {{
 *   icons: import("svelte/store").Readable<ReadonlyMap<string, IconComponent>>,
 *   load: (items: ReadonlyArray<IconPickerItem>) => Promise<void>,
 *   destroy: () => void,
 * }}
 */
export function createIconLoader() {
  /** @type {Map<string, IconComponent>} */
  let imported = new Map();
  const store = writable(imported);
  /** Imports in flight, by icon, so a scroll does not ask for an icon twice. */
  /** @type {Map<string, Promise<void>>} */
  const pending = new Map();
  /** Ids whose import failed: not asked again. */
  const failed = new Set();
  let destroyed = false;

  return {
    icons: { subscribe: store.subscribe },

    async load(items) {
      const missing = items.filter(
        (item) =>
          !item.icon &&
          item.load &&
          !imported.has(item.id) &&
          !pending.has(item.id) &&
          !failed.has(item.id),
      );
      // An icon already on its way is waited for too, so a caller that
      // needs it can read it once this resolves.
      const inFlight = items.flatMap((item) => pending.get(item.id) ?? []);

      if (missing.length > 0) {
        const batch = Promise.all(
          missing.map(async (item) => {
            try {
              const module =
                await /** @type {NonNullable<IconPickerItem["load"]>} */ (
                  item.load
                )();
              return /** @type {const} */ ([
                item.id,
                pickIcon(module, item.id),
              ]);
            } catch {
              return /** @type {const} */ ([item.id, null]);
            }
          }),
        ).then((results) => {
          for (const [id, icon] of results) {
            pending.delete(id);
            if (!icon) failed.add(id);
          }
          if (destroyed) return;
          const next = new Map(imported);
          for (const [id, icon] of results) if (icon) next.set(id, icon);
          imported = next;
          store.set(imported);
        });
        for (const item of missing) pending.set(item.id, batch);
        inFlight.push(batch);
      }

      await Promise.all(inFlight);
    },

    destroy() {
      destroyed = true;
    },
  };
}
