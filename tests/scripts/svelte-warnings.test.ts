// @vitest-environment node
import { compilerDiagnostics } from "../../scripts/lib/svelte-warnings";

describe("compilerDiagnostics", () => {
  it("reports an a11y warning where it is", () => {
    const [warning] = compilerDiagnostics(
      '<div>\n  <img src="a.png">\n</div>\n',
      "Img.svelte",
    );
    expect(warning).toMatchObject({
      severity: "warning",
      code: "a11y_missing_attribute",
      line: 2,
      column: 3,
    });
  });

  it("honors `svelte-ignore`", () => {
    const source =
      '<!-- svelte-ignore a11y_missing_attribute -->\n<img src="a.png">\n';
    expect(compilerDiagnostics(source, "Img.svelte")).toEqual([]);
  });

  it("reports invalid markup as an error", () => {
    const [error] = compilerDiagnostics(
      '<div a="1" a="2"></div>\n',
      "Dup.svelte",
    );
    expect(error).toMatchObject({
      severity: "error",
      code: "attribute_duplicate",
    });
  });
});
