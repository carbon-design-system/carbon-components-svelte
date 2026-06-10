import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import ThemeUpdateTiming from "./ThemeUpdateTiming.test.svelte";

describe("Theme update dispatch", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("theme");
  });

  it("dispatches update only after the theme attribute is applied", async () => {
    const observed: Array<string | null> = [];
    const { component } = render(ThemeUpdateTiming, {
      props: {
        theme: "white",
        onUpdate: () => {
          observed.push(document.documentElement.getAttribute("theme"));
        },
      },
    });
    await tick();

    component.theme = "g100";
    await tick();

    expect(observed).toEqual(["g100"]);
    expect(document.documentElement.getAttribute("theme")).toBe("g100");
  });

  it("applies the theme even when a consumer's update handler throws", async () => {
    const { component } = render(ThemeUpdateTiming, {
      props: {
        theme: "white",
        onUpdate: () => {
          throw new Error("consumer boom");
        },
      },
    });
    await tick();

    try {
      component.theme = "g100";
      await tick();
    } catch {
      // expected
    }

    expect(document.documentElement.getAttribute("theme")).toBe("g100");
  });
});
