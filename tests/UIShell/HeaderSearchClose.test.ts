import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderSearchClose from "./HeaderSearchClose.test.svelte";

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

    // dismiss() defers window listener registration by a macrotask; flush
    // it before the outside click so that click is not missed.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const outside = document.createElement("div");
    document.body.appendChild(outside);
    fireEvent.mouseUp(outside);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });

    document.body.removeChild(outside);
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
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not dispatch close on an outside click while already collapsed", async () => {
    const onClose = vi.fn();
    render(HeaderSearchClose, { props: { active: false, onClose } });

    const outside = document.createElement("div");
    document.body.appendChild(outside);
    fireEvent.mouseUp(outside);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onClose).not.toHaveBeenCalled();

    document.body.removeChild(outside);
  });
});
