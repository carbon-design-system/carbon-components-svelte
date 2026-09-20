import { render, screen, within } from "@testing-library/svelte";
import Breadcrumb from "./Breadcrumb.test.svelte";
import BreadcrumbSeparator from "./Breadcrumb.separator.test.svelte";
import BreadcrumbSeparatorNoTrailingSlash from "./Breadcrumb.separator.noTrailingSlash.test.svelte";

describe("Breadcrumb separator", () => {
  it("defaults to a slash, unchanged from today's behavior", () => {
    render(Breadcrumb);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const list = within(nav).getByRole("list");
    expect(list.style.getPropertyValue("--ccs-separator")).toBe("'/'");
  });

  it("reflects a custom separator as the quoted custom property", () => {
    render(BreadcrumbSeparator);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const list = within(nav).getByRole("list");
    expect(list.style.getPropertyValue("--ccs-separator")).toBe("'→'");
  });

  it("still suppresses the trailing separator with noTrailingSlash", () => {
    render(BreadcrumbSeparatorNoTrailingSlash);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const list = within(nav).getByRole("list");
    expect(list).toHaveClass("bx--breadcrumb--no-trailing-slash");
    expect(list.style.getPropertyValue("--ccs-separator")).toBe("'→'");
  });
});
