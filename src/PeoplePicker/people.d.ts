export type Person = {
  id: string | number;
  name: string;
  email?: string;
  /** Image URL. Without one the avatar shows initials, or a group glyph. */
  avatar?: string;
  /** Muted text under the name, such as a job title. */
  secondary?: string;
  type?: "user" | "group";
  /** Members of a group. */
  members?: ReadonlyArray<Person>;
  /** Size of a group whose `members` are not loaded. */
  memberCount?: number;
  /** Show the option but do not let it be chosen. */
  disabled?: boolean;
  /** An entry typed or pasted rather than chosen. */
  free?: boolean;
  /** A free entry that failed validation. */
  invalid?: boolean;
};

export function isEmail(text: string): boolean;

/** Pieces of pasted text, split at commas, semicolons and line breaks. */
export function splitEntries(text: string): string[];

/** Whether `text` holds more than one entry. */
export function isList(text: string): boolean;

/** Read `ada@x.com` or `Ada Lovelace <ada@x.com>` as a name and an address. */
export function parseEntry(text: string): { name: string; email?: string };

/** A free entry for typed or pasted text. */
export function createEntry(
  text: string,
  validate?: (entry: { name: string; email?: string }) => boolean | string,
): Person;

export function personKey(person: Person): string;

export function isSamePerson(a: Person, b: Person): boolean;

export function addPeople(
  current: ReadonlyArray<Person>,
  incoming: ReadonlyArray<Person>,
  options?: { max?: number; multiple?: boolean },
): {
  next: Person[];
  added: Person[];
  rejected: { person: Person; reason: "duplicate" | "max" }[];
};
