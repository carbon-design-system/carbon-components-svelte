import { render, screen } from "@testing-library/svelte";
import BigNumber from "./BigNumber.test.svelte";
import BigNumberProps from "./BigNumberProps.test.svelte";

const getValue = () =>
  screen.getByTestId("metric").querySelector(".bx--big-number__value");

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

  it.each([
    ["undefined", undefined],
    ["NaN", Number.NaN],
    ["null", null as unknown as number],
  ])("renders a dash when value is %s", (_, value) => {
    render(BigNumberProps, { props: { options: { value } } });

    expect(getValue()).toHaveTextContent(/^–$/);
  });

  describe("denominator visibility", () => {
    it.each([
      ["total is greater than value", "total-shown", "/ 10"],
      ["total is less than value", "total-less", "/ 3"],
      [
        "forceShowTotal is set, even if total equals value",
        "force-show-total",
        "/ 999",
      ],
    ])("shows the denominator when %s", (_, testId, expected) => {
      render(BigNumber);

      expect(
        screen
          .getByTestId(testId)
          .querySelector(".bx--big-number__denominator"),
      ).toHaveTextContent(expected);
    });

    it.each([
      ["there is no total", "no-total"],
      ["total equals value", "total-equal"],
    ])("hides the denominator when %s", (_, testId) => {
      render(BigNumber);

      expect(
        screen
          .getByTestId(testId)
          .querySelector(".bx--big-number__denominator"),
      ).toBeNull();
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

    it("renders the full number when fullNumber is set", () => {
      render(BigNumber);

      const el = screen.getByTestId("full-number");
      expect(el.querySelector(".bx--big-number__value")).toHaveTextContent(
        "1,500",
      );
    });
  });

  describe("locale and fractionDigits", () => {
    it("formats the value with the given locale", () => {
      render(BigNumberProps, {
        props: { options: { value: 1500, fullNumber: true, locale: "de-DE" } },
      });

      expect(getValue()).toHaveTextContent("1.500");
    });

    it("limits the fraction digits of the value", () => {
      render(BigNumberProps, {
        props: {
          options: { value: 1.2345, fullNumber: true, fractionDigits: 3 },
        },
      });

      expect(getValue()).toHaveTextContent("1.235");
    });

    it("abbreviates the total", () => {
      render(BigNumberProps, { props: { options: { value: 3, total: 1500 } } });

      expect(
        screen
          .getByTestId("metric")
          .querySelector(".bx--big-number__denominator"),
      ).toHaveTextContent("/ 1.5K");
    });
  });

  describe("reactivity", () => {
    it("updates the value and total after mount", async () => {
      const { rerender } = render(BigNumberProps, {
        props: { options: { value: 3, total: 10 } },
      });

      await rerender({ options: { value: 7, total: 20 } });

      expect(getValue()).toHaveTextContent("7");
      expect(
        screen
          .getByTestId("metric")
          .querySelector(".bx--big-number__denominator"),
      ).toHaveTextContent("/ 20");
    });
  });

  describe("size", () => {
    it.each([
      ["lg", "bx--big-number--lg", "20"],
      ["xl", "bx--big-number--xl", "24"],
    ] as const)(
      "applies the %s class and scales the trend icon",
      (size, expectedClass, iconSize) => {
        render(BigNumberProps, {
          props: { options: { value: 42, trend: "up", size } },
        });

        const el = screen.getByTestId("metric");
        expect(el).toHaveClass(expectedClass);
        expect(el.querySelector(".bx--big-number__trend-icon")).toHaveAttribute(
          "width",
          iconSize,
        );
      },
    );

    it("keeps the default trend icon size at 16", () => {
      render(BigNumberProps, {
        props: { options: { value: 42, trend: "up" } },
      });

      expect(
        screen
          .getByTestId("metric")
          .querySelector(".bx--big-number__trend-icon"),
      ).toHaveAttribute("width", "16");
    });
  });

  describe("trend", () => {
    it("renders a distinct icon for each trend", () => {
      const icons = (["up", "down", "flat"] as const).map((trend) => {
        const { unmount } = render(BigNumberProps, {
          props: { options: { value: 42, trend } },
        });
        const icon = screen
          .getByTestId("metric")
          .querySelector(".bx--big-number__trend-icon");
        assert(icon);
        const markup = icon.innerHTML;
        unmount();
        return markup;
      });

      expect(new Set(icons).size).toBe(3);
    });

    it.each([
      ["an up arrow colored success by default", "trend-up", "success"],
      ["a down arrow colored error by default", "trend-down", "error"],
      ["an up trend overridden to error", "trend-up-error", "error"],
      ["a down trend overridden to success", "trend-down-success", "success"],
      ["a flat trend colored neutral by default", "trend-flat", "neutral"],
      ["a flat trend overridden to error", "trend-flat-error", "error"],
    ])("renders %s", (_, testId, color) => {
      render(BigNumber);

      expect(
        screen.getByTestId(testId).querySelector(".bx--big-number__trend-icon"),
      ).toHaveClass(`bx--big-number__trend-icon--${color}`);
    });

    it("renders no trend icon by default", () => {
      render(BigNumber);

      const el = screen.getByTestId("no-trend");
      expect(el.querySelector(".bx--big-number__trend-icon")).toBeNull();
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

    it.each([
      ["up", undefined, "success"],
      ["up", "error", "error"],
      ["down", "success", "success"],
      ["flat", "error", "error"],
      ["flat", undefined, "neutral"],
    ] as const)(
      "colors the delta for trend %s with trendColor %s as %s",
      (trend, trendColor, expected) => {
        render(BigNumberProps, {
          props: { options: { value: 42, delta: 5, trend, trendColor } },
        });

        expect(
          screen
            .getByTestId("metric")
            .querySelector(".bx--big-number__delta-value"),
        ).toHaveClass(`bx--big-number__delta-value--${expected}`);
      },
    );

    it("renders a zero delta without a sign", () => {
      render(BigNumber);

      const el = screen.getByTestId("delta-zero");
      expect(
        el.querySelector(".bx--big-number__delta-value"),
      ).toHaveTextContent(/^0$/);
    });

    it("renders no delta block when delta is not set", () => {
      render(BigNumber);

      const el = screen.getByTestId("no-delta");
      expect(el.querySelector(".bx--big-number__delta")).toBeNull();
    });
  });

  describe("footer slot", () => {
    it("renders slotted content inside the footer", () => {
      render(BigNumber);

      const el = screen.getByTestId("footer");
      const footer = el.querySelector(".bx--big-number__footer");
      expect(footer).toHaveTextContent("Footer content");
    });

    it("renders no footer element without slot content", () => {
      render(BigNumber);

      const el = screen.getByTestId("no-footer");
      expect(el.querySelector(".bx--big-number__footer")).toBeNull();
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
