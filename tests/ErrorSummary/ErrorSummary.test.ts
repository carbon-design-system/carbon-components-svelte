import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ErrorSummary from "./ErrorSummary.test.svelte";

const summary = () => screen.getByRole("group", { name: "There is a problem" });

const errors = [
  { fieldId: "name", message: "Enter a name" },
  { fieldId: "plan", message: "Choose a plan" },
];

describe("ErrorSummary", () => {
  it("lists each error as a link to its field", () => {
    render(ErrorSummary, { errors });

    const group = screen.getByRole("group", { name: "There is a problem" });
    expect(group).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "There is a problem",
    );
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "#name",
      "#plan",
    ]);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders nothing without errors", () => {
    render(ErrorSummary, { errors: [] });

    expect(
      screen.queryByRole("group", { name: "There is a problem" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists an error without a field as text", () => {
    render(ErrorSummary, { errors: [{ message: "The server is down" }] });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent(
      "The server is down",
    );
  });

  it("takes focus when the errors appear", async () => {
    const { rerender } = render(ErrorSummary, { errors: [] });

    await rerender({ errors });

    expect(summary()).toHaveFocus();
  });

  it("takes focus on mount when it already has errors", async () => {
    render(ErrorSummary, { errors });

    await vi.waitFor(() => expect(summary()).toHaveFocus());
  });

  it("does not take focus while the errors only change", async () => {
    const { rerender } = render(ErrorSummary, { errors });
    await vi.waitFor(() => expect(summary()).toHaveFocus());

    screen.getByLabelText("Email").focus();
    await rerender({ errors: [errors[0]] });

    expect(screen.getByLabelText("Email")).toHaveFocus();
  });

  it("is a live alert instead when it does not take focus", async () => {
    const { rerender } = render(ErrorSummary, {
      errors: [],
      focusOnShow: false,
    });
    screen.getByLabelText("Email").focus();

    await rerender({ errors });

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a name");
    expect(screen.getByLabelText("Email")).toHaveFocus();
  });

  it("moves focus on request, for a repeated failed submit", async () => {
    const { component } = render(ErrorSummary, { errors });
    await vi.waitFor(() => expect(summary()).toHaveFocus());
    screen.getByLabelText("Email").focus();

    component.focusSummary();

    expect(summary()).toHaveFocus();
  });

  it("focuses the field when a link is clicked", async () => {
    render(ErrorSummary, { errors });

    await user.click(screen.getByRole("link", { name: "Enter a name" }));

    expect(screen.getByLabelText("Name")).toHaveFocus();
  });

  it("focuses the first radio of a group from the group's id", async () => {
    render(ErrorSummary, { errors });

    await user.click(screen.getByRole("link", { name: "Choose a plan" }));

    expect(screen.getByLabelText("A")).toHaveFocus();
  });

  it("focuses the checked radio of a group", async () => {
    render(ErrorSummary, { errors });
    await user.click(screen.getByLabelText("B"));

    await user.click(screen.getByRole("link", { name: "Choose a plan" }));

    expect(screen.getByLabelText("B")).toHaveFocus();
  });

  it("lets a link navigate when the field is not on the page", () => {
    const select = vi.fn();
    render(ErrorSummary, {
      errors: [{ fieldId: "missing", message: "Gone" }],
      onselect: select,
    });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });

    screen.getByRole("link", { name: "Gone" }).dispatchEvent(click);

    expect(select).toHaveBeenCalledTimes(1);
    expect(click.defaultPrevented).toBe(false);
  });

  it("dispatches a cancelable select before focusing", async () => {
    const select = vi.fn((event: CustomEvent) => event.preventDefault());
    render(ErrorSummary, { errors, onselect: select });

    await user.click(screen.getByRole("link", { name: "Enter a name" }));

    expect(screen.getByLabelText("Name")).not.toHaveFocus();
    expect(select.mock.calls[0][0].detail).toEqual({
      error: errors[0],
      index: 0,
    });
  });

  it("sets the heading level", () => {
    render(ErrorSummary, { errors, headingLevel: 3 });

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "There is a problem",
    );
  });
});

describe("collectFormErrors", () => {
  it("lists each invalid field once, in document order", async () => {
    const { component } = render(ErrorSummary, { invalid: true });

    const collected = await component.collect();

    expect(collected).toEqual([
      { fieldId: "name", message: "Enter a name" },
      { fieldId: "plan-a", message: "Choose a plan" },
      { fieldId: "topic-a", message: "Pick a topic" },
      { fieldId: "volume", message: "Too loud" },
      // Fields in one fieldset keep their own messages.
      { fieldId: "street", message: "Enter a street" },
      { fieldId: "city", message: "Enter a city" },
    ]);
  });

  it("lists nothing for a valid form", async () => {
    const { component } = render(ErrorSummary, { invalid: false });

    expect(await component.collect()).toEqual([]);
  });
});
