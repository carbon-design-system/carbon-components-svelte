import { render, screen } from "@testing-library/svelte";
import Table from "carbon-components-svelte/DataTable/Table.svelte";

describe("Table aria forwarding (stickyHeader)", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<span id="extra-help">Extra help</span><span id="ext-label">External label</span>',
    );
  });

  afterEach(() => {
    document.getElementById("extra-help")?.remove();
    document.getElementById("ext-label")?.remove();
  });

  it("places naming and description on the table, not the section", () => {
    const { container } = render(Table, {
      props: {
        stickyHeader: true,
        "aria-labelledby": "ext-label",
        "aria-describedby": "extra-help",
        "data-testid": "sticky",
      },
    });

    const table = screen.getByRole("table");
    expect(table).toHaveAccessibleName("External label");
    expect(table).toHaveAccessibleDescription("Extra help");

    const section = container.querySelector("section");
    expect(section).toHaveAttribute("data-testid", "sticky");
    expect(section).not.toHaveAttribute("aria-labelledby");
    expect(section).not.toHaveAttribute("aria-describedby");
  });

  it("names the table from a consumer aria-label", () => {
    const { container } = render(Table, {
      props: { stickyHeader: true, "aria-label": "Custom" },
    });

    expect(screen.getByRole("table")).toHaveAccessibleName("Custom");
    expect(container.querySelector("section")).not.toHaveAttribute(
      "aria-label",
    );
  });

  it("joins a consumer aria-describedby after the built-in id", () => {
    render(Table, {
      props: {
        stickyHeader: true,
        describedBy: "extra-help",
        "aria-describedby": "ext-label",
      },
    });

    expect(screen.getByRole("table")).toHaveAttribute(
      "aria-describedby",
      "extra-help ext-label",
    );
  });
});
