import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Disclosure from "./Disclosure.test.svelte";
import DisclosureSummaryProp from "./DisclosureSummaryProp.test.svelte";

describe("Disclosure", () => {
  it("should render the summary prop when no summary slot is provided", () => {
    render(DisclosureSummaryProp);

    expect(
      screen.getByRole("button", { name: "Show details" }),
    ).toBeInTheDocument();
  });

  it("should render with default props", () => {
    render(Disclosure);

    const control = screen.getByRole("button", { name: "Show details" });
    expect(control).toHaveAttribute("aria-expanded", "false");
    expect(control.closest(".bx--disclosure")).toHaveClass(
      "bx--disclosure--end",
    );

    expect(control.closest(".bx--disclosure")).not.toHaveClass(
      "bx--disclosure--open",
    );
  });

  it("should align the chevron to the start", () => {
    render(Disclosure, { props: { align: "start" } });

    const control = screen.getByRole("button", { name: "Show details" });
    const wrapper = control.closest(".bx--disclosure");
    expect(wrapper).toHaveClass("bx--disclosure--start");
    expect(wrapper).not.toHaveClass("bx--disclosure--end");
  });

  it("should toggle open state on click", async () => {
    render(Disclosure);

    const control = screen.getByRole("button", { name: "Show details" });
    expect(control).toHaveAttribute("aria-expanded", "false");

    await user.click(control);
    expect(control).toHaveAttribute("aria-expanded", "true");

    await user.click(control);
    expect(control).toHaveAttribute("aria-expanded", "false");
  });

  it("should dispatch a toggle event with the new open state", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Disclosure);

    const control = screen.getByRole("button", { name: "Show details" });

    await user.click(control);
    expect(consoleLog).toHaveBeenCalledWith("toggle:", true);

    await user.click(control);
    expect(consoleLog).toHaveBeenCalledWith("toggle:", false);
  });

  it("should render open when bound to true", () => {
    render(Disclosure, { props: { open: true } });

    const control = screen.getByRole("button", { name: "Show details" });
    expect(control).toHaveAttribute("aria-expanded", "true");
  });

  it("should associate the control with its content via aria-controls", () => {
    render(Disclosure);

    const control = screen.getByRole("button", { name: "Show details" });
    const contentId = control.getAttribute("aria-controls");
    expect(contentId).toBeTruthy();

    const content = screen.getByText("Hidden content").closest("div");
    expect(content).toHaveAttribute("id", contentId);
  });

  it("should toggle on Enter key", async () => {
    render(Disclosure);

    const control = screen.getByRole("button", { name: "Show details" });
    control.focus();

    await user.keyboard("{Enter}");
    expect(control).toHaveAttribute("aria-expanded", "true");
  });

  it("should toggle on Space key", async () => {
    render(Disclosure);

    const control = screen.getByRole("button", { name: "Show details" });
    control.focus();

    await user.keyboard(" ");
    expect(control).toHaveAttribute("aria-expanded", "true");
  });

  it("should clear expanding and collapsing only on the content's own animationend", async () => {
    render(Disclosure);

    const control = screen.getByRole("button", { name: "Show details" });
    const wrapper = control.closest(".bx--disclosure");
    const content = screen.getByText("Hidden content").parentElement;
    assert(content);

    await user.click(control);
    expect(wrapper).toHaveClass("bx--disclosure--expanding");
    await fireEvent.animationEnd(screen.getByText("Hidden content"));
    expect(wrapper).toHaveClass("bx--disclosure--expanding");
    await fireEvent.animationEnd(content);
    expect(wrapper).not.toHaveClass("bx--disclosure--expanding");

    await user.click(control);
    expect(wrapper).toHaveClass("bx--disclosure--collapsing");
    await fireEvent.animationEnd(content);
    expect(wrapper).not.toHaveClass("bx--disclosure--collapsing");
  });
});
