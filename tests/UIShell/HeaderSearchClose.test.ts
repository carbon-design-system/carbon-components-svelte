import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import HeaderSearchClose from "./HeaderSearchClose.test.svelte";
import HeaderSearchMenu from "./HeaderSearchMenu.test.svelte";
import HeaderSearchSubmit from "./HeaderSearchSubmit.test.svelte";
import { withOutsideElement } from "./header-search-helpers";

describe("HeaderSearch close event", () => {
  it('dispatches close with trigger "escape-key" when Escape collapses an empty search', async () => {
    const onClose = vi.fn();
    render(HeaderSearchClose, { props: { active: true, onClose } });

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("search")).not.toHaveClass(
      "bx--header__search--active",
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(HeaderSearchClose, { props: { active: true, onClose } });

    await flushDismiss();

    await withOutsideElement("div", async (outside) => {
      fireEvent.mouseUp(outside);
      await flushMacrotask();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it("does not dispatch close on Escape while a query is present (stays active)", async () => {
    const onClose = vi.fn();
    render(HeaderSearchClose, {
      props: { active: true, value: "query", onClose },
    });

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("search")).toHaveClass(
      "bx--header__search--active",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not dispatch close when the clear button collapses the search", async () => {
    const onClose = vi.fn();
    render(HeaderSearchClose, {
      props: { active: true, value: "query", onClose },
    });

    await user.click(
      screen.getByRole("button", { name: "Clear search input" }),
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it('dispatches close with trigger "select" when a result is chosen', async () => {
    const onClose = vi.fn();
    render(HeaderSearchClose, {
      props: {
        active: true,
        value: "query",
        results: [{ href: "/1", text: "Result 1" }],
        onClose,
      },
    });

    await user.click(screen.getByRole("menuitem", { name: "Result 1" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it("does not dispatch close when bind:active is set to false externally", async () => {
    const onClose = vi.fn();
    const { component } = render(HeaderSearchClose, {
      props: { active: true, onClose },
    });

    component.active = false;
    await flushDismiss();

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("HeaderSearch focus return", () => {
  it("focuses the search button when Escape collapses an empty search", async () => {
    render(HeaderSearchClose, { props: { active: true } });

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Escape}");
    await tick();

    expect(screen.getByRole("button", { name: "Search" })).toHaveFocus();
  });

  it("focuses the search button after the clear button collapses the search", async () => {
    render(HeaderSearchClose, { props: { active: true, value: "query" } });

    await user.click(
      screen.getByRole("button", { name: "Clear search input" }),
    );
    await tick();

    expect(screen.getByRole("button", { name: "Search" })).toHaveFocus();
  });

  it("focuses the search button after Enter selects a result", async () => {
    render(HeaderSearchClose, {
      props: {
        active: true,
        value: "query",
        results: [{ href: "/1", text: "Result 1" }],
      },
    });

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Enter}");
    await tick();

    expect(screen.getByRole("button", { name: "Search" })).toHaveFocus();
  });

  it("focuses the search button after a rich menu item is selected", async () => {
    render(HeaderSearchMenu, { props: { active: true } });

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{Enter}");
    await tick();

    expect(screen.getByRole("button", { name: "Search" })).toHaveFocus();
  });

  it("does not take focus back when on:select moves it elsewhere", async () => {
    await withOutsideElement("button", async (outside) => {
      render(HeaderSearchClose, {
        props: {
          active: true,
          value: "query",
          results: [{ href: "/1", text: "Result 1" }],
          onSelect: () => outside.focus(),
        },
      });

      await user.click(screen.getByRole("textbox"));
      await user.keyboard("{Enter}");
      await tick();
      await tick();

      expect(outside).toHaveFocus();
    });
  });

  it("does not take focus back when a rich menu on:select moves it elsewhere", async () => {
    await withOutsideElement("button", async (outside) => {
      render(HeaderSearchMenu, {
        props: { active: true, onSelect: () => outside.focus() },
      });

      await user.click(screen.getByRole("combobox"));
      await user.keyboard("{ArrowDown}{Enter}");
      await tick();
      await tick();

      expect(outside).toHaveFocus();
    });
  });

  it("leaves focus alone when an outside click collapses the search", async () => {
    render(HeaderSearchClose, { props: { active: true } });
    await flushDismiss();

    await withOutsideElement("button", async (outside) => {
      outside.focus();
      fireEvent.mouseUp(outside);
      await flushMacrotask();
      await tick();

      expect(outside).toHaveFocus();
    });
  });

  it("does not take focus when active is set to false externally", async () => {
    const { component } = render(HeaderSearchClose, {
      props: { active: true },
    });
    await tick();

    component.active = false;
    await tick();
    await tick();

    expect(screen.getByRole("button", { name: "Search" })).not.toHaveFocus();
  });
});

const results = [{ href: "/quotas", text: "Quotas" }];

describe("HeaderSearch focus leaving", () => {
  it("closes when Tab moves focus out of the search", async () => {
    const onClose = vi.fn();
    const { component } = render(HeaderSearchSubmit, {
      props: { onClose, results },
    });

    await user.type(screen.getByRole("textbox"), "quota");
    await user.tab(); // clear button
    expect(component.active).toBe(true);

    await user.tab();
    expect(screen.getByRole("link", { name: "Main content" })).toHaveFocus();
    expect(component.active).toBe(false);
    expect(component.value).toBe("quota");
    expect(onClose).toHaveBeenCalledWith({ trigger: "blur" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("reports a click on another focusable element as outside-click", async () => {
    const onClose = vi.fn();
    const { component } = render(HeaderSearchSubmit, { props: { onClose } });

    await user.type(screen.getByRole("textbox"), "quota");
    await user.click(screen.getByRole("link", { name: "Main content" }));

    expect(component.active).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith({ trigger: "outside-click" });
  });
});
