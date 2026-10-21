import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import { hover, star } from "./helpers";
import StarRating from "./StarRating.test.svelte";
import StarRatingForm from "./StarRatingForm.test.svelte";
import StarRatingText from "./StarRatingText.test.svelte";

const filled = (container: HTMLElement) =>
  container.querySelectorAll(".bx--star-rating__star--on").length;

describe("StarRating", () => {
  it("renders a group named by its legend with a radio per star", () => {
    render(StarRating);

    expect(
      screen.getByRole("radiogroup", { name: "Overall rating" }),
    ).toBeVisible();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(5);
    expect(radios[0]).toHaveAccessibleName("1 out of 5 stars");
    expect(radios[4]).toHaveAccessibleName("5 out of 5 stars");
    expect(radios.some((radio) => (radio as HTMLInputElement).checked)).toBe(
      false,
    );
  });

  it("sets the value and dispatches change when a star is chosen", async () => {
    const { component } = render(StarRating);

    await user.click(star(4));

    expect(screen.getByTestId("value")).toHaveTextContent("4");
    expect(star(4)).toBeChecked();
    expect(component.changes).toEqual([4]);
  });

  it("fills the stars up to the value, and up to a hovered star", async () => {
    const { container } = render(StarRating, { value: 2 });
    expect(filled(container)).toBe(2);

    await hover(4);
    expect(filled(container)).toBe(4);
    expect(screen.getByTestId("value")).toHaveTextContent("2");

    await fireEvent.pointerLeave(
      container.querySelector(".bx--star-rating__stars") as HTMLElement,
    );
    expect(filled(container)).toBe(2);
  });

  it("drops the hover preview when the rating becomes disabled", async () => {
    const { container, rerender } = render(StarRating, { value: 2 });

    await hover(5);
    expect(filled(container)).toBe(5);

    await rerender({ disabled: true });

    expect(filled(container)).toBe(2);
  });

  it("previews only for a mouse, and shows a chosen star over the preview", async () => {
    const { container } = render(StarRating, { value: 2 });

    // A tap has no leave to clear a preview, so touch doesn't start one.
    await hover(4, "touch");
    expect(filled(container)).toBe(2);

    await hover(4);
    await fireEvent.click(star(3));
    expect(filled(container)).toBe(3);
  });

  it("keeps the rating when the current star is clicked", async () => {
    render(StarRating, { value: 3 });

    await user.click(star(3));

    expect(screen.getByTestId("value")).toHaveTextContent("3");
  });

  it("clears the rating when the current star is clicked with allowDeselect", async () => {
    const { component } = render(StarRating, { value: 3, allowDeselect: true });

    await user.click(star(3));

    expect(screen.getByTestId("value")).toHaveTextContent("0");
    expect(component.changes).toEqual([0]);
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });

  it("names the stars with valueText and renders max stars", () => {
    render(StarRating, {
      max: 3,
      valueText: (value: number) => ["Poor", "Good", "Great"][value - 1],
    });

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Great" })).toBeInTheDocument();
  });

  it.each([
    [
      "the warning text",
      { warn: true, warnText: "Add a comment" },
      "Add a comment",
    ],
    ["helper text", { helperText: "Rate your stay" }, "Rate your stay"],
  ])("describes the group with %s", (_, props, description) => {
    render(StarRating, props);

    expect(
      screen.getByRole("radiogroup", { name: "Overall rating" }),
    ).toHaveAccessibleDescription(description);
  });

  it("shows the invalid message and describes the group with it", () => {
    render(StarRating, {
      helperText: "Rate your stay",
      invalid: true,
      invalidText: "Choose a rating",
    });

    const group = screen.getByRole("radiogroup", { name: "Overall rating" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription("Choose a rating");
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a rating");
    expect(screen.queryByText("Rate your stay")).not.toBeInTheDocument();
  });

  it("hides the helper text while a warning shows", () => {
    render(StarRating, {
      helperText: "Rate your stay",
      warn: true,
      warnText: "Add a comment",
    });

    expect(screen.queryByText("Rate your stay")).not.toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: "Overall rating" }),
    ).toHaveAccessibleDescription("Add a comment");
  });

  it("suppresses the invalid state while disabled", () => {
    render(StarRating, {
      disabled: true,
      invalid: true,
      invalidText: "Choose a rating",
    });

    const group = screen.getByRole("radiogroup", { name: "Overall rating" });
    expect(group).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("gives each rating its own radio group", async () => {
    const first = render(StarRating);
    const second = render(StarRating);
    const radio = (view: typeof first, n: number) =>
      within(view.container).getByRole("radio", {
        name: `${n} out of 5 stars`,
      });

    await user.click(radio(first, 2));
    await user.click(radio(second, 3));

    expect(radio(first, 2)).toBeChecked();
    expect(radio(second, 3)).toBeChecked();
  });

  it("requires a rating", () => {
    render(StarRating, { required: true });

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeRequired();
    }
  });

  it("hides the legend visually and keeps it as the name", () => {
    render(StarRating, { hideLegend: true });

    expect(screen.getByText("Overall rating")).toHaveClass(
      "bx--visually-hidden",
    );
    expect(
      screen.getByRole("radiogroup", { name: "Overall rating" }),
    ).toBeInTheDocument();
  });

  it("describes a read-only rating with its helper text", () => {
    render(StarRating, {
      readonly: true,
      value: 4,
      helperText: "Based on 12 reviews",
    });

    expect(screen.getByRole("img")).toHaveAccessibleDescription(
      "Based on 12 reviews",
    );
  });

  it("does not preview a hovered star while disabled", async () => {
    const { container } = render(StarRating, { value: 2, disabled: true });

    await hover(5);

    expect(filled(container)).toBe(2);
  });

  it("disables every star", () => {
    render(StarRating, { disabled: true });

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });

  it("renders text beside the stars that previews a hovered star", async () => {
    render(StarRatingText);
    expect(screen.getByText("Fair")).toBeInTheDocument();

    await hover(4);

    expect(screen.getByText("Very good")).toBeInTheDocument();
  });

  it("renders text beside a read-only rating, outside its image", () => {
    render(StarRatingText, { readonly: true, value: 5 });

    expect(
      screen.getByRole("img", { name: "Overall rating 5 out of 5 stars" }),
    ).not.toHaveTextContent("Excellent");
    expect(screen.getByText("Excellent")).toBeVisible();
  });

  it("renders a read-only rating as one image with partial stars", () => {
    const { container } = render(StarRating, { value: 4.5, readonly: true });

    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(
      screen.getByRole("img", { name: "Overall rating 4.5 out of 5 stars" }),
    ).toBeVisible();
    const fills = [...container.querySelectorAll(".bx--star-rating__star")].map(
      (star) =>
        (star as HTMLElement).style.getPropertyValue("--ccs-star-rating-fill"),
    );
    expect(fills).toEqual(["1", "1", "1", "1", "0.5"]);
  });

  it("submits the rating with the form and follows a reset", async () => {
    const { component } = render(StarRatingForm);

    await user.click(star(2));
    expect(new FormData(getForm()).get("rating")).toBe("2");

    getForm().reset();
    await flushFormReset();

    expect(component.value).toBe(0);
    expect(new FormData(getForm()).get("rating")).toBeNull();
  });

  it("follows the reset of a form it names with `form`", async () => {
    const { component, container } = render(StarRatingForm, { outside: true });

    await user.click(star(4));
    expect(new FormData(getForm()).get("rating")).toBe("4");

    getForm().reset();
    await flushFormReset();

    expect(component.value).toBe(0);
    expect(filled(container)).toBe(0);
    expect(new FormData(getForm()).get("rating")).toBeNull();
  });
});
