// @vitest-environment node
import { filterPeople } from "../../src/PeoplePicker/filter-people.js";

const p = (name: string, extra: Record<string, string> = {}) => ({
  id: name,
  name,
  ...extra,
});

describe("filterPeople", () => {
  it("ranks a prefix, then a later word, then a substring, then email or title", () => {
    const people = [
      p("Zed", { email: "a@x.com" }),
      p("Xavier"),
      p("Ann Marie"),
      p("Maria"),
      p("Oma Ria"),
    ];
    expect(filterPeople(people, "ria").map((x) => x.name)).toEqual([
      "Oma Ria",
      "Maria",
    ]);
    expect(filterPeople(people, "ma").map((x) => x.name)).toEqual([
      "Maria",
      "Ann Marie",
      "Oma Ria",
    ]);
    expect(filterPeople(people, "a@x").map((x) => x.name)).toEqual(["Zed"]);
  });

  it("folds accents and Arabic marks, both ways", () => {
    const people = [p("José"), p("مُحَمَّد"), p("محمد علي")];
    expect(filterPeople(people, "jose").map((x) => x.name)).toEqual(["José"]);
    expect(filterPeople(people, "محمد").map((x) => x.name)).toEqual([
      "مُحَمَّد",
      "محمد علي",
    ]);
    expect(filterPeople(people, "مُحَمَّد").map((x) => x.name)).toEqual([
      "مُحَمَّد",
      "محمد علي",
    ]);
  });

  it("skips excluded people before counting toward the limit", () => {
    const people = [p("Ann"), p("Anna"), p("Annie")];
    const out = filterPeople(people, "an", 2, (x) => x.name === "Ann");
    expect(out.map((x) => x.name)).toEqual(["Anna", "Annie"]);
    expect(
      filterPeople(people, "", 2, (x) => x.name === "Ann").map((x) => x.name),
    ).toEqual(["Anna", "Annie"]);
  });

  it("reads the list and never changes it", () => {
    const people = Object.freeze([p("B"), p("A")]);
    expect(filterPeople(people, "").map((x) => x.name)).toEqual(["B", "A"]);
  });
});
