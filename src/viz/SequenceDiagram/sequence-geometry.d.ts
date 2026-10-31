export type SequenceOptions<T> = {
  from: (row: T, index: number) => unknown;
  to: (row: T, index: number) => unknown;
  label?: (row: T, index: number) => unknown;
  /** `"call"`, `"return"`, or any word; `"return"` is drawn dashed. */
  kind?: (row: T, index: number) => unknown;
  /** A number to sort messages by. Defaults to input order. */
  order?: (row: T, index: number) => unknown;
  /** Actor order. Actors not named are added as first seen. */
  actors?: ReadonlyArray<string | number>;
  actorWidth: number;
  actorGap: number;
  rowHeight: number;
  /** Height of the actor boxes, where the first message row starts. */
  top: number;
};

export type SequenceActor = { name: string; index: number; x: number };

export type SequenceMessage<T> = {
  id: string;
  step: number;
  index: number;
  from: string;
  to: string;
  label: string;
  kind: string;
  /** Sent to the sender itself. */
  self: boolean;
  x1: number;
  x2: number;
  y: number;
  datum: T;
  d: string;
  labelX: number;
  labelAnchor: "start" | "middle";
};

export type Sequence<T> = {
  actors: SequenceActor[];
  /** In the order drawn, top to bottom. */
  messages: SequenceMessage<T>[];
  width: number;
  height: number;
};

/** Actors across the top and one message per row down the page. */
export function buildSequence<T>(
  rows: ReadonlyArray<T>,
  options: SequenceOptions<T>,
): Sequence<T>;
