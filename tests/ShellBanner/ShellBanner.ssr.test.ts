// @vitest-environment node
import ShellBanner from "carbon-components-svelte/UIShell/ShellBanner.svelte";
import { render } from "svelte/server";
import { renderRaw } from "../utils/ssr";

describe("ShellBanner server render", () => {
  it("renders the region with its title and no live role", () => {
    const html = renderRaw(ShellBanner, {
      title: "Viewing as Jane",
      label: "Impersonation",
    });

    expect(html).toContain('aria-label="Impersonation"');
    expect(html).toContain("Viewing as Jane");
    expect(html).not.toContain(`role="status"`);
  });

  it("reserves the banner's height in the head before the page measures it", () => {
    const { head } = render(ShellBanner, {
      props: { placement: "above-header", title: "Staging" },
    });

    expect(head).toContain(":root{--ccs-shell-offset:2.5rem}");
  });

  it("reserves a thin banner's 0.25rem", () => {
    const { head } = render(ShellBanner, {
      props: { placement: "above-header", thin: true, title: "Staging" },
    });

    expect(head).toContain(":root{--ccs-shell-offset:0.25rem}");
  });

  it("reserves nothing for a content banner or a closed banner", () => {
    expect(
      render(ShellBanner, { props: { placement: "content", title: "A" } }).head,
    ).not.toContain("--ccs-shell-offset");
    expect(
      render(ShellBanner, {
        props: { placement: "above-header", open: false, title: "A" },
      }).head,
    ).not.toContain("--ccs-shell-offset");
  });
});
