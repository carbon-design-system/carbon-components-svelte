export type SequenceTreeOptions<T> = {
  /** The steps of a row's sequence: an array, or a string split by `separator`. */
  steps: (row: T, index: number) => unknown;
  /** How much a row counts. Defaults to one. */
  value?: (row: T, index: number) => unknown;
  separator?: string;
  rootLabel?: string;
  rootId?: string;
};

export type SequenceNode<T> = {
  /** The path joined; the root has a sentinel id, never empty. */
  id: string;
  parent: string | null;
  /** The step at this depth. */
  step: string;
  path: string[];
  depth: number;
  /** What passes through this prefix. */
  value: number;
  rows: T[];
};

export type SequenceTree<T> = {
  /** Depth-first from the root, siblings in first-seen order. */
  nodes: SequenceNode<T>[];
  total: number;
};

/** A node per distinct prefix of the sequences, under one root. */
export function sequenceTree<T>(
  rows: ReadonlyArray<T>,
  options: SequenceTreeOptions<T>,
): SequenceTree<T>;
