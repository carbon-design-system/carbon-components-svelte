import { pickRole } from "../../src/motion/context.js";

type Settings = Parameters<typeof pickRole>[0];

describe("pickRole", () => {
  it("leaves every role unset with no props", () => {
    expect(pickRole({}, "menu")).toBeUndefined();
  });

  it("applies transition to every role", () => {
    expect(pickRole({ transition: true }, "menu")).toBe(true);
    expect(pickRole({ transition: false }, "notification")).toBe(false);
    expect(pickRole({ transition: { duration: "fast01" } }, "tooltip")).toEqual(
      { duration: "fast01" },
    );
  });

  it("leaves a role unset when only other roles are set", () => {
    expect(pickRole({ menu: true }, "notification")).toBeUndefined();
  });

  it("lets a role prop win over transition", () => {
    expect(pickRole({ transition: true, tooltip: false }, "tooltip")).toBe(
      false,
    );
    expect(pickRole({ transition: false, menu: true }, "menu")).toBe(true);
    expect(
      pickRole({ transition: false, menu: { duration: 70 } }, "menu"),
    ).toEqual({ duration: 70 });
  });

  it("merges the role's params over the shared ones", () => {
    expect(
      pickRole(
        { transition: { duration: 90, easing: "standard" }, menu: true },
        "menu",
      ),
    ).toEqual({ duration: 90, easing: "standard" });
    expect(
      pickRole(
        { transition: { duration: 90 }, menu: { duration: 70 } },
        "menu",
      ),
    ).toEqual({ duration: 70 });
  });

  it("drops params a role cannot share", () => {
    const settings = {
      menu: { duration: 70, x: 32, fn: () => ({}) },
    } as unknown as Settings;
    expect(pickRole(settings, "menu")).toEqual({ duration: 70 });
    expect(pickRole({ menu: { x: 32 } } as unknown as Settings, "menu")).toBe(
      true,
    );
  });
});
