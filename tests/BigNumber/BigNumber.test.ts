import { render, screen } from "@testing-library/svelte";
import BigNumber from "./BigNumber.test.svelte";

describe("BigNumber", () => {
  it("renders the label and value", () => {
    render(BigNumber);

    const basic = screen.getByTestId("basic");
    expect(basic).toHaveClass("bx--big-number");
    expect(basic).toHaveTextContent("Basic");
    expect(basic.querySelector(".bx--big-number__value")).toHaveTextContent(
      "42",
    );
  });

  describe("denominator visibility", () => {
    it("hides the denominator when there is no total", () => {
      render(BigNumber);

      const el = screen.getByTestId("no-total");
      expect(el.querySelector(".bx--big-number__denominator")).toBeNull();
    });

    it("shows the denominator when total is greater than value and formats differently", () => {
      render(BigNumber);

      const el = screen.getByTestId("total-shown");
      expect(
        el.querySelector(".bx--big-number__denominator"),
      ).toHaveTextContent("/ 10");
    });

    it("hides the denominator when total equals value", () => {
      render(BigNumber);

      const el = screen.getByTestId("total-equal");
      expect(el.querySelector(".bx--big-number__denominator")).toBeNull();
    });

    it("hides the denominator when total is less than value", () => {
      render(BigNumber);

      const el = screen.getByTestId("total-less");
      expect(el.querySelector(".bx--big-number__denominator")).toBeNull();
    });

    it("hides the denominator when its truncated display matches the value's", () => {
      render(BigNumber);

      const el = screen.getByTestId("total-truncated-same");
      expect(el.querySelector(".bx--big-number__value")).toHaveTextContent(
        "1M",
      );
      expect(el.querySelector(".bx--big-number__denominator")).toBeNull();
    });

    it("shows the denominator when forceShowTotal is set, even if it equals value", () => {
      render(BigNumber);

      const el = screen.getByTestId("force-show-total");
      expect(
        el.querySelector(".bx--big-number__denominator"),
      ).toHaveTextContent("/ 999");
    });
  });

  describe("percentage", () => {
    it("appends a percent sign to the value", () => {
      render(BigNumber);

      const el = screen.getByTestId("percentage");
      expect(el.querySelector(".bx--big-number__value")).toHaveTextContent(
        "42%",
      );
    });

    it("hides the total even when it would otherwise be shown", () => {
      render(BigNumber);

      const el = screen.getByTestId("percentage-with-total");
      expect(el.querySelector(".bx--big-number__value")).toHaveTextContent(
        "3%",
      );
      expect(el.querySelector(".bx--big-number__denominator")).toBeNull();
    });
  });

  describe("truncate", () => {
    it("abbreviates thousands", () => {
      render(BigNumber);

      const el = screen.getByTestId("truncate-thousands");
      expect(el.querySelector(".bx--big-number__value")).toHaveTextContent(
        "1.5K",
      );
    });

    it("abbreviates millions", () => {
      render(BigNumber);

      const el = screen.getByTestId("truncate-millions");
      expect(el.querySelector(".bx--big-number__value")).toHaveTextContent(
        "2.5M",
      );
    });

    it("renders the full number when fullNumber is set", () => {
      render(BigNumber);

      const el = screen.getByTestId("full-number");
      expect(el.querySelector(".bx--big-number__value")).toHaveTextContent(
        "1,500",
      );
    });
  });

  describe("trend", () => {
    it("renders an up arrow colored success by default", () => {
      render(BigNumber);

      const el = screen.getByTestId("trend-up");
      const icon = el.querySelector(".bx--big-number__trend-icon");
      expect(icon).toHaveClass("bx--big-number__trend-icon--success");
    });

    it("renders a down arrow colored error by default", () => {
      render(BigNumber);

      const el = screen.getByTestId("trend-down");
      const icon = el.querySelector(".bx--big-number__trend-icon");
      expect(icon).toHaveClass("bx--big-number__trend-icon--error");
    });

    it("renders no trend icon by default", () => {
      render(BigNumber);

      const el = screen.getByTestId("no-trend");
      expect(el.querySelector(".bx--big-number__trend-icon")).toBeNull();
    });

    it("overrides an up trend's color independent of direction", () => {
      render(BigNumber);

      const el = screen.getByTestId("trend-up-error");
      const icon = el.querySelector(".bx--big-number__trend-icon");
      expect(icon).toHaveClass("bx--big-number__trend-icon--error");
    });

    it("overrides a down trend's color independent of direction", () => {
      render(BigNumber);

      const el = screen.getByTestId("trend-down-success");
      const icon = el.querySelector(".bx--big-number__trend-icon");
      expect(icon).toHaveClass("bx--big-number__trend-icon--success");
    });
  });

  it("renders the skeleton instead of the value when loading", () => {
    render(BigNumber);

    const el = screen.getByTestId("loading");
    expect(el).toHaveClass("bx--skeleton");
    expect(el.querySelector(".bx--big-number__value")).toBeNull();
  });

  it("renders an accessible tooltip from tooltipDescription", () => {
    render(BigNumber);

    const el = screen.getByTestId("tooltip");
    const trigger = el.querySelector(
      "[aria-label='Extra context about this metric']",
    );
    expect(trigger).toBeInTheDocument();
  });

  it("overrides the label with labelChildren", () => {
    render(BigNumber);

    const el = screen.getByTestId("label-children-test");
    expect(screen.getByText("Custom label content")).toBeInTheDocument();
    expect(el).not.toHaveTextContent("Default label");
  });
});
