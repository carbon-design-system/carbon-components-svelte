import {
  defaultDisplay,
  findPoint,
  pointName,
  resolveEnds,
  resolvePoints,
} from "carbon-components-svelte/utils/survey-scale-points.js";

describe("resolvePoints", () => {
  it("builds NPS as 0 to 10 and Likert as 1 to the level", () => {
    expect(resolvePoints({ preset: "nps" }).map((p) => p.value)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(resolvePoints({ levels: 7 })).toHaveLength(7);
    expect(resolvePoints({ preset: "csat" }).map((p) => p.face)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("lets custom points win, and a missing label keep its default", () => {
    expect(resolvePoints({ preset: "nps", points: [{ value: "a" }] })).toEqual([
      { value: "a" },
    ]);
    const labels = resolvePoints({ labels: ["Nope", ""] }).map((p) => p.label);
    expect(labels.slice(0, 3)).toEqual([
      "Nope",
      "Disagree",
      "Neither agree nor disagree",
    ]);
  });
});

describe("resolveEnds", () => {
  const points = resolvePoints({ preset: "csat" });

  it("borrows the first and last label unless each option shows its label", () => {
    expect(resolveEnds({ preset: "csat", display: "icon", points })).toEqual({
      min: "Very dissatisfied",
      max: "Very satisfied",
    });
    expect(resolveEnds({ preset: "csat", display: "label", points })).toEqual({
      min: "",
      max: "",
    });
  });

  it("hides an end set to an empty string", () => {
    expect(
      resolveEnds({ preset: "nps", display: "number", points, maxLabel: "" }),
    ).toEqual({ min: "Not at all likely", max: "" });
  });

  it("gives custom points no NPS ends", () => {
    expect(
      resolveEnds({ preset: "nps", display: "number", points, custom: true }),
    ).toEqual({ min: "Very dissatisfied", max: "Very satisfied" });
  });
});

describe("pointName, defaultDisplay, findPoint", () => {
  it("keeps what is drawn in the name", () => {
    const point = { value: 4, label: "Satisfied" };
    expect(pointName(point, "number")).toEqual({
      visible: "4",
      hidden: "Satisfied",
    });
    expect(pointName(point, "label")).toEqual({
      visible: "Satisfied",
      hidden: "",
    });
    expect(pointName(point, "icon")).toEqual({
      visible: "",
      hidden: "Satisfied",
    });
    expect(defaultDisplay("csat")).toBe("icon");
  });

  it("matches a value to its point as a string, and 0 is a value", () => {
    const points = resolvePoints({ preset: "nps" });
    expect(findPoint(points, "0")?.value).toBe(0);
    expect(findPoint(points, 0)?.value).toBe(0);
    expect(findPoint(points, undefined)).toBeUndefined();
  });
});
