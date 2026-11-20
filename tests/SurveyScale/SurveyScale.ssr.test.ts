// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import SurveyScale from "./SurveyScale.test.svelte";

describe("SurveyScale server render", () => {
  it("renders the checked option, its check and the end labels", () => {
    const { document } = renderSSR(SurveyScale, {
      preset: "nps",
      value: 0,
    });
    const radios = [
      ...document.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    ];

    expect(radios).toHaveLength(11);
    expect(radios.filter((radio) => radio.hasAttribute("checked"))).toEqual([
      radios[0],
    ]);
    expect(document.querySelectorAll(".bx--survey-scale__check")).toHaveLength(
      1,
    );
    expect(document.body.textContent).toContain("Not at all likely");
    expect(document.body.textContent).toContain("Extremely likely");
  });

  it("names every radio group from the id, so hydration keeps it", () => {
    const first = renderSSR(SurveyScale, { preset: "nps", id: "q1" });
    const names = new Set(
      [...first.document.querySelectorAll<HTMLInputElement>("input")].map(
        (input) => input.name,
      ),
    );

    expect([...names]).toEqual(["survey-scale-q1"]);
  });
});
