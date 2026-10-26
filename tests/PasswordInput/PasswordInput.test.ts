import { fireEvent, render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import PasswordInputForm from "./PasswordInput.form.test.svelte";
import PasswordInputSkeleton from "./PasswordInput.skeleton.test.svelte";
import PasswordInput from "./PasswordInput.test.svelte";
import PasswordInputInModal from "./PasswordInputInModal.test.svelte";
import PasswordInputTooltipGroup from "./PasswordInputTooltipGroup.test.svelte";

describe("PasswordInput", () => {
  it("shows the toggle tooltip without the fade-in on focus", async () => {
    render(PasswordInputTooltipGroup);
    const toggle = screen.getByRole("button", { name: "Show password" });

    await fireEvent.focus(toggle);
    expect(toggle).toHaveClass("bx--tooltip--instant");

    await fireEvent.blur(toggle);
    expect(toggle).not.toHaveClass("bx--tooltip--instant");
  });

  it("shares the tooltip group's active slot with neighboring tooltips", async () => {
    render(PasswordInputTooltipGroup);

    const edit = screen.getByRole("button", { name: "Edit" });
    const toggle = screen.getByRole("button", { name: "Show password" });

    await fireEvent.mouseEnter(edit);
    await fireEvent.focus(toggle);
    expect(edit).toHaveClass("bx--tooltip--hidden");
    expect(toggle).not.toHaveClass("bx--tooltip--hidden");
    expect(toggle).toHaveClass("bx--tooltip--instant");

    await fireEvent.blur(toggle);
    await fireEvent.mouseLeave(edit);
    await fireEvent.mouseEnter(edit);
    expect(toggle).toHaveClass("bx--tooltip--hidden");
  });

  describe("Default", () => {
    it("should render with a label", () => {
      render(PasswordInput, {
        labelText: "Password",
        placeholder: "Enter password...",
      });

      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter password..."),
      ).toBeInTheDocument();
    });

    it("should toggle password visibility", async () => {
      render(PasswordInput, { labelText: "Password", value: "secret123" });

      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");

      await user.click(screen.getByRole("button", { name: "Show password" }));
      expect(input).toHaveAttribute("type", "text");

      await user.click(screen.getByRole("button", { name: "Hide password" }));
      expect(input).toHaveAttribute("type", "password");
    });

    it("labels the toggle Hide password when mounted with type text", () => {
      render(PasswordInput, { labelText: "Password", type: "text" });

      expect(
        screen.getByRole("button", { name: "Hide password" }),
      ).toBeInTheDocument();
    });

    it("writes the toggled type back through bind:type", async () => {
      render(PasswordInput, { labelText: "Password" });
      expect(screen.getByTestId("bound-type")).toHaveTextContent("password");

      await user.click(screen.getByRole("button", { name: "Show password" }));
      expect(screen.getByTestId("bound-type")).toHaveTextContent("text");

      await user.click(screen.getByRole("button", { name: "Hide password" }));
      expect(screen.getByTestId("bound-type")).toHaveTextContent("password");
    });

    it("does not submit a form when the toggle is clicked", async () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      render(PasswordInputForm);
      getForm().addEventListener("submit", onSubmit);

      await user.click(screen.getByRole("button", { name: "Show password" }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should handle custom visibility labels", async () => {
      render(PasswordInput, {
        labelText: "Password",
        hidePasswordLabel: "Custom hide",
        showPasswordLabel: "Custom show",
      });

      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Custom show" }));
      expect(screen.getByText("Custom hide")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Custom hide" }));
      expect(screen.getByText("Custom show")).toBeInTheDocument();
    });
  });

  describe("Tooltip", () => {
    it("should handle custom tooltip alignment", () => {
      render(PasswordInput, {
        labelText: "Password",
        tooltipAlignment: "start",
        tooltipPosition: "left",
      });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bx--tooltip--align-start");
      expect(button).toHaveClass("bx--tooltip--left");
    });
  });

  describe("States", () => {
    it("should handle invalid state", () => {
      render(PasswordInput, {
        labelText: "Password",
        invalid: true,
        invalidText: "Password must be at least 8 characters",
      });

      expect(
        screen.getByText("Password must be at least 8 characters"),
      ).toHaveAttribute("role", "alert");
      const wrapper = screen
        .getByLabelText("Password")
        .closest(".bx--text-input__field-wrapper");
      expect(wrapper).toHaveAttribute("data-invalid");
    });

    it("should handle warning state", () => {
      render(PasswordInput, {
        labelText: "Password",
        warn: true,
        warnText: "Password will expire soon",
      });

      expect(screen.getByText("Password will expire soon")).toBeInTheDocument();
      const input = screen.getByLabelText("Password");
      expect(input).toHaveClass("bx--text-input--warning");
    });

    it("should handle disabled state", () => {
      render(PasswordInput, {
        labelText: "Password",
        disabled: true,
        value: "disabled-password",
      });

      const input = screen.getByLabelText("Password");
      expect(input).toBeDisabled();
      expect(input).toHaveValue("disabled-password");

      const toggleButton = screen.getByRole("button");
      expect(toggleButton).toBeDisabled();
      expect(toggleButton).toHaveClass("bx--btn--disabled");
    });

    it("should handle readonly state and allow visibility toggle", async () => {
      render(PasswordInput, {
        labelText: "Password",
        readonly: true,
        value: "readonly-password",
      });

      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("readonly");
      expect(input).toHaveValue("readonly-password");

      const wrapper = input.closest(".bx--text-input-wrapper");
      expect(wrapper).toHaveClass("bx--text-input-wrapper--readonly");

      const fieldWrapper = input.closest(".bx--text-input__field-wrapper");
      // Icon is decorative (aria-hidden) so check by class within the wrapper,
      // matching tests/TextInput/TextInput.test.ts's "should render readonly icon".
      expect(
        fieldWrapper?.querySelector(".bx--text-input__readonly-icon"),
      ).toBeInTheDocument();

      const toggleButton = screen.getByRole("button");
      expect(toggleButton).not.toBeDisabled();

      expect(input).toHaveAttribute("type", "password");

      await user.click(screen.getByRole("button", { name: "Show password" }));
      expect(input).toHaveAttribute("type", "text");

      await user.click(screen.getByRole("button", { name: "Hide password" }));
      expect(input).toHaveAttribute("type", "password");
    });

    it("names the visibility toggle when disabled", () => {
      render(PasswordInput, { labelText: "Password", disabled: true });

      expect(
        screen.getByRole("button", { name: "Show password" }),
      ).toBeDisabled();
    });
  });

  describe("Variants", () => {
    it("should render inline variant", () => {
      render(PasswordInput, {
        labelText: "Password",
        inline: true,
      });

      const wrapper = screen
        .getByLabelText("Password")
        .closest(".bx--text-input-wrapper");
      expect(wrapper).toHaveClass("bx--text-input-wrapper--inline");
    });

    it("puts the inline label in the same column as TextInput", () => {
      render(PasswordInput, {
        labelText: "Password",
        helperText: "Helper text",
        inline: true,
      });

      const column = screen
        .getByText("Password")
        .closest(".bx--text-input__label-helper-wrapper");
      expect(column).toContainElement(screen.getByText("Helper text"));
      expect(column).not.toHaveClass("bx--visually-hidden");
    });

    it("hides the inline label column when hideLabel leaves it empty", () => {
      render(PasswordInput, {
        labelText: "Password",
        hideLabel: true,
        inline: true,
      });

      expect(
        screen
          .getByText("Password")
          .closest(".bx--text-input__label-helper-wrapper"),
      ).toHaveClass("bx--visually-hidden");
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("should render in extra-small size", () => {
      render(PasswordInput, { labelText: "Password", size: "xs" });

      const input = screen.getByLabelText("Password");
      expect(input).toHaveClass("bx--text-input--xs");
    });

    it("should render in small size", () => {
      render(PasswordInput, { labelText: "Password", size: "sm" });

      const input = screen.getByLabelText("Password");
      expect(input).toHaveClass("bx--text-input--sm");
    });

    it("should render in extra-large size", () => {
      render(PasswordInput, {
        labelText: "Password",
        size: "xl",
      });

      const input = screen.getByLabelText("Password");
      expect(input).toHaveClass("bx--text-input--xl");
    });
  });

  describe("Label handling", () => {
    it("should handle custom id", () => {
      render(PasswordInput, { labelText: "Password", id: "custom-id" });

      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("id", "custom-id");
    });
  });

  describe("Events", () => {
    it("should handle input events", async () => {
      render(PasswordInput, { labelText: "Password" });

      const input = screen.getByLabelText("Password");
      await user.type(input, "test123");
      expect(getBoundText()).toBe("test123");
    });

    it("fires consumer input and change handlers on typing and blur", async () => {
      const onInput = vi.fn();
      const onChange = vi.fn();
      render(PasswordInput, { labelText: "Password", onInput, onChange });

      await user.type(screen.getByLabelText("Password"), "abc");
      expect(onInput).toHaveBeenCalledTimes(3);
      expect(onChange).not.toHaveBeenCalled();

      await user.tab();
      expect(onChange).toHaveBeenCalledOnce();
    });

    it("should handle focus and blur events", async () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(PasswordInput, { labelText: "Password", onFocus, onBlur });

      const input = screen.getByLabelText("Password");
      await user.click(input);
      expect(onFocus).toHaveBeenCalledOnce();
      expect(onBlur).not.toHaveBeenCalled();

      await user.tab();
      expect(onBlur).toHaveBeenCalledOnce();
    });
  });

  describe("Portal tooltip", () => {
    afterEach(() => {
      const existingPortals = document.querySelectorAll(
        "[data-floating-portal]",
      );
      for (const portal of existingPortals) {
        portal.remove();
      }
    });

    it("should add portal-active class and aria-label when portalTooltip is true", () => {
      render(PasswordInput, {
        props: {
          labelText: "Password",
          portalTooltip: true,
        },
      });

      const button = screen.getByRole("button", { name: "Show password" });
      expect(button).toHaveClass("bx--tooltip--portal-active");
      expect(button).toHaveAttribute("aria-label", "Show password");
      // The position classes would also show the in-place caret.
      expect(button).not.toHaveClass("bx--tooltip--bottom");
      expect(button).not.toHaveClass("bx--tooltip--align-end");
    });

    it("should render tooltip in FloatingPortal when portalTooltip is true", async () => {
      render(PasswordInput, {
        props: {
          labelText: "Password",
          portalTooltip: true,
        },
      });

      const button = screen.getByRole("button", { name: "Show password" });
      await user.hover(button);

      const portal = document.querySelector("[data-floating-portal]");
      expect(portal).toBeInTheDocument();
      expect(portal?.parentElement).toBe(document.body);
      expect(
        portal?.querySelector(".bx--tooltip-portal__content"),
      ).toHaveTextContent("Show password");
    });

    it("should not use portal when portalTooltip is false", () => {
      render(PasswordInput, {
        props: {
          labelText: "Password",
          portalTooltip: false,
        },
      });

      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("bx--tooltip--portal-active");
      expect(button).not.toHaveAttribute("aria-label");
      expect(screen.getByText("Show password")).toBeInTheDocument();
    });

    it("should use portal when inside Modal (portalTooltip not passed)", async () => {
      render(PasswordInputInModal, {
        props: { modalOpen: true },
      });

      const button = screen.getByRole("button", { name: "Show password" });
      expect(button).toHaveClass("bx--tooltip--portal-active");

      await user.hover(button);
      const portal = document.querySelector("[data-floating-portal]");
      expect(portal).toBeInTheDocument();
      expect(portal?.parentElement).toBe(document.body);
    });

    it("should not use portal when inside Modal with portalTooltip=false", () => {
      render(PasswordInputInModal, {
        props: { modalOpen: true, portalTooltip: false },
      });

      const button = screen.getByRole("button", { name: "Show password" });
      expect(button).not.toHaveClass("bx--tooltip--portal-active");
      expect(button).not.toHaveAttribute("aria-label");
      expect(screen.getByText("Show password")).toBeInTheDocument();
    });

    it("should not render portal tooltip when disabled", async () => {
      render(PasswordInput, {
        props: {
          labelText: "Password",
          portalTooltip: true,
          disabled: true,
        },
      });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("bx--tooltip--portal-active");

      await fireEvent.mouseEnter(button);
      expect(
        document.querySelector("[data-floating-portal]"),
      ).not.toBeInTheDocument();
    });
  });

  describe("fluid variant", () => {
    it("keeps the visibility toggle when fluid and invalid", () => {
      render(PasswordInput, {
        fluid: true,
        labelText: "Password",
        invalid: true,
        invalidText: "Invalid password",
      });

      expect(
        document.querySelector(".bx--text-input--password__visibility__toggle"),
      ).toBeInTheDocument();
    });
  });

  describe("skeleton", () => {
    it("renders skeleton state", () => {
      render(PasswordInputSkeleton);

      const skeleton = screen.getByTestId("password-input-skeleton");
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass("bx--form-item");
      expect(skeleton.children).toHaveLength(2);
      expect(skeleton.children[0]).toHaveClass("bx--label", "bx--skeleton");
      expect(skeleton.children[1]).toHaveClass(
        "bx--skeleton",
        "bx--text-input",
      );
    });

    it("hides the skeleton label when hideLabel is true", () => {
      render(PasswordInputSkeleton, { props: { hideLabel: true } });

      const skeleton = screen.getByTestId("password-input-skeleton");
      expect(skeleton.children).toHaveLength(1);
      expect(skeleton.children[0]).toHaveClass(
        "bx--skeleton",
        "bx--text-input",
      );
    });
  });
});
