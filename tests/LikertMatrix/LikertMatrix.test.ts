import { render, screen, within } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import LikertMatrix from "./LikertMatrix.test.svelte";

/** The radio for `point` in the group for `statement`. */
const radio = (statement: string, point: string) =>
  within(screen.getByRole("radiogroup", { name: statement })).getByRole(
    "radio",
    { name: point },
  ) as HTMLInputElement;

describe("LikertMatrix", () => {
  it("renders a radio group per statement, named by its legend, inside the matrix group", () => {
    render(LikertMatrix);

    const matrix = screen.getByRole("group", { name: "Setting up" });
    const groups = within(matrix).getAllByRole("radiogroup");
    expect(groups).toEqual([
      screen.getByRole("radiogroup", {
        name: "Creating my account was quick.",
      }),
      screen.getByRole("radiogroup", { name: "Inviting my team was easy." }),
    ]);
  });

  it("names each radio by its point", () => {
    render(LikertMatrix);

    expect(
      radio("Creating my account was quick.", "Agree"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(10);
  });

  it("gives each statement its own radio group, answered independently", async () => {
    const { component } = render(LikertMatrix);

    await user.click(radio("Creating my account was quick.", "Agree"));
    await user.click(radio("Inviting my team was easy.", "Disagree"));
    await user.click(radio("Creating my account was quick.", "Strongly agree"));

    expect(component.value).toEqual({ quick: 5, team: 2 });
    expect(radio("Creating my account was quick.", "Agree")).not.toBeChecked();
    expect(radio("Inviting my team was easy.", "Disagree")).toBeChecked();
    expect(component.changes).toEqual([
      { id: "quick", value: 4 },
      { id: "team", value: 2 },
      { id: "quick", value: 5 },
    ]);
  });

  it("moves within a row with the arrow keys and leaves it with Tab", async () => {
    render(LikertMatrix, { value: { quick: 2 } });

    radio("Creating my account was quick.", "Disagree").focus();
    await user.keyboard("{ArrowRight}");
    expect(
      radio("Creating my account was quick.", "Neither agree nor disagree"),
    ).toBeChecked();

    await user.tab();
    expect(
      within(
        screen.getByRole("radiogroup", { name: "Inviting my team was easy." }),
      ).getAllByRole("radio")[0],
    ).toHaveFocus();
  });

  it("starts from the answers it is given", () => {
    render(LikertMatrix, { value: { team: 5 } });

    expect(radio("Inviting my team was easy.", "Strongly agree")).toBeChecked();
    expect(
      radio("Creating my account was quick.", "Strongly agree"),
    ).not.toBeChecked();
  });

  it("names each group from the matrix id, so two matrices never share one", async () => {
    render(LikertMatrix);
    render(LikertMatrix);

    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    await user.click(radios[0]);
    await user.click(radios[10]);

    expect(radios.filter((input) => input.checked)).toHaveLength(2);
  });

  it("submits each answer under its statement name", async () => {
    render(LikertMatrix, { name: "onboarding", required: true });
    const form = getForm();

    expect(form.checkValidity()).toBe(false);
    await user.click(radio("Creating my account was quick.", "Agree"));
    await user.click(radio("Inviting my team was easy.", "Disagree"));

    expect(form.checkValidity()).toBe(true);
    expect(Object.fromEntries(new FormData(form))).toEqual({
      "onboarding-quick": "4",
      "onboarding-team": "2",
    });
  });

  it("marks a statement that needs an answer", () => {
    render(LikertMatrix, {
      statements: [{ id: "a", text: "Missing.", invalid: true }],
    });

    expect(
      screen.getByRole("radiogroup", { name: "Missing." }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("follows the form when it resets", async () => {
    const { component } = render(LikertMatrix, { value: { quick: 3 } });
    await user.click(radio("Inviting my team was easy.", "Agree"));

    await user.click(screen.getByRole("button", { name: "Reset" }));
    await flushFormReset();

    expect(component.value).toEqual({});
  });

  it("ignores clicks when read-only", async () => {
    const { component } = render(LikertMatrix, {
      readonly: true,
      value: { quick: 4 },
    });

    await user.click(radio("Creating my account was quick.", "Disagree"));

    expect(component.value).toEqual({ quick: 4 });
    expect(radio("Creating my account was quick.", "Agree")).toBeChecked();
  });

  it("renders a 7-point matrix of 10 statements without a component per cell", () => {
    const statements = Array.from({ length: 10 }, (_, index) => ({
      id: `s${index}`,
      text: `Statement ${index}`,
    }));
    const { container } = render(LikertMatrix, { levels: 7, statements });

    expect(screen.getAllByRole("radio")).toHaveLength(70);
    // Labels, radios, marks and names are plain markup: 4 elements an option.
    expect(
      container.querySelectorAll(
        ".bx--likert-matrix__option, .bx--likert-matrix__option *",
      ),
    ).toHaveLength(70 * 4);
  });
});
