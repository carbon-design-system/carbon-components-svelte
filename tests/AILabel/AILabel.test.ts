import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import AILabelHost from "./AILabel.host.test.svelte";
import AILabel from "./AILabel.test.svelte";
import { aiLabel } from "./helpers";

describe("AILabel", () => {
  it("renders an AI button with an accessible name", () => {
    const { container } = render(AILabel);

    const button = screen.getByRole("button", { name: "AI Show information" });
    expect(button).toHaveTextContent("AI");
    expect(aiLabel(container)).toHaveClass("bx--ai-label--xs");
  });

  it.each(["mini", "2xs", "sm", "md", "lg", "xl"] as const)(
    "applies the %s size",
    (size) => {
      const { container } = render(AILabel, { props: { size } });
      expect(aiLabel(container)).toHaveClass(`bx--ai-label--${size}`);
    },
  );

  it("names the inline kind by its text", () => {
    const { container } = render(AILabel, {
      props: { kind: "inline", textLabel: "Generated" },
    });

    expect(aiLabel(container)).toHaveClass(
      "bx--ai-label--inline",
      "bx--ai-label--inline-with-content",
    );
    expect(screen.getByRole("button", { name: "AI Generated" })).toBeVisible();
  });

  it("opens the explanation with its actions", async () => {
    render(AILabel);

    await user.click(
      screen.getByRole("button", { name: "AI Show information" }),
    );

    const text = screen.getByText(
      "Generated from the last 30 days of incident logs.",
    );
    expect(text.closest(".bx--popover")).toHaveClass(
      "bx--ai-label-popover",
      "bx--popover--open",
    );
    expect(
      screen.getByRole("button", { name: "View details" }).parentElement,
    ).toHaveClass("bx--ai-label-actions");
  });

  it("forwards open and close and binds open", async () => {
    const onopen = vi.fn();
    const onclose = vi.fn();
    render(AILabel, { props: { onopen, onclose } });
    const trigger = screen.getByRole("button", { name: "AI Show information" });

    await user.click(trigger);
    expect(onopen).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("open")).toHaveTextContent("true");

    await user.click(trigger);
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("open")).toHaveTextContent("false");
  });

  it("opens the explanation when open is set", async () => {
    const { rerender } = render(AILabel);

    await rerender({ open: true });

    expect(
      screen.getByRole("button", { name: "AI Show information" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("reopens closed after a revert", async () => {
    const { rerender } = render(AILabel);

    await user.click(
      screen.getByRole("button", { name: "AI Show information" }),
    );
    await rerender({ revertActive: true });
    await rerender({ revertActive: false });

    expect(
      screen.getByRole("button", { name: "AI Show information" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen
        .getByText("Generated from the last 30 days of incident logs.")
        .closest(".bx--popover"),
    ).not.toHaveClass("bx--popover--open");
  });

  it("reverts on click of the revert button", async () => {
    const onrevert = vi.fn();
    render(AILabel, { props: { revertActive: true, onrevert } });

    expect(
      screen.queryByRole("button", { name: "AI Show information" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Revert to AI input" }),
    );

    expect(onrevert).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("revert-active")).toHaveTextContent("false");
    // A pointer click leaves focus, so the label shows no focus ring.
    expect(
      screen.getByRole("button", { name: "AI Show information" }),
    ).not.toHaveFocus();
  });

  it("moves focus to the label when the keyboard reverts", async () => {
    render(AILabel, { props: { revertActive: true } });

    screen.getByRole("button", { name: "Revert to AI input" }).focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("button", { name: "AI Show information" }),
    ).toHaveFocus();
  });
});

describe("AILabel explanation alignment", () => {
  const popover = () =>
    screen
      .getByText("Generated from the last 30 days of incident logs.")
      .closest(".bx--popover");

  it("aligns to the start by default", () => {
    render(AILabel);

    expect(popover()).toHaveClass("bx--popover--bottom-left");
  });

  it("aligns to the end inside a field decorator", () => {
    render(AILabelHost);

    const label = aiLabel(screen.getByTestId("text-input"));
    expect(label?.querySelector(".bx--popover")).toHaveClass(
      "bx--popover--bottom-right",
    );
  });

  it("lets an explicit align win inside a field decorator", () => {
    render(AILabelHost);

    const label = aiLabel(screen.getByTestId("aligned"));
    expect(label?.querySelector(".bx--popover")).toHaveClass(
      "bx--popover--bottom-left",
    );
  });
});

describe("AILabel in a field decorator", () => {
  const hosts = [
    [
      "text-input",
      ".bx--text-input__field-wrapper",
      "bx--text-input__field-wrapper",
    ],
    ["text-area", ".bx--text-area__wrapper", "bx--text-area__wrapper"],
    ["number-input", ".bx--number__input-wrapper", "bx--number__input-wrapper"],
    ["select", ".bx--select-input__wrapper", "bx--select-input__wrapper"],
    [
      "date-picker",
      ".bx--date-picker-input__wrapper",
      "bx--date-picker-input__wrapper",
    ],
    ["dropdown", ".bx--list-box", "bx--list-box"],
    ["combo-box", ".bx--list-box", "bx--list-box"],
    ["multi-select", ".bx--list-box", "bx--list-box"],
  ] as const;

  it.each(hosts)("marks the %s field", (testId, selector, block) => {
    render(AILabelHost);

    const host = screen.getByTestId(testId);
    const wrapper = host.querySelector(selector);
    expect(wrapper).toHaveClass(`${block}--decorator`, `${block}--ai-label`);
    expect(
      within(host).getByRole("button", { name: "AI Show information" }),
    ).toBeInTheDocument();
  });

  it("always renders the mini size inside a field", () => {
    render(AILabelHost);

    const label = aiLabel(screen.getByTestId("text-input"));
    expect(label).toHaveClass("bx--ai-label--mini", "bx--ai-label--field-xs");
    expect(label).not.toHaveClass("bx--ai-label--xl");
  });

  it("drops the gradient while reverted or removed", async () => {
    const { rerender } = render(AILabelHost);
    const wrapper = screen
      .getByTestId("text-input")
      .querySelector(".bx--text-input__field-wrapper");

    await rerender({ revertActive: true });
    expect(wrapper).toHaveClass("bx--text-input__field-wrapper--decorator");
    expect(wrapper).not.toHaveClass("bx--text-input__field-wrapper--ai-label");

    await rerender({ revertActive: false });
    expect(wrapper).toHaveClass("bx--text-input__field-wrapper--ai-label");

    await rerender({ showLabel: false });
    expect(wrapper).not.toHaveClass("bx--text-input__field-wrapper--ai-label");
  });

  it("leaves fields without a decorator unmarked", () => {
    render(AILabelHost);

    const wrapper = screen
      .getByTestId("plain")
      .querySelector(".bx--text-input__field-wrapper");
    expect(wrapper).not.toHaveClass("bx--text-input__field-wrapper--decorator");
    expect(
      screen.getByTestId("plain").querySelector(".bx--field-decorator"),
    ).toBeNull();
  });
});
