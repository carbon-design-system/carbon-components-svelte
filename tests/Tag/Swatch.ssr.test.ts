// @vitest-environment node
import Swatch from "carbon-components-svelte/Tag/Swatch.svelte";
import { getAvatarBackgroundColor } from "../../src/utils/avatar-color.js";
import { renderRaw } from "../utils/ssr";

describe("Swatch server render", () => {
  it("renders the hashed color class, the same one the client computes", () => {
    const html = renderRaw(Swatch, { colorKey: "Platform" });

    expect(html).toContain(
      `bx--swatch--${getAvatarBackgroundColor("Platform")}`,
    );
    expect(renderRaw(Swatch, { colorKey: "Platform" })).toBe(html);
  });

  it("renders a custom color as a custom property", () => {
    expect(renderRaw(Swatch, { cssColor: "#ff00aa" })).toContain(
      "--ccs-swatch-color: #ff00aa",
    );
  });
});
