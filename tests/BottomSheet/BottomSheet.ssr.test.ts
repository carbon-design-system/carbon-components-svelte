// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import BottomSheet from "./BottomSheet.test.svelte";

describe("BottomSheet (server)", () => {
  it("renders nothing while closed", () => {
    const { document } = renderSSR(BottomSheet, { open: false });
    expect(document.querySelector(".bx--bottom-sheet")).toBeNull();
    expect(document.querySelector(".bx--bottom-sheet__scrim")).toBeNull();
  });

  it("renders an open sheet hidden until the page can measure it", () => {
    const { document } = renderSSR(BottomSheet, {});
    const sheet = document.querySelector(".bx--bottom-sheet");
    expect(sheet?.getAttribute("role")).toBe("dialog");
    expect(sheet?.getAttribute("aria-modal")).toBe("true");
    expect(sheet?.classList).toContain("bx--bottom-sheet--unmeasured");
    // Without a measured height there is no offset, no grabber to fake.
    expect(sheet?.getAttribute("style")).toBeNull();
    expect(document.querySelector("[role=slider]")).toBeNull();
    expect(document.querySelector(".bx--bottom-sheet__scrim")).not.toBeNull();
  });
});
