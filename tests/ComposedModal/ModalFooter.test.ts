import { render, screen } from "@testing-library/svelte";
import type ModalFooterComponent from "carbon-components-svelte/ComposedModal/ModalFooter.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import ModalFooterTest from "./ModalFooter.test.svelte";

describe("ModalFooter", () => {
  it("should render primary button", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Save" });
    expect(primaryButton).toBeInTheDocument();
    expect(primaryButton).toHaveClass("bx--btn--primary");
  });

  it("should render secondary button", () => {
    render(ModalFooterTest, {
      props: {
        secondaryButtonText: "Cancel",
      },
    });

    const secondaryButton = screen.getByRole("button", { name: "Cancel" });
    expect(secondaryButton).toBeInTheDocument();
    expect(secondaryButton).toHaveClass("bx--btn--secondary");
  });

  it("should handle primary button click", async () => {
    const onsubmit = vi.fn();
    const onprimary = vi.fn();
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        onsubmit,
        onprimary,
      },
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onsubmit).toHaveBeenCalledTimes(1);
    expect(onprimary).toHaveBeenCalledTimes(1);
  });

  it("should handle secondary button click", async () => {
    const onsecondary = vi.fn();
    const onclose = vi.fn();
    const { container } = render(ModalFooterTest, {
      props: {
        secondaryButtonText: "Cancel",
        onsecondary,
        onclose,
      },
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onsecondary).toHaveBeenCalledTimes(1);
    expect(onsecondary.mock.calls[0][0].detail).toEqual({ text: "Cancel" });
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".bx--modal")).not.toHaveClass("is-visible");
  });

  it("keeps modal open when preventDefault is called on secondary click", async () => {
    const onsecondary = vi.fn();
    const onclose = vi.fn();
    const { container } = render(ModalFooterTest, {
      props: {
        secondaryButtonText: "Cancel",
        preventSecondaryDefault: true,
        onsecondary,
        onclose,
      },
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onsecondary).toHaveBeenCalledTimes(1);
    expect(onsecondary.mock.calls[0][0].detail).toEqual({ text: "Cancel" });
    expect(onclose).not.toHaveBeenCalled();
    expect(container.querySelector(".bx--modal")).toHaveClass("is-visible");
  });

  it("should disable primary button when configured", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        primaryButtonDisabled: true,
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Save" });
    expect(primaryButton).toBeDisabled();
  });

  it.each([
    [
      "primary",
      {
        primaryButtonText: "Save",
        primaryButtonLoading: true,
        primaryButtonLoadingDescription: "Saving...",
      },
      "Saving...",
    ],
    [
      "secondary",
      {
        secondaryButtonText: "Cancel",
        secondaryButtonLoading: true,
        secondaryButtonLoadingDescription: "Cancelling...",
      },
      "Cancelling...",
    ],
  ])("uses a custom %s loading description", (_button, props, description) => {
    render(ModalFooterTest, { props });

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  describe("primaryButtonLoading", () => {
    it("shows InlineLoading and does not dispatch submit on click", async () => {
      const onsubmit = vi.fn();
      const onprimary = vi.fn();
      render(ModalFooterTest, {
        props: {
          primaryButtonText: "Save",
          primaryButtonLoading: true,
          onsubmit,
          onprimary,
        },
      });

      expect(screen.getByText("Loading")).toBeInTheDocument();
      expect(document.querySelector(".bx--inline-loading")).toBeInTheDocument();

      const primaryButton = screen.getByRole("button", { name: /Loading/i });
      expect(primaryButton).toBeDisabled();
      await user.click(primaryButton);

      expect(onsubmit).not.toHaveBeenCalled();
      expect(onprimary).not.toHaveBeenCalled();
    });
  });

  describe("secondaryButtonLoading", () => {
    it("shows InlineLoading and does not dispatch click on click", async () => {
      const onsecondary = vi.fn();
      render(ModalFooterTest, {
        props: {
          secondaryButtonText: "Cancel",
          secondaryButtonLoading: true,
          onsecondary,
        },
      });

      expect(screen.getByText("Loading")).toBeInTheDocument();
      const secondaryButton = screen.getByRole("button", { name: /Loading/i });
      expect(secondaryButton).toBeDisabled();
      await user.click(secondaryButton);

      expect(onsecondary).not.toHaveBeenCalled();
    });
  });

  describe("secondaryButtons loading", () => {
    it("shows InlineLoading for a loading entry and disables it", async () => {
      const onsecondary = vi.fn();
      render(ModalFooterTest, {
        props: {
          secondaryButtons: [
            { text: "Draft", loading: true, loadingDescription: "Saving..." },
            { text: "Discard" },
          ],
          onsecondary,
        },
      });

      expect(screen.getByText("Saving...")).toBeInTheDocument();
      const loadingButton = screen.getByRole("button", { name: /Saving/i });
      expect(loadingButton).toBeDisabled();
      await user.click(loadingButton);
      expect(onsecondary).not.toHaveBeenCalled();

      const idleButton = screen.getByRole("button", { name: "Discard" });
      expect(idleButton).not.toBeDisabled();
    });
  });

  it("should render danger variant", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Delete",
        danger: true,
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Delete" });
    expect(primaryButton).toHaveClass("bx--btn--danger");
  });

  it("should render one secondaryButtons entry with legacy { text }", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        secondaryButtons: [{ text: "Cancel" }],
      },
    });

    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel).toHaveClass("bx--btn--secondary");
    expect(cancel).not.toBeDisabled();
  });

  it("should apply kind and disabled from secondaryButtons", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        secondaryButtons: [
          { text: "Save draft", kind: "secondary" },
          { text: "Cancel", kind: "ghost", disabled: true },
        ],
      },
    });

    const draft = screen.getByRole("button", { name: "Save draft" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(draft).toHaveClass("bx--btn--secondary");
    expect(cancel).toHaveClass("bx--btn--ghost");
    expect(cancel).toBeDisabled();
  });

  it("should handle three-button layout", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        secondaryButtons: [{ text: "Cancel" }, { text: "Reset" }],
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Save" });
    const modalFooter = primaryButton.closest(".bx--modal-footer");
    expect(modalFooter).toHaveClass("bx--modal-footer--three-button");
  });

  it("should handle secondary button clicks with secondaryButtons array", async () => {
    const onsecondary = vi.fn();
    const onclose = vi.fn();
    render(ModalFooterTest, {
      props: {
        secondaryButtons: [{ text: "Cancel" }, { text: "Reset" }],
        onsecondary,
        onclose,
      },
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onsecondary).toHaveBeenCalledTimes(1);
    expect(onsecondary.mock.calls[0][0].detail).toEqual({ text: "Cancel" });

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(onsecondary).toHaveBeenCalledTimes(2);
    expect(onsecondary.mock.calls[1][0].detail).toEqual({ text: "Reset" });
    expect(onclose).not.toHaveBeenCalled();
  });

  it.each([
    [
      "primaryClass",
      { primaryButtonText: "Save" },
      "Save",
      "custom-primary-class",
    ],
    [
      "secondaryClass",
      { secondaryButtonText: "Cancel" },
      "Cancel",
      "custom-secondary-class",
    ],
  ])("applies %s to its button", (prop, props, name, className) => {
    render(ModalFooterTest, { props: { ...props, [prop]: className } });

    expect(screen.getByRole("button", { name })).toHaveClass(className);
  });

  it("should render slot content", () => {
    render(ModalFooterTest, {
      props: {
        slotContent: "Custom footer content",
      },
    });

    expect(screen.getByText("Custom footer content")).toBeInTheDocument();
  });

  it("should apply custom attributes", () => {
    render(ModalFooterTest, {
      props: {
        "data-testid": "custom-footer",
      },
    });

    const modalFooter = screen.getByTestId("custom-footer");
    expect(modalFooter).toBeInTheDocument();
  });

  it.each([
    [
      "primary",
      { primaryButtonText: "", secondaryButtonText: "Cancel" },
      "Cancel",
      ".bx--btn--primary",
    ],
    [
      "secondary",
      { primaryButtonText: "Save", secondaryButtonText: "" },
      "Save",
      ".bx--btn--secondary",
    ],
  ])(
    "should not render %s button when text is empty",
    (_button, props, remaining, absentSelector) => {
      const { container } = render(ModalFooterTest, { props });

      const buttons = container.querySelectorAll(".bx--modal-footer .bx--btn");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent(remaining);
      expect(container.querySelector(absentSelector)).toBeNull();
    },
  );

  it("should prioritize secondaryButtons over secondaryButtonText", () => {
    render(ModalFooterTest, {
      props: {
        secondaryButtonText: "Cancel",
        secondaryButtons: [{ text: "Reset" }],
      },
    });

    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = ModalFooterComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["primaryButtonIcon"]>().toEqualTypeOf<
        CustomIcon | undefined
      >();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = ModalFooterComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["primaryButtonIcon"]>().toEqualTypeOf<any>();
    });
  });
});
