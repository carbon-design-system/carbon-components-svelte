export type PersonLike = {
  id: string | number;
  name: string;
  email?: string;
  secondary?: string;
};

/** Lowercase and drop accents, so "jose" finds "José". */
export function foldText(text: string | undefined): string;

/** Build the folded copies of `people` ahead of the first query. */
export function warmPeople(people: ReadonlyArray<PersonLike>): void;

/** People that match `query`, best first, at most `limit`. */
export function filterPeople<T extends PersonLike>(
  people: ReadonlyArray<T>,
  query: string,
  limit?: number,
  exclude?: (person: T) => boolean,
): T[];
