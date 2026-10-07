import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import AILabelHost from "./AILabel.host.test.svelte";
import AILabel from "./AILabel.test.svelte";

describe("AILabel", () => {
  it("renders an AI button with an accessible name", () => {
    const { container } = render(AILabel);

    const button = screen.getByRole("button", { name: "AI Show information" });
    expect(button).toHaveTextContent("AI");
    expect(container.querySelector(".bx--ai-label")).toHaveClass(
      "bx--ai-label--xs",
    );
  });

  it.each(["mini", "2xs", "sm", "md", "lg", "xl"] as const)(
    "applies the %s size",
    (size) => {
      const { container } = render(AILabel, { props: { size } });
      expect(container.querySelector(".bx--ai-label")).toHaveClass(
        `bx--ai-label--${size}`,
      );
    },
  );

  it("names the inline kind by its text", () => {
    const { container } = render(AILabel, {
      props: { kind: "inline", textLabel: "Generated" },
    });

    expect(container.querySelector(".bx--ai-label")).toHaveClass(
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
    expect(
      screen.getByRole("button", { name: "AI Show information" }),
    ).toBeInTheDocument();
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

    const label = screen
      .getByTestId("text-input")
      .querySelector(".bx--ai-label");
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
