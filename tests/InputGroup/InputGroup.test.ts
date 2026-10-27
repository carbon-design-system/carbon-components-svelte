import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import InputGroupLegend from "./InputGroup.legend.test.svelte";
import InputGroup from "./InputGroup.test.svelte";
import InputGroupControls from "./InputGroupControls.test.svelte";

describe("InputGroup", () => {
  it("names the group with its label", () => {
    render(InputGroup);

    expect(screen.getByRole("group", { name: "Promo code" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Code" })).toBeInTheDocument();
  });

  it("hides the legend visually with hideLegend", () => {
    render(InputGroup, { hideLegend: true });

    expect(screen.getByText("Promo code")).toHaveClass("bx--visually-hidden");
    expect(screen.getByRole("group", { name: "Promo code" })).toBeVisible();
  });

  it("disables every field and button with disabled", () => {
    render(InputGroup, { disabled: true });

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it.each([
    ["invalid", { invalid: true, invalidText: "Code expired" }],
    ["warn", { warn: true, warnText: "Ends tonight" }],
  ])("ignores %s when disabled", (_state, props) => {
    const { container } = render(InputGroup, {
      disabled: true,
      helperText: "One code per order",
      ...props,
    });

    expect(screen.getByText("One code per order")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
    expect(
      container.querySelector(
        ".bx--input-group--invalid, .bx--input-group--warning",
      ),
    ).toBeNull();
  });

  it("replaces the helper text when invalid without a message", () => {
    render(InputGroup, { invalid: true, helperText: "One code per order" });

    expect(screen.queryByText("One code per order")).toBeNull();
  });

  it("shows helper text below the group and describes the field by it", () => {
    render(InputGroup, { helperText: "One code per order" });

    const helper = screen.getByText("One code per order");
    expect(helper).toHaveClass("bx--form__helper-text");
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      helper.id,
    );
  });

  it.each([
    [
      "invalid",
      { invalid: true, invalidText: "Code expired" },
      "Code expired",
      "bx--form-requirement--invalid",
    ],
    [
      "warning",
      { warn: true, warnText: "Ends tonight" },
      "Ends tonight",
      "bx--form-requirement--warn",
    ],
  ])(
    "shows the %s message in place of the helper text",
    (_state, props, text, className) => {
      render(InputGroup, { helperText: "One code per order", ...props });

      const message = screen.getByText(text);
      expect(message).toHaveClass("bx--form-requirement", className);
      expect(screen.queryByText("One code per order")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-describedby",
        message.id,
      );
    },
  );

  it("passes the invalid state to the field through the slot prop", () => {
    render(InputGroup, { invalid: true, invalidText: "Code expired" });

    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Code expired");
  });

  it.each([
    [undefined, "bx--btn--field", null],
    ["xs", "bx--btn--xs", "bx--text-input--xs"],
    ["sm", "bx--btn--sm", "bx--text-input--sm"],
    ["xl", null, "bx--text-input--xl"],
    ["md", "bx--btn--field", null],
    ["lg", null, "bx--text-input--xl"],
  ] as const)(
    "matches the button to size %s",
    (size, buttonClass, inputClass) => {
      render(InputGroup, { size });

      const button = screen.getByRole("button", { name: "Apply" });
      if (buttonClass) {
        expect(button).toHaveClass(buttonClass);
      } else {
        expect(button.className).not.toMatch(/bx--btn--(xs|sm|field)/);
      }
      if (inputClass) {
        expect(screen.getByRole("textbox")).toHaveClass(inputClass);
      }
    },
  );

  it("inherits the size of a parent Form", () => {
    render(InputGroup, { formSize: "sm" });

    expect(screen.getByRole("textbox")).toHaveClass("bx--text-input--sm");
    expect(screen.getByRole("button", { name: "Apply" })).toHaveClass(
      "bx--btn--sm",
    );
  });

  it('maps a parent Form\'s Carbon v11 "lg" to "xl"', () => {
    render(InputGroup, { formSize: "lg" });

    expect(screen.getByRole("textbox")).toHaveClass("bx--text-input--xl");
    expect(getBoundText()).toBe("false xl");
  });

  it("prefers its own size over the parent Form's", () => {
    render(InputGroup, { formSize: "sm", size: "xl" });

    expect(screen.getByRole("textbox")).toHaveClass("bx--text-input--xl");
    expect(screen.getByRole("textbox")).not.toHaveClass("bx--text-input--sm");
  });

  it("names the group with the legendChildren slot", () => {
    render(InputGroupLegend);

    expect(screen.getByRole("group", { name: "Promo code" })).toBeVisible();
  });

  it.each([
    [{ warn: true }, "true sm"],
    [{ invalid: true, warn: true }, "false sm"],
  ])(
    "passes warn and size to the field through slot props: %j",
    (props, expected) => {
      render(InputGroup, { size: "sm", ...props });

      expect(getBoundText()).toBe(expected);
    },
  );
});

describe("InputGroup controls", () => {
  const overflowTrigger = () => {
    const trigger = document.querySelector("button.bx--overflow-menu");
    assert(trigger);
    return trigger;
  };

  it.each([
    ["xs", "xs", "bx--overflow-menu--xs", "bx--menu-button__trigger--xs"],
    ["sm", "sm", "bx--overflow-menu--sm", null],
    ["xl", "xl", "bx--overflow-menu--xl", null],
  ] as const)(
    "sizes switchers and menu buttons with the %s row",
    (size, switcher, overflow, menuButton) => {
      render(InputGroupControls, { props: { size } });

      expect(screen.getByTestId("switcher")).toHaveClass(
        `bx--content-switcher--${switcher}`,
      );
      expect(screen.getByTestId("toggles")).toHaveClass(
        `bx--toggle-button-group--${size === "xl" ? "lg" : size}`,
      );
      expect(overflowTrigger()).toHaveClass(overflow);
      if (menuButton)
        expect(screen.getByRole("button", { name: "Actions" })).toHaveClass(
          menuButton,
        );
      expect(screen.getByRole("searchbox").closest(".bx--search")).toHaveClass(
        `bx--search--${size === "xl" ? "xl" : size}`,
      );
    },
  );

  it("leaves controls at their default size in an unsized row", () => {
    render(InputGroupControls);

    expect(screen.getByTestId("switcher").className).not.toMatch(
      /bx--content-switcher--(xs|sm|xl)/,
    );
    expect(overflowTrigger().className).not.toMatch(
      /bx--overflow-menu--(xs|sm|xl)/,
    );
    expect(screen.getByRole("searchbox").closest(".bx--search")).toHaveClass(
      "bx--search--lg",
    );
  });

  it("sizes a switcher to its labels and a date picker to the row", () => {
    render(InputGroupControls);

    expect(screen.getByTestId("switcher")).toHaveClass(
      "bx--content-switcher--auto-width",
    );
    expect(screen.getByTestId("alone")).not.toHaveClass(
      "bx--content-switcher--auto-width",
    );
    expect(
      document.querySelector(".bx--input-group .bx--date-picker"),
    ).toHaveClass("bx--date-picker--full-width");
  });
});
