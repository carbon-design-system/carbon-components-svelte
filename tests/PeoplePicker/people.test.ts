// @vitest-environment node
import {
  addPeople,
  createEntry,
  isEmail,
  isList,
  isSamePerson,
  parseEntry,
  splitEntries,
} from "../../src/PeoplePicker/people.js";

const ada = { id: 1, name: "Ada", email: "ada@x.com" };
const grace = { id: 2, name: "Grace", email: "grace@x.com" };

describe("reading text as people", () => {
  it("accepts an address and rejects what is not one", () => {
    expect(isEmail("ada@x.com")).toBe(true);
    expect(isEmail(" ada@x.com ")).toBe(true);
    for (const bad of [
      "ada",
      "ada@x",
      "a b@x.com",
      "ada@x.com, b@y.com",
      "@x.com",
    ]) {
      expect(isEmail(bad)).toBe(false);
    }
  });

  it("splits a pasted list at commas, semicolons and lines, but not inside quotes", () => {
    expect(
      splitEntries('a@x.com, b@y.com;c@z.com\r\n"Doe, Jane" <jane@x.com> ,, '),
    ).toEqual(["a@x.com", "b@y.com", "c@z.com", '"Doe, Jane" <jane@x.com>']);
    expect(isList("a@x.com")).toBe(false);
    expect(isList("a@x.com, b@y.com")).toBe(true);
  });

  it("reads a name and an address", () => {
    expect(parseEntry("ada@x.com")).toEqual({
      name: "ada@x.com",
      email: "ada@x.com",
    });
    expect(parseEntry('"Lovelace, Ada" <ada@x.com>')).toEqual({
      name: "Lovelace, Ada",
      email: "ada@x.com",
    });
    expect(parseEntry("Ada")).toEqual({ name: "Ada" });
  });

  it("marks an entry invalid when its address fails", () => {
    expect(createEntry("ada@x.com")).toEqual({
      id: "ada@x.com",
      name: "ada@x.com",
      email: "ada@x.com",
      free: true,
    });
    expect(createEntry("Ada <nope>")).toMatchObject({
      free: true,
      invalid: true,
    });
    expect(createEntry("Ada")).toMatchObject({ free: true, invalid: true });
    expect(createEntry("Ada", () => true)).not.toHaveProperty("invalid");
    expect(createEntry("ada@x.com", () => "no")).toMatchObject({
      invalid: true,
    });
  });
});

describe("telling people apart", () => {
  it("matches by id and type, or by address", () => {
    expect(isSamePerson(ada, { id: 1, name: "Ada L." })).toBe(true);
    expect(isSamePerson(ada, { id: 9, name: "Ada", email: "ADA@x.com" })).toBe(
      true,
    );
    expect(isSamePerson(ada, { id: 1, name: "Team", type: "group" })).toBe(
      false,
    );
    // A group's address is not a person's.
    expect(
      isSamePerson(
        { id: "g", name: "G", type: "group" as const, email: "ada@x.com" },
        ada,
      ),
    ).toBe(false);
  });
});

describe("addPeople", () => {
  it("adds in order, skips duplicates by id and address, and stops at max", () => {
    const result = addPeople(
      [ada],
      [
        { id: 7, name: "Ada again", email: "Ada@x.com" },
        grace,
        { id: 3, name: "Alan" },
        { id: 4, name: "Linus" },
      ],
      { max: 3 },
    );
    expect(result.next.map((p) => p.name)).toEqual(["Ada", "Grace", "Alan"]);
    expect(result.rejected.map((r) => [r.person.name, r.reason])).toEqual([
      ["Ada again", "duplicate"],
      ["Linus", "max"],
    ]);
  });

  it("dedupes within the incoming list too", () => {
    const result = addPeople([], [grace, grace]);
    expect(result.added).toHaveLength(1);
  });

  it("replaces the person in single mode, ignoring max", () => {
    const result = addPeople([ada], [grace], { multiple: false, max: 0 });
    expect(result.next).toEqual([grace]);
  });

  it("does not change the list it is given", () => {
    const current = Object.freeze([ada]);
    expect(addPeople(current, [grace]).next).toHaveLength(2);
    expect(current).toHaveLength(1);
  });
});
