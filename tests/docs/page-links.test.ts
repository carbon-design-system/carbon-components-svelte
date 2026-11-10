// @vitest-environment node
import {
  editPageUrl,
  openIssuesUrl,
  reportIssueUrl,
} from "../../docs/src/page-links";

const repo = "https://github.com/carbon-design-system/carbon-components-svelte";

describe("page links", () => {
  it("edits the page's source file on master", () => {
    expect(editPageUrl(repo, "./pages/components/Button.md")).toBe(
      `${repo}/edit/master/docs/src/pages/components/Button.md`,
    );
    expect(editPageUrl(repo, "./pages/fonts.md")).toBe(
      `${repo}/edit/master/docs/src/pages/fonts.md`,
    );
  });

  it("starts an issue with the page's name and address", () => {
    const url = new URL(
      reportIssueUrl(
        repo,
        "Button",
        "https://svelte.carbondesignsystem.com/components/Button",
      ),
    );
    expect(url.pathname).toBe(
      "/carbon-design-system/carbon-components-svelte/issues/new",
    );
    expect(url.searchParams.get("title")).toBe("Button: ");
    expect(url.searchParams.get("body")).toBe(
      "Page: https://svelte.carbondesignsystem.com/components/Button\n\n",
    );
  });

  it("searches open issues by the component's name", () => {
    const url = new URL(openIssuesUrl(repo, "DataTable"));
    expect(url.searchParams.get("q")).toBe(
      "is:issue is:open in:title DataTable",
    );
  });
});
