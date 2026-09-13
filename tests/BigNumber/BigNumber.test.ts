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

    it("shows the denominator when total is less than value", () => {
      render(BigNumber);

      const el = screen.getByTestId("total-less");
      expect(
        el.querySelector(".bx--big-number__denominator"),
      ).toHaveTextContent("/ 3");
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

    it("renders a flat trend icon colored neutral by default", () => {
      render(BigNumber);

      const el = screen.getByTestId("trend-flat");
      const icon = el.querySelector(".bx--big-number__trend-icon");
      expect(icon).toHaveClass("bx--big-number__trend-icon--neutral");
    });

    it("overrides a flat trend's color", () => {
      render(BigNumber);

      const el = screen.getByTestId("trend-flat-error");
      const icon = el.querySelector(".bx--big-number__trend-icon");
      expect(icon).toHaveClass("bx--big-number__trend-icon--error");
    });

    it("announces the default trend description to assistive tech", () => {
      render(BigNumber);

      const el = screen.getByTestId("trend-up");
      expect(el).toHaveTextContent("Trending up");
    });

    it("announces a custom trendDescription instead of the default", () => {
      render(BigNumber);

      const el = screen.getByTestId("trend-description");
      expect(el).toHaveTextContent("Up 12% week over week");
      expect(el).not.toHaveTextContent("Trending up");
    });

    it("has no role attribute on the value row", () => {
      render(BigNumber);

      const el = screen.getByTestId("trend-up");
      const row = el.querySelector(".bx--big-number__value-row");
      expect(row).not.toHaveAttribute("role");
    });
  });

  describe("delta", () => {
    it("renders a percentage delta with the trend color and a label", () => {
      render(BigNumber);

      const el = screen.getByTestId("delta-percentage");
      const deltaValue = el.querySelector(".bx--big-number__delta-value");
      expect(deltaValue).toHaveTextContent("+4.2%");
      expect(deltaValue).toHaveClass("bx--big-number__delta-value--success");
      expect(
        el.querySelector(".bx--big-number__delta-label"),
      ).toHaveTextContent("vs last week");
    });

    it("renders a negative absolute delta with the neutral color when there is no trend", () => {
      render(BigNumber);

      const el = screen.getByTestId("delta-negative");
      const deltaValue = el.querySelector(".bx--big-number__delta-value");
      expect(deltaValue).toHaveTextContent("-120");
      expect(deltaValue).toHaveClass("bx--big-number__delta-value--neutral");
    });

    it("renders a zero delta without a sign", () => {
      render(BigNumber);

      const el = screen.getByTestId("delta-zero");
      expect(
        el.querySelector(".bx--big-number__delta-value"),
      ).toHaveTextContent("0");
    });

    it("renders no delta block when delta is not set", () => {
      render(BigNumber);

      const el = screen.getByTestId("no-delta");
      expect(el.querySelector(".bx--big-number__delta")).toBeNull();
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

  describe("hover title", () => {
    it("shows the full value as a title when abbreviated", () => {
      render(BigNumber);

      const el = screen.getByTestId("truncate-thousands");
      expect(el.querySelector(".bx--big-number__value")).toHaveAttribute(
        "title",
        "1,500",
      );
    });

    it("omits the title when fullNumber is set", () => {
      render(BigNumber);

      const el = screen.getByTestId("full-number");
      expect(el.querySelector(".bx--big-number__value")).not.toHaveAttribute(
        "title",
      );
    });
  });

  describe("formatOptions and format", () => {
    it("formats the value as currency", () => {
      render(BigNumber);

      const el = screen.getByTestId("format-currency");
      expect(el.querySelector(".bx--big-number__value")).toHaveTextContent(
        /^\$1\.[23]M$/,
      );
    });

    it("formats the value as a unit", () => {
      render(BigNumber);

      const el = screen.getByTestId("format-unit");
      expect(el.querySelector(".bx--big-number__value")).toHaveTextContent(
        "340 ms",
      );
    });

    it("uses a custom format function", () => {
      render(BigNumber);

      const el = screen.getByTestId("format-custom");
      expect(el.querySelector(".bx--big-number__value")).toHaveTextContent(
        "7h",
      );
    });
  });

  describe("formatter cache", () => {
    const OriginalNumberFormat = Intl.NumberFormat;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("reuses a single Intl.NumberFormat instance for identical locale and options", () => {
      class MockNumberFormat extends OriginalNumberFormat {}
      const spy = vi
        .spyOn(Intl, "NumberFormat")
        .mockImplementation(MockNumberFormat);

      render(BigNumber);

      const calls = spy.mock.calls.filter(
        ([, options]) => options?.style === "currency",
      );
      expect(calls.length).toBeLessThanOrEqual(1);
    });
  });
});
