import { render, screen } from "@testing-library/svelte";
import { type Component, tick } from "svelte";
import ComposedModalTest from "../ComposedModal/ComposedModal.test.svelte";
import { openTooltips } from "../utils/open-tooltips";
import { user } from "../utils/user";
import ModalTest from "./Modal.test.svelte";
import ModalCloseTooltipInitialFocus from "./ModalCloseTooltipInitialFocus.test.svelte";

type Case = {
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: the two fixtures differ in props
  component: Component<any>;
  props: Record<string, unknown>;
  label: string;
};

const cases: Case[] = [
  {
    name: "Modal",
    component: ModalTest,
    props: { modalHeading: "Edit profile", primaryButtonText: "Save" },
    label: "Close the modal",
  },
  {
    name: "Modal (passive)",
    component: ModalTest,
    props: { modalHeading: "Edit profile", passiveModal: true },
    label: "Close the modal",
  },
  {
    name: "ComposedModal",
    component: ComposedModalTest,
    props: { headerTitle: "Edit profile" },
    label: "Close",
  },
];

describe.each(cases)("$name close button", ({ component, props, label }) => {
  async function renderOpen(onclose = vi.fn()) {
    render(component, {
      props: {
        ...props,
        open: true,
        selectorPrimaryFocus: "#test-focus",
        onclose,
      },
    });
    // ComposedModal moves focus a tick after mount.
    await tick();
    const close = screen.getByRole("button", { name: label });
    return { close, onclose };
  }

  it("is an icon-only button in a close-button wrapper", async () => {
    const { close } = await renderOpen();

    expect(close).toHaveClass("bx--modal-close", "bx--btn--icon-only");
    expect(close).toHaveAttribute("aria-label", label);
    expect(close.parentElement).toHaveClass("bx--modal-close-button");
    expect(openTooltips()).toHaveLength(0);
  });

  it("shows its label in a tooltip on focus", async () => {
    const { close } = await renderOpen();

    close.focus();
    await tick();

    expect(openTooltips()).toHaveLength(1);
    expect(openTooltips()[0]).toHaveTextContent(label);
  });

  it("closes the tooltip on the first Escape and the modal on the second", async () => {
    const { close, onclose } = await renderOpen();
    const root = close.closest(".bx--modal");
    assert(root);

    close.focus();
    await tick();
    expect(openTooltips()).toHaveLength(1);

    await user.keyboard("{Escape}");

    expect(openTooltips()).toHaveLength(0);
    expect(root).toHaveClass("is-visible");
    expect(onclose).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");

    expect(root).not.toHaveClass("is-visible");
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it("closes the modal on Escape when no tooltip is open", async () => {
    const { close, onclose } = await renderOpen();
    const root = close.closest(".bx--modal");
    assert(root);
    expect(screen.getByTestId("test-focus")).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(root).not.toHaveClass("is-visible");
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it("closes the modal on click", async () => {
    const { close, onclose } = await renderOpen();

    await user.click(close);

    expect(onclose).toHaveBeenCalledTimes(1);
  });
});

describe.each([
  { name: "Modal (passive)", composed: false, label: "Close the modal" },
  { name: "ComposedModal", composed: true, label: "Close" },
])("$name close button as initial focus", ({ composed, label }) => {
  async function open(opener: "click" | "keyboard") {
    const onclose = vi.fn();
    render(ModalCloseTooltipInitialFocus, { props: { composed, onclose } });
    const trigger = screen.getByRole("button", { name: "Open" });
    if (opener === "click") {
      await user.click(trigger);
    } else {
      trigger.focus();
      await user.keyboard("{Enter}");
    }
    // ComposedModal moves focus a tick after it opens.
    await tick();
    const close = screen.getByRole("button", { name: label });
    const root = close.closest(".bx--modal");
    assert(root);
    expect(close).toHaveFocus();
    return { close, root, onclose };
  }

  it.each(["click", "keyboard"] as const)(
    "keeps the tooltip closed and closes on one Escape when opened by %s",
    async (opener) => {
      const { root, onclose } = await open(opener);

      expect(openTooltips()).toHaveLength(0);

      await user.keyboard("{Escape}");

      expect(root).not.toHaveClass("is-visible");
      expect(onclose).toHaveBeenCalledTimes(1);
    },
  );

  it("shows the tooltip when Tab brings focus back", async () => {
    const { close, root, onclose } = await open("keyboard");

    await user.tab();
    expect(close).not.toHaveFocus();
    await user.tab({ shift: true });
    await tick();

    expect(close).toHaveFocus();
    expect(openTooltips()).toHaveLength(1);

    await user.keyboard("{Escape}");
    expect(openTooltips()).toHaveLength(0);
    expect(root).toHaveClass("is-visible");

    await user.keyboard("{Escape}");
    expect(root).not.toHaveClass("is-visible");
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it("shows the tooltip on hover", async () => {
    const { close } = await open("click");

    await user.hover(close);
    await vi.waitFor(() => expect(openTooltips()).toHaveLength(1));
  });
});
