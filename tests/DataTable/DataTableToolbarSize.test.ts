import { render } from "@testing-library/svelte";
import DataTableToolbarSize from "./DataTableToolbarSize.test.svelte";

describe("DataTable Toolbar size inheritance", () => {
  const toolbar = (container: HTMLElement) =>
    container.querySelector(".bx--table-toolbar");

  it("inherits the small toolbar from a short DataTable", () => {
    const { container } = render(DataTableToolbarSize, {
      props: { tableSize: "short" },
    });

    expect(toolbar(container)).toHaveClass("bx--table-toolbar--small");
    expect(toolbar(container)).not.toHaveClass("bx--table-toolbar--normal");
  });

  it("inherits the extra small toolbar from a compact DataTable", () => {
    const { container } = render(DataTableToolbarSize, {
      props: { tableSize: "compact" },
    });

    expect(toolbar(container)).toHaveClass("bx--table-toolbar--xs");
    expect(toolbar(container)).not.toHaveClass("bx--table-toolbar--small");
  });

  it("inherits the default toolbar from medium/tall/unset DataTable sizes", () => {
    for (const tableSize of [undefined, "medium", "tall"] as const) {
      const { container } = render(DataTableToolbarSize, {
        props: { tableSize },
      });

      expect(toolbar(container)).toHaveClass("bx--table-toolbar--normal");
      expect(toolbar(container)).not.toHaveClass("bx--table-toolbar--small");
    }
  });

  it("lets an explicit toolbar size override the inherited size", () => {
    const { container } = render(DataTableToolbarSize, {
      props: { tableSize: "tall", toolbarSize: "sm" },
    });

    expect(toolbar(container)).toHaveClass("bx--table-toolbar--small");

    const { container: container2 } = render(DataTableToolbarSize, {
      props: { tableSize: "short", toolbarSize: "default" },
    });

    expect(toolbar(container2)).toHaveClass("bx--table-toolbar--normal");
    expect(toolbar(container2)).not.toHaveClass("bx--table-toolbar--small");
  });

  it("defaults to the normal toolbar when used standalone", () => {
    const { container } = render(DataTableToolbarSize, {
      props: { standalone: true },
    });

    expect(toolbar(container)).toHaveClass("bx--table-toolbar--normal");
    expect(toolbar(container)).not.toHaveClass("bx--table-toolbar--small");
  });
});
