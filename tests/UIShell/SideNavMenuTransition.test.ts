import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SideNavMenuTransition from "./SideNavMenuTransition.test.svelte";

type FakeAnimation = { cancel: () => void; onfinish: (() => void) | null };

describe("SideNavMenu transition", () => {
  let animations: FakeAnimation[] = [];

  beforeEach(() => {
    animations = [];
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
    Element.prototype.animate = vi.fn(() => {
      const animation: FakeAnimation = { cancel: vi.fn(), onfinish: null };
      animations.push(animation);
      return animation;
    }) as unknown as Element["animate"];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "animate");
  });

  const menu = () => screen.getByRole("button", { name: "Menu" });
  const list = () => menu().nextElementSibling as HTMLUListElement;

  it("toggles max-height at once when unset", async () => {
    render(SideNavMenuTransition);
    expect(list().style.maxHeight).toBe("");

    await user.click(menu());
    expect(list().style.maxHeight).toBe("none");
    expect(animations).toEqual([]);

    await user.click(menu());
    expect(list().style.maxHeight).toBe("");
  });

  it("keeps the list visible until the exit ends when set", async () => {
    render(SideNavMenuTransition, { transition: true });
    expect(list().style.visibility).toBe("hidden");
    expect(list().inert).toBe(true);

    await user.click(menu());
    expect(menu()).toHaveAttribute("aria-expanded", "true");
    // jsdom has no `inert`, so the attribute's removal leaves it undefined.
    expect(list().inert).toBeFalsy();
    expect(list().style.visibility).toBe("visible");
    expect(animations).toHaveLength(1);
    animations[0].onfinish?.();
    expect(list().style.visibility).toBe("");

    await user.click(menu());
    expect(menu()).toHaveAttribute("aria-expanded", "false");
    expect(list().inert).toBe(true);
    expect(list().style.visibility).toBe("visible");
    expect(list().style.maxHeight).toBe("none");
    animations[1].onfinish?.();
    expect(list().style.visibility).toBe("hidden");
    expect(list().style.maxHeight).toBe("");
  });

  it("passes options through to the collapse", async () => {
    const animate = Element.prototype.animate as unknown as ReturnType<
      typeof vi.fn
    >;
    render(SideNavMenuTransition, { transition: { duration: "slow01" } });

    await user.click(menu());
    expect(animate).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.objectContaining({ duration: 400 }),
    );
  });
});
