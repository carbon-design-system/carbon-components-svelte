import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import SurveyScale from "./SurveyScale.test.svelte";

const radios = () => screen.getAllByRole("radio") as HTMLInputElement[];

describe("SurveyScale", () => {
  it("renders an NPS scale from 0 to 10 in a group named by its legend", () => {
    render(SurveyScale, { preset: "nps" });

    expect(
      screen.getByRole("radiogroup", {
        name: "How likely are you to recommend us?",
      }),
    ).toBeInTheDocument();
    expect(radios().map((radio) => radio.value)).toEqual(
      Array.from({ length: 11 }, (_, index) => String(index)),
    );
    expect(radios()[7]).toHaveAccessibleName("7");
    expect(radios().some((radio) => radio.checked)).toBe(false);
  });

  it("describes the group by what its ends mean, and the end options by their label", () => {
    render(SurveyScale, { preset: "nps" });

    expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription(
      "0 is Not at all likely, 10 is Extremely likely",
    );
    expect(radios()[0]).toHaveAccessibleDescription("Not at all likely");
    expect(radios()[10]).toHaveAccessibleDescription("Extremely likely");
    expect(radios()[5]).toHaveAccessibleDescription("");
  });

  it("treats 0 as an answer, and leaves the value undefined until one is given", async () => {
    const { component } = render(SurveyScale, { preset: "nps" });
    expect(screen.getByTestId("value")).toHaveTextContent("none");

    await user.click(radios()[0]);

    expect(screen.getByTestId("value")).toHaveTextContent("0");
    expect(radios()[0]).toBeChecked();
    expect(component.changes).toEqual([0]);
  });

  it("keeps a number a number, and a string key a string", async () => {
    const { component } = render(SurveyScale, {
      points: [
        { value: "yes", label: "Yes" },
        { value: "unsure", label: "Not sure" },
      ],
      display: "label",
    });

    await user.click(screen.getByRole("radio", { name: "Not sure" }));

    expect(component.value).toBe("unsure");
  });

  it("names a CSAT face by its label and a Likert option by its phrase", () => {
    const { unmount } = render(SurveyScale, { preset: "csat" });
    expect(radios()[0]).toHaveAccessibleName("Very dissatisfied");
    expect(radios()[4]).toHaveAccessibleName("Very satisfied");
    unmount();

    render(SurveyScale, { levels: 7 });
    expect(radios()).toHaveLength(7);
    expect(radios()[3]).toHaveAccessibleName("Neither agree nor disagree");
  });

  it("keeps the label in the name of a numeric option that has one", () => {
    render(SurveyScale, { preset: "csat", display: "number" });

    expect(radios()[3]).toHaveAccessibleName("4 Satisfied");
  });

  it("moves the answer with the arrow keys, like native radios", async () => {
    render(SurveyScale, { preset: "nps", value: 3 });

    radios()[3].focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");

    expect(radios()[5]).toBeChecked();
    expect(screen.getByTestId("value")).toHaveTextContent("5");
  });

  it("clears the answer on the current choice only with allowDeselect", async () => {
    const { component, rerender } = render(SurveyScale, {
      preset: "nps",
      value: 8,
    });
    await user.click(radios()[8]);
    expect(component.value).toBe(8);

    await rerender({ allowDeselect: true });
    await user.click(radios()[8]);

    expect(component.value).toBeUndefined();
    expect(component.changes).toEqual([null]);
  });

  it("ignores clicks when read-only", async () => {
    const { component } = render(SurveyScale, {
      preset: "nps",
      value: 4,
      readonly: true,
    });

    await user.click(radios()[9]);

    expect(component.value).toBe(4);
    expect(radios()[4]).toBeChecked();
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-readonly",
      "true",
    );
  });

  it("requires an answer and submits the chosen value with the form", async () => {
    render(SurveyScale, { preset: "nps", name: "nps", required: true });
    const form = getForm();

    expect(form.checkValidity()).toBe(false);
    await user.click(radios()[9]);

    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get("nps")).toBe("9");
  });

  it("follows the form when it resets", async () => {
    const { component } = render(SurveyScale, { preset: "nps", value: 6 });
    await user.click(radios()[9]);

    await user.click(screen.getByRole("button", { name: "Reset" }));
    await flushFormReset();

    // Reset restores the markup's own default: no radio is checked.
    expect(component.value).toBeUndefined();
    expect(radios().some((radio) => radio.checked)).toBe(false);
    expect(component.changes).toEqual([9]);
  });

  it("gives each scale its own radio group, so two scales don't share an answer", async () => {
    render(SurveyScale, { preset: "nps" });
    render(SurveyScale, { preset: "nps" });

    await user.click(screen.getAllByRole("radio")[2]);
    await user.click(screen.getAllByRole("radio")[11 + 5]);

    expect(
      screen
        .getAllByRole("radio")
        .filter((radio) => (radio as HTMLInputElement).checked),
    ).toHaveLength(2);
  });

  it("replaces the preset's labels in order", () => {
    render(SurveyScale, {
      labels: ["Muy en desacuerdo", "En desacuerdo", "Neutral"],
    });

    expect(radios()[0]).toHaveAccessibleName("Muy en desacuerdo");
    expect(radios()[2]).toHaveAccessibleName("Neutral");
    expect(radios()[4]).toHaveAccessibleName("Strongly agree");
  });

  it("draws a check in the chosen option", async () => {
    const { container } = render(SurveyScale, { preset: "nps" });
    expect(container.querySelector(".bx--survey-scale__check")).toBeNull();

    await user.click(radios()[3]);

    expect(
      radios()[3].closest("label")?.querySelector(".bx--survey-scale__check"),
    ).not.toBeNull();
  });
});
