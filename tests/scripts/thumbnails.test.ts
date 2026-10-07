// @vitest-environment node
import {
  auditThumbnail,
  missingThumbnails,
  orphanThumbnails,
  thumbnailName,
} from "../../scripts/lib/thumbnails";

const svg = (body: string, defs = "") => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="320px" height="180px" viewBox="0 0 320 180" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <title>meter</title>${defs}
    <g id="meter" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">${body}</g>
</svg>`;

describe("thumbnailName", () => {
  it("kebab-cases the docs page name", () => {
    expect(thumbnailName("ToggleButtonGroup")).toBe("toggle-button-group");
    expect(thumbnailName("Meter")).toBe("meter");
  });

  it("keeps the UI in UIShell together", () => {
    expect(thumbnailName("UIShell")).toBe("ui-shell");
  });
});

describe("missingThumbnails and orphanThumbnails", () => {
  it("lists pages without a thumbnail", () => {
    expect(missingThumbnails(["Meter", "UIShell"], ["ui-shell"])).toEqual([
      "Meter",
    ]);
  });

  it("lists thumbnails without a page, except pageless catalog entries", () => {
    expect(
      orphanThumbnails(
        ["Meter"],
        ["meter", "skeleton", "tabs-vertical", "old"],
      ),
    ).toEqual(["skeleton", "old"]);
  });
});

describe("auditThumbnail", () => {
  it("accepts a thumbnail that follows the rules", () => {
    const shadow =
      '<defs><filter id="meter-shadow"><feGaussianBlur stdDeviation="3"></feGaussianBlur></filter></defs>';
    const body =
      '<rect fill="black" filter="url(#meter-shadow)" x="76" y="94" width="168" height="8"></rect>' +
      '<rect fill="var(--cds-support-warning, #f1c21b)" x="76" y="94" width="141" height="8"></rect>';
    expect(auditThumbnail("meter", svg(body, shadow))).toEqual([]);
  });

  it("flags a non-standard canvas", () => {
    const wide = svg("").replace(
      'viewBox="0 0 320 180"',
      'viewBox="0 0 640 360"',
    );
    expect(auditThumbnail("meter", wide)).toEqual([
      'canvas is not width="320px" height="180px" viewBox="0 0 320 180"',
    ]);
  });

  it("flags tokens outside the table and mismatched fallbacks", () => {
    const body =
      '<rect fill="var(--cds-hover-ui, #e5e5e5)"></rect>' +
      '<rect fill="var(--cds-field-01, #ffffff)"></rect>';
    expect(auditThumbnail("meter", svg(body))).toEqual([
      "token --cds-hover-ui is not in the token table",
      "token --cds-field-01 falls back to #ffffff, not #f4f4f4",
    ]);
  });

  it("flags raw colors once, but allows black under a filter", () => {
    const body =
      '<rect fill="#6F6F6F"></rect><rect fill="#6F6F6F"></rect>' +
      '<rect fill="black" filter="url(#meter-shadow)"></rect>' +
      '<rect fill="none" stroke="black"></rect>';
    expect(auditThumbnail("meter", svg(body))).toEqual([
      'raw color fill="#6F6F6F"',
      'raw color stroke="black"',
    ]);
  });

  it("skips raw colors for thumbnails whose idea is literal color", () => {
    expect(auditThumbnail("tag", svg('<rect fill="#0043CE"></rect>'))).toEqual(
      [],
    );
  });

  it("flags unprefixed <defs> ids and <use> references", () => {
    const defs = '<defs><rect id="panel-shape"></rect></defs>';
    expect(
      auditThumbnail("meter", svg('<use href="#panel-shape"></use>', defs)),
    ).toEqual([
      'id "panel-shape" is referenced or defined in <defs> but not prefixed with "meter-"',
      "uses <use>, <image>, or xlink:href; draw plain shapes",
    ]);
  });

  it("flags unprefixed ids referenced outside <defs>", () => {
    const body =
      '<mask id="mask-2"><rect></rect></mask><g mask="url(#mask-2)"></g>';
    expect(auditThumbnail("meter", svg(body))).toEqual([
      'id "mask-2" is referenced or defined in <defs> but not prefixed with "meter-"',
    ]);
  });

  it("flags files over the size budget", () => {
    const body = `<rect fill="var(--cds-ui-02, #ffffff)"></rect>`.repeat(200);
    expect(auditThumbnail("meter", svg(body))).toEqual([
      expect.stringMatching(/B exceeds the 8000 B budget$/),
    ]);
  });
});
