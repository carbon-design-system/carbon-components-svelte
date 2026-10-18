import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderNavMenuViewportEdge from "./HeaderNavMenuViewportEdge.test.svelte";

const VIEWPORT_WIDTH = 1000;

/** Places the left-aligned menu so its right edge lands at `right`. */
function mockMenuRight(right: number) {
  const original = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      if (this.classList.contains("bx--header__menu")) {
        return DOMRect.fromRect({
          x: right - 200,
          y: 48,
          width: 200,
          height: 96,
        });
      }
      return original.call(this);
    },
  );
}

const menu = () =>
  screen.getByRole("menu", { hidden: true }) as HTMLUListElement;

describe("HeaderNavMenu viewport edge", () => {
  beforeEach(() => {
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      VIEWPORT_WIDTH,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aligns the menu to the trigger's right edge when it would overflow", async () => {
    mockMenuRight(VIEWPORT_WIDTH + 30);
    render(HeaderNavMenuViewportEdge);

    await user.click(screen.getByRole("menuitem", { name: "More" }));

    expect(menu()).toHaveClass("bx--header__menu--align-end");
  });

  it("keeps the default alignment when the menu fits", async () => {
    mockMenuRight(VIEWPORT_WIDTH - 30);
    render(HeaderNavMenuViewportEdge);

    await user.click(screen.getByRole("menuitem", { name: "More" }));

    expect(menu()).not.toHaveClass("bx--header__menu--align-end");
  });

  it("measures again from the default alignment on the next open", async () => {
    mockMenuRight(VIEWPORT_WIDTH - 30);
    render(HeaderNavMenuViewportEdge);
    const trigger = screen.getByRole("menuitem", { name: "More" });

    await user.click(trigger);
    expect(menu()).not.toHaveClass("bx--header__menu--align-end");
    await user.click(trigger);

    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockRestore();
    mockMenuRight(VIEWPORT_WIDTH + 30);
    await user.click(trigger);
    expect(menu()).toHaveClass("bx--header__menu--align-end");

    await user.click(trigger);
    expect(menu()).not.toHaveClass("bx--header__menu--align-end");
  });
});
