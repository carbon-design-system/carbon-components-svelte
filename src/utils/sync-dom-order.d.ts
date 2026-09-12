/** Reorder id-bearing items to match DOM order; reassign `index`; drop orphans. */
export function syncDomOrder<T extends { id: string }>(options: {
  root: Element;
  selector: string;
  items: readonly T[];
}): (T & { index: number })[];
