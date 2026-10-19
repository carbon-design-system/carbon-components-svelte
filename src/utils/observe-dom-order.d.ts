/** Call `onReorder` when matching elements in `root` leave registry order; returns a stop function. */
export function observeDomOrder(
  root: Element,
  options: {
    selector: string;
    getItems: () => readonly { id: string }[];
    onReorder: () => void;
  },
): () => void;
