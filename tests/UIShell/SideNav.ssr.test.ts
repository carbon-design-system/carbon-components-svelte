// @vitest-environment node
import { get } from "svelte/store";
import { isSideNavRail, sideNavWidth } from "../../src/UIShell/nav-store.js";
import { renderSSR } from "../utils/ssr";
import Shells from "./SideNav.ssr.test.svelte";

function contentWidth(document: Document, id: string) {
  const content = document.getElementById(id);
  assert(content);
  return content.style.getPropertyValue("--ccs-side-nav-width");
}

describe("SideNav server render", () => {
  // The stores `Content` reads are module state, which the server shares
  // across requests.
  it("does not carry a resizable width into the next render", () => {
    const first = renderSSR(Shells, {
      shells: [{ sideNav: true, width: 320 }],
    });
    expect(contentWidth(first.document, "content-1")).toBe("320px");

    const second = renderSSR(Shells, { shells: [{ sideNav: false }] });
    expect(contentWidth(second.document, "content-1")).toBe("");
  });

  it.each([
    { rail: true, width: undefined },
    { rail: false, width: 320 },
  ])("resets the rail and width stores after a render (%o)", (shell) => {
    renderSSR(Shells, { shells: [{ sideNav: true, ...shell }] });

    expect(get(isSideNavRail)).toBe(false);
    expect(get(sideNavWidth)).toBeUndefined();
  });

  it("gives each shell on one page its own width", () => {
    const { document } = renderSSR(Shells, {
      shells: [
        { sideNav: true, width: 320 },
        { sideNav: true, rail: true },
        { sideNav: true, width: 400 },
      ],
    });

    expect(contentWidth(document, "content-1")).toBe("320px");
    expect(contentWidth(document, "content-2")).toBe("");
    expect(contentWidth(document, "content-3")).toBe("400px");
  });
});
