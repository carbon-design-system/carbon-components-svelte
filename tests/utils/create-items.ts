/** Builds `count` `{ id, text }` items, "Item 1" through "Item N", for list box `items` props. */
export function createItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    text: `Item ${i + 1}`,
  }));
}
