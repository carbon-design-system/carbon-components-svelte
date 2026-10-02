import type { Readable } from "svelte/store";

export type IdMembershipStore<Id extends string | number> = {
  /** Whether `id` is currently a member. */
  has: (id: Id) => boolean;
  /** Replace the members; notifies only ids that were added or removed. */
  set: (ids: Iterable<Id>) => void;
  /** A readable store of whether `id` is a member. */
  select: (id: Id) => Readable<boolean>;
};

/**
 * A set of ids whose subscribers listen to one id each, so replacing the
 * set notifies only the ids whose membership changed.
 */
export function createIdMembershipStore<Id extends string | number>(
  initial?: Iterable<Id>,
): IdMembershipStore<Id>;
