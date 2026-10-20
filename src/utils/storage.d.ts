/** JSON.parse the string; return it unchanged if parse fails. */
export function parseStoredValue(raw: string): unknown;

/**
 * JSON.stringify objects (null included); String() for other values.
 * Strings that parseStoredValue would read back as something else ("123",
 * "true", '{"a":1}') are JSON-encoded; other strings stay raw, so values
 * stored by older versions read back unchanged.
 */
export function serializeStoredValue(value: unknown): string;

interface SafeStorage {
  /** null when the key is missing or storage cannot be read. */
  getItem(key: string): string | null;
  /** false when the write throws (quota, blocked storage, etc.). */
  setItem(
    key: string,
    value: string,
    onError?: (error: unknown) => void,
  ): boolean;
  /** Swallows errors when storage is unavailable. */
  removeItem(key: string): void;
  /** Swallows errors when storage is unavailable. */
  clear(): void;
  /**
   * Call `fn` after another instance of this type on the page sets or removes
   * a key (`fn(key)`) or clears storage (`fn(null)`). Replaces any previous
   * listener. Returns a function that removes it.
   */
  onPeerChange(fn: (key: string | null) => void): () => void;
}

/**
 * Use localStorage or sessionStorage without throwing. getItem is null when
 * there is no window, storage is blocked, or the read throws. setItem is
 * false when the write throws. removeItem and clear ignore errors.
 * Successful changes are reported to listeners on other instances of the
 * same type (see `onPeerChange`).
 */
export function safeBrowserStorage(
  type: "localStorage" | "sessionStorage",
): SafeStorage;
