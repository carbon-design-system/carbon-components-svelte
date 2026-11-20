// @ts-check

/**
 * Row identity for a list the app owns. Each row gets a key that no other
 * row in the list has had, so a keyed `{#each}` moves the row's DOM node on
 * a reorder instead of rebuilding it. The keys are a counter per list, never
 * written to the DOM, so they cannot differ between a server render and
 * hydration.
 *
 * @returns {{
 *   sync: <T>(items: ReadonlyArray<T>, itemKey?: ((item: T, index: number) => string | number) | undefined) => string[],
 *   insert: (index: number) => void,
 *   remove: (index: number) => void,
 *   move: (from: number, to: number) => void,
 * }}
 */
export function createKeyer() {
  let counter = 0;
  /** @type {string[]} */
  let keys = [];
  const fresh = () => `k${counter++}`;

  return {
    // `itemKey` derives the keys from the data, so rows follow their items
    // when the app reorders or replaces the list itself. Without it a row is
    // identified by where the component put it, and an outside change can
    // only grow or shrink the list at the end.
    sync(items, itemKey) {
      if (itemKey) {
        const seen = new Set();
        keys = items.map((item, index) => {
          let key = String(itemKey(item, index));
          while (seen.has(key)) key = `${key}~${counter++}`;
          seen.add(key);
          return key;
        });
      } else {
        while (keys.length < items.length) keys.push(fresh());
        keys = keys.slice(0, items.length);
      }
      return keys;
    },
    insert(index) {
      keys.splice(index, 0, fresh());
    },
    remove(index) {
      keys.splice(index, 1);
    },
    move(from, to) {
      keys = moveInArray(keys, from, to);
    },
  };
}

/**
 * A copy of `array` with the element at `from` moved to `to`.
 *
 * @template T
 * @param {ReadonlyArray<T>} array
 * @param {number} from
 * @param {number} to
 * @returns {T[]}
 */
export function moveInArray(array, from, to) {
  const copy = array.slice();
  if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) {
    return copy;
  }
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

/**
 * `items` grown to `min` rows with `create`. Returns `items` itself when it
 * is long enough.
 *
 * @template T
 * @param {T[]} items
 * @param {number} min
 * @param {(index: number) => T} create
 * @returns {T[]}
 */
export function padItems(items, min, create) {
  if (!(items.length < min)) return items;
  const padded = items.slice();
  while (padded.length < min) padded.push(create(padded.length));
  return padded;
}
