import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import SideNavMobileFocusTrapTest from "./SideNavMobileFocusTrap.test.svelte";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("SideNav mobile focus trap", () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it("wraps Tab from the last item back to the first when open on mobile", async () => {
    setViewportWidth(320);

    render(SideNavMobileFocusTrapTest, { props: { isOpen: true } });
    await tick();

    const first = screen.getByRole("link", { name: "First" });
    const last = screen.getByRole("link", { name: "Third" });

    last.focus();
    expect(last).toHaveFocus();

    await user.keyboard("{Tab}");

    expect(first).toHaveFocus();
  });

  it("wraps Shift+Tab from the first item back to the last when open on mobile", async () => {
    setViewportWidth(320);

    render(SideNavMobileFocusTrapTest, { props: { isOpen: true } });
    await tick();

    const first = screen.getByRole("link", { name: "First" });
    const last = screen.getByRole("link", { name: "Third" });

    first.focus();
    expect(first).toHaveFocus();

    await user.keyboard("{Shift>}{Tab}{/Shift}");

    expect(last).toHaveFocus();
  });

  it("does not trap focus when fixed is true, even on mobile", async () => {
    setViewportWidth(320);

    render(SideNavMobileFocusTrapTest, {
      props: { isOpen: true, fixed: true },
    });
    await tick();

    const first = screen.getByRole("link", { name: "First" });
    const last = screen.getByRole("link", { name: "Third" });

    last.focus();
    expect(last).toHaveFocus();

    await user.keyboard("{Tab}");

    expect(first).not.toHaveFocus();
  });

  it("does not trap focus at desktop widths", async () => {
    setViewportWidth(1280);

    render(SideNavMobileFocusTrapTest, { props: { isOpen: true } });
    await tick();

    const first = screen.getByRole("link", { name: "First" });
    const last = screen.getByRole("link", { name: "Third" });

    last.focus();
    expect(last).toHaveFocus();

    await user.keyboard("{Tab}");

    expect(first).not.toHaveFocus();
  });
});
