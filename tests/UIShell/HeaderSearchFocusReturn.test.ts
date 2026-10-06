import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import HeaderSearchClose from "./HeaderSearchClose.test.svelte";
import HeaderSearchMenu from "./HeaderSearchMenu.test.svelte";

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
    const outside = document.createElement("button");
    document.body.appendChild(outside);

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
    document.body.removeChild(outside);
  });

  it("does not take focus back when a rich menu on:select moves it elsewhere", async () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);

    render(HeaderSearchMenu, {
      props: { active: true, onSelect: () => outside.focus() },
    });

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{Enter}");
    await tick();
    await tick();

    expect(outside).toHaveFocus();
    document.body.removeChild(outside);
  });

  it("leaves focus alone when an outside click collapses the search", async () => {
    render(HeaderSearchClose, { props: { active: true } });
    await flushDismiss();

    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    fireEvent.mouseUp(outside);
    await flushMacrotask();
    await tick();

    expect(outside).toHaveFocus();
    document.body.removeChild(outside);
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
