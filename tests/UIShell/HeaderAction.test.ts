import { render, screen, waitFor } from "@testing-library/svelte";
import type HeaderActionComponent from "carbon-components-svelte/UIShell/HeaderAction.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import HeaderActionOutsideClick from "./HeaderAction.outsideClick.test.svelte";
import HeaderActionSlot from "./HeaderAction.slot.test.svelte";

describe("HeaderAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports custom textChildren slot", () => {
    render(HeaderActionSlot);

    const customText = screen.getByText("Custom text content");
    expect(customText).toBeInTheDocument();
  });

  it("supports custom icon slot", () => {
    render(HeaderActionSlot);

    const customIcon = screen.getByTestId("custom-icon");
    expect(customIcon).toBeInTheDocument();
  });

  describe("outside click", () => {
    const getActionButton = () =>
      screen.getByRole("button", { name: "Switcher" });

    it("closes when clicking outside", async () => {
      render(HeaderActionOutsideClick);

      await user.click(getActionButton());
      expect(getActionButton()).toHaveClass("bx--header__action--active");

      await user.click(document.body);
      expect(getActionButton()).not.toHaveClass("bx--header__action--active");
    });

    it("stays open when clicking panel content", async () => {
      render(HeaderActionOutsideClick);

      await user.click(getActionButton());
      await user.click(screen.getByTestId("panel-content"));
      expect(screen.getByTestId("panel-content")).toBeInTheDocument();
    });

    it("respects preventCloseOnClickOutside", async () => {
      render(HeaderActionOutsideClick, {
        props: { preventCloseOnClickOutside: true },
      });

      await user.click(getActionButton());
      await user.click(document.body);
      expect(screen.getByTestId("panel-content")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    const getActionButton = () =>
      screen.getByRole("button", { name: "Switcher" });

    it("exposes aria-haspopup and toggles aria-expanded", async () => {
      render(HeaderActionOutsideClick);

      const button = getActionButton();
      expect(button).toHaveAttribute("aria-haspopup", "true");
      expect(button).toHaveAttribute("aria-expanded", "false");

      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("closes the panel and refocuses the trigger on Escape", async () => {
      render(HeaderActionOutsideClick);

      const button = getActionButton();
      await user.click(button);
      expect(screen.getByTestId("panel-content")).toBeInTheDocument();

      // dismiss() registers window listeners on a macrotask after `enabled`
      // flips true. On Svelte 3/4 that action update can itself land in a
      // later macrotask than the click, so one `setTimeout(0)` can run
      // before registration is even scheduled (and Escape is missed). Two
      // flushes: (1) Svelte applies `enabled` and schedules add(), (2) add()
      // attaches the listener.
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));

      await user.keyboard("{Escape}");

      await waitFor(() =>
        expect(screen.queryByTestId("panel-content")).not.toBeInTheDocument(),
      );
      expect(button).toHaveFocus();
    });
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = HeaderActionComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
      expectTypeOf<Props["closeIcon"]>().toEqualTypeOf<
        CustomIcon | undefined
      >();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = HeaderActionComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["closeIcon"]>().toEqualTypeOf<any>();
    });
  });
});
