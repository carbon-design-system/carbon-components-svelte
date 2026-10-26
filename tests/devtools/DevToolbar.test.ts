import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DevToolbar from "./DevToolbar.test.svelte";

const OFF = {
  grid: false,
  baseline: false,
  textBaselines: false,
  inspect: false,
  spacing: false,
  contrast: false,
  targets: false,
  overflow: false,
  rtl: false,
};

function button(name: RegExp) {
  return screen.getByRole("button", { name });
}

describe("DevToolbar", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("dir");
  });

  it("renders a labeled toolbar marked as a dev tool", () => {
    render(DevToolbar);
    const bar = screen.getByRole("region", { name: "Developer tools" });
    expect(bar).toHaveClass("bx--dev-toolbar");
    expect(bar).toHaveAttribute("data-ccs-dev-tool");
    expect(bar).toHaveAttribute("dir", "ltr");
  });

  it("turns a tool on from its button and fires change", async () => {
    const onChange = vi.fn();
    const { component } = render(DevToolbar, {
      props: { tools: { ...OFF }, onChange },
    });
    await user.click(button(/Grid columns/));
    expect(component.tools?.grid).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ ...OFF, grid: true });
    expect(document.querySelector(".bx--grid-overlay")).not.toBeNull();
  });

  it("does not fire change when tools are set from outside", async () => {
    const onChange = vi.fn();
    const { component } = render(DevToolbar, {
      props: { tools: { ...OFF }, onChange },
    });
    component.tools = { ...OFF, spacing: true };
    await tick();
    expect(onChange).not.toHaveBeenCalled();
    expect(document.querySelector(".bx--layout-inspector")).not.toBeNull();
  });

  it("toggles a tool with Alt+Shift and its letter", async () => {
    const onChange = vi.fn();
    const { component } = render(DevToolbar, {
      props: { tools: { ...OFF }, onChange },
    });
    await user.keyboard("{Alt>}{Shift>}S{/Shift}{/Alt}");
    expect(component.tools?.spacing).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ ...OFF, spacing: true });
  });

  it("ignores shortcuts while typing", async () => {
    const { component } = render(DevToolbar, {
      props: { tools: { ...OFF } },
    });
    await user.click(screen.getByTestId("field"));
    await user.keyboard("{Alt>}{Shift>}G{/Shift}{/Alt}");
    expect(component.tools?.grid).toBe(false);
  });

  it("ignores shortcuts when they are off", async () => {
    const { component } = render(DevToolbar, {
      props: { tools: { ...OFF }, shortcuts: false },
    });
    await user.keyboard("{Alt>}{Shift>}G{/Shift}{/Alt}");
    expect(component.tools?.grid).toBe(false);
    expect(button(/^Grid columns$/)).toBeInTheDocument();
  });

  it("collapses and expands with Alt+Shift+D", async () => {
    const { component } = render(DevToolbar, {
      props: { tools: { ...OFF, grid: true } },
    });
    await user.keyboard("{Alt>}{Shift>}D{/Shift}{/Alt}");
    expect(component.expanded).toBe(false);
    // Tools stay on while collapsed, and the handle counts them.
    expect(button(/Developer tools, 1 on/)).toBeInTheDocument();
    await user.click(button(/Developer tools/));
    expect(component.expanded).toBe(true);
  });

  it("saves tools and restores them", async () => {
    const first = render(DevToolbar, {
      props: { tools: { ...OFF }, persist: true },
    });
    await user.click(button(/Baseline rows/));
    first.unmount();

    const saved = JSON.parse(
      localStorage.getItem("ccs-dev-toolbar-test") ?? "",
    );
    expect(saved.tools.baseline).toBe(true);

    const { component } = render(DevToolbar, {
      props: { tools: { ...OFF }, persist: true },
    });
    await tick();
    expect(component.tools?.baseline).toBe(true);
  });

  it("drops saved tools it does not know", async () => {
    localStorage.setItem(
      "ccs-dev-toolbar-test",
      JSON.stringify({ tools: { lint: true, grid: true }, expanded: false }),
    );
    const { component } = render(DevToolbar, {
      props: { tools: { ...OFF }, persist: true },
    });
    await tick();
    expect(component.tools).toEqual({ ...OFF, grid: true });
    expect(component.expanded).toBe(false);
  });

  it("does not save when persist is off", async () => {
    render(DevToolbar, { props: { tools: { ...OFF } } });
    await user.click(button(/Grid columns/));
    expect(localStorage.getItem("ccs-dev-toolbar-test")).toBeNull();
  });

  it("restores the page direction when it unmounts", async () => {
    const { component } = render(DevToolbar, {
      props: { tools: { ...OFF } },
    });
    await user.click(button(/Right-to-left/));
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    component.mounted = false;
    await tick();
    expect(document.documentElement).not.toHaveAttribute("dir");
  });

  it("leaves an RTL page as it was", async () => {
    document.documentElement.setAttribute("dir", "rtl");
    const { component } = render(DevToolbar, {
      props: { tools: { ...OFF } },
    });
    component.mounted = false;
    await tick();
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });
});
