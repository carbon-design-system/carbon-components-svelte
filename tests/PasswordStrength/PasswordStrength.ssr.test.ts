// @vitest-environment node
import PasswordRequirements from "carbon-components-svelte/PasswordStrength/PasswordRequirements.svelte";
import PasswordStrength from "carbon-components-svelte/PasswordStrength/PasswordStrength.svelte";
import { renderSSR } from "../utils/ssr";

describe("PasswordStrength server render", () => {
  it("renders the meter and feedback for the initial value", () => {
    const { document } = renderSSR(PasswordStrength, { value: "password" });

    const meter = document.querySelector('[role="meter"]');
    expect(meter?.getAttribute("aria-valuenow")).toBe("1");
    expect(meter?.getAttribute("aria-valuetext")).toBe("Strength: Weak");
    expect(document.body.textContent).toContain(
      "This is a top-10 common password.",
    );
  });

  it("renders an empty live region, ready for the first message", () => {
    const { document } = renderSSR(PasswordStrength, { value: "password" });

    const status = document.querySelector('[role="status"]');
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.textContent?.trim()).toBe("");
  });

  it("renders a provisional estimate without calling a custom one", () => {
    const estimate = vi.fn(() => Promise.resolve({ score: 4 }));
    const { document } = renderSSR(PasswordStrength, {
      value: "password",
      estimate,
    });

    expect(estimate).not.toHaveBeenCalled();
    expect(
      document.querySelector('[role="meter"]')?.getAttribute("aria-valuenow"),
    ).toBe("1");
  });
});

describe("PasswordRequirements server render", () => {
  it("renders each requirement with its state in text", () => {
    const { document } = renderSSR(PasswordRequirements, {
      value: "lavender-sofa-7",
    });

    const items = [...document.querySelectorAll("li")].map((li) =>
      li.textContent?.replace(/\s+/g, " ").trim(),
    );
    expect(items).toEqual([
      "At least 12 characters, met",
      "Not a commonly used password, met",
    ]);
  });
});
