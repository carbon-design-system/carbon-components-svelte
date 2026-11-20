// @ts-check
// The pure half of `PeoplePicker`: reading typed or pasted text as people,
// telling two people apart, and adding some to a list under a limit.

/**
 * A person or a group.
 * @typedef {object} Person
 * @property {string | number} id
 * @property {string} name
 * @property {string} [email]
 * @property {string} [avatar] Image URL. Without one the avatar shows initials, or a group glyph.
 * @property {string} [secondary] Muted text under the name, such as a job title.
 * @property {"user" | "group"} [type="user"]
 * @property {ReadonlyArray<Person>} [members] Members of a group.
 * @property {number} [memberCount] Size of a group whose `members` are not loaded.
 * @property {boolean} [disabled] Show the option but do not let it be chosen.
 * @property {boolean} [free] An entry typed or pasted rather than chosen.
 * @property {boolean} [invalid] A free entry that failed validation.
 */

// Something@something.tld, no spaces or list separators. Deliberately loose:
// the server is the judge of whether an address exists.
const EMAIL = /^[^\s@,;<>()[\]"]+@[^\s@,;<>()[\]"]+\.[^\s@,;<>()[\]"]{2,}$/;

const ENTRY_PIECES = /(?:"[^"]*"|<[^>]*>|[^,;\r\n])+/g;
const LIST_SEPARATOR = /[,;\r\n]/;
const ANGLE_ENTRY = /^(.*?)\s*<([^<>]+)>$/;
const QUOTED = /^"(.*)"$/;

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isEmail(text) {
  return EMAIL.test(text.trim());
}

/**
 * Pieces of pasted text: split at commas, semicolons and line breaks, but not
 * inside quotes or angle brackets, so `"Lovelace, Ada" <ada@x.com>` stays one.
 * @param {string} text
 * @returns {string[]}
 */
export function splitEntries(text) {
  return (text.match(ENTRY_PIECES) ?? [])
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Whether `text` holds more than one entry, so a paste of it is a list.
 * @param {string} text
 * @returns {boolean}
 */
export function isList(text) {
  return LIST_SEPARATOR.test(text.trim());
}

/**
 * Read `ada@x.com` or `Ada Lovelace <ada@x.com>` as a name and an address.
 * Text that holds no address comes back as a name alone.
 * @param {string} text
 * @returns {{ name: string, email?: string }}
 */
export function parseEntry(text) {
  const trimmed = text.trim();
  const angle = ANGLE_ENTRY.exec(trimmed);
  if (angle) {
    const email = angle[2].trim();
    const name = angle[1].replace(QUOTED, "$1").trim();
    return { name: name || email, email };
  }
  return isEmail(trimmed)
    ? { name: trimmed, email: trimmed }
    : { name: trimmed };
}

/**
 * A free entry for typed or pasted text.
 * @param {string} text
 * @param {(entry: { name: string, email?: string }) => boolean | string} [validate]
 *   Return `true` to accept the entry. Default accepts an email address.
 * @returns {Person}
 */
export function createEntry(text, validate) {
  const entry = parseEntry(text);
  const verdict = validate
    ? validate(entry)
    : entry.email !== undefined && isEmail(entry.email);
  /** @type {Person} */
  const person = {
    id: entry.email ?? entry.name,
    name: entry.name,
    free: true,
  };
  if (entry.email !== undefined) person.email = entry.email;
  if (verdict !== true) person.invalid = true;
  return person;
}

/**
 * Identifies a person for duplicate checks. A group and a user may share an id.
 * @param {Person} person
 * @returns {string}
 */
export function personKey(person) {
  return person.free && person.email
    ? `email:${person.email.toLowerCase()}`
    : `${person.type ?? "user"}:${person.id}`;
}

/**
 * Whether two people are the same: the same id, or the same email address
 * (so a typed address does not duplicate a person who has it).
 * @param {Person} a
 * @param {Person} b
 * @returns {boolean}
 */
export function isSamePerson(a, b) {
  if (personKey(a) === personKey(b)) return true;
  return (
    !!a.email &&
    !!b.email &&
    (a.type ?? "user") === "user" &&
    (b.type ?? "user") === "user" &&
    a.email.toLowerCase() === b.email.toLowerCase()
  );
}

/**
 * Add `incoming` to `current`, in order, skipping duplicates and stopping at
 * `max`. Nothing is mutated. In single mode the last person replaces the
 * current one.
 *
 * @param {ReadonlyArray<Person>} current
 * @param {ReadonlyArray<Person>} incoming
 * @param {object} [options]
 * @param {number} [options.max] Most people allowed. `undefined` for no limit.
 * @param {boolean} [options.multiple=true] When `false`, the list holds one person.
 * @returns {{ next: Person[], added: Person[], rejected: { person: Person, reason: "duplicate" | "max" }[] }}
 */
export function addPeople(current, incoming, options = {}) {
  const { max, multiple = true } = options;

  if (!multiple) {
    const person = incoming[incoming.length - 1];
    return person
      ? { next: [person], added: [person], rejected: [] }
      : { next: [...current], added: [], rejected: [] };
  }

  /** @type {Person[]} */
  const next = [...current];
  /** @type {Person[]} */
  const added = [];
  /** @type {{ person: Person, reason: "duplicate" | "max" }[]} */
  const rejected = [];
  const keys = new Set(current.map(personKey));
  const emails = new Set(
    current.flatMap((person) =>
      person.email && (person.type ?? "user") === "user"
        ? [person.email.toLowerCase()]
        : [],
    ),
  );

  for (const person of incoming) {
    const key = personKey(person);
    const email =
      person.email && (person.type ?? "user") === "user"
        ? person.email.toLowerCase()
        : undefined;
    if (keys.has(key) || (email !== undefined && emails.has(email))) {
      rejected.push({ person, reason: "duplicate" });
      continue;
    }
    if (max !== undefined && next.length >= max) {
      rejected.push({ person, reason: "max" });
      continue;
    }
    keys.add(key);
    if (email !== undefined) emails.add(email);
    next.push(person);
    added.push(person);
  }

  return { next, added, rejected };
}
