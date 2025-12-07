import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import PasswordInputSlot from "./PasswordInput.slot.test.svelte";
import PasswordInput from "./PasswordInput.test.svelte";

describe("PasswordInput", () => {
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

      await user.click(screen.getByText("Show password"));
      expect(input).toHaveAttribute("type", "text");

      await user.click(screen.getByText("Hide password"));
      expect(input).toHaveAttribute("type", "password");
    });

    it("should handle custom visibility labels", async () => {
      render(PasswordInput, {
        labelText: "Password",
        hidePasswordLabel: "Custom hide",
        showPasswordLabel: "Custom show",
      });

      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      await user.click(screen.getByText("Custom show"));
      expect(screen.getByText("Custom hide")).toBeInTheDocument();
      await user.click(screen.getByText("Custom hide"));
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
      ).toBeInTheDocument();
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

    it("should handle helper text", () => {
      render(PasswordInput, {
        labelText: "Password",
        helperText: "Your password should be hard to guess",
      });

      expect(
        screen.getByText("Your password should be hard to guess"),
      ).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("should render light variant", () => {
      render(PasswordInput, { labelText: "Password", light: true });

      const wrapper = screen
        .getByLabelText("Password")
        .closest(".bx--text-input-wrapper");
      expect(wrapper).toHaveClass("bx--text-input-wrapper--light");
    });

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
    it("should handle hidden label", () => {
      render(PasswordInput, { labelText: "Password", hideLabel: true });

      const label = screen.getByText("Password");
      expect(label).toHaveClass("bx--visually-hidden");
    });

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
      expect(screen.getByTestId("value")).toHaveTextContent("test123");
    });

    it("should handle focus and blur events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(PasswordInput, { labelText: "Password" });

      expect(consoleLog).not.toHaveBeenCalled();
      const input = screen.getByLabelText("Password");
      await user.click(input);
      expect(consoleLog).toHaveBeenCalledWith("focus");

      await user.tab();
      expect(consoleLog).toHaveBeenCalledWith("blur");
    });
  });

  it("supports custom label slot", () => {
    render(PasswordInputSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });
});
