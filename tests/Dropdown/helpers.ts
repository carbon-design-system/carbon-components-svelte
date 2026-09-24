/** Builds `count` `{ id, text }` items for a Dropdown's `items` prop. */
export function createItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    text: `Item ${i + 1}`,
  }));
}
