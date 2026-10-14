import { render, screen } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

const headers = [{ key: "name", value: "Name" }];
const rows = [{ id: "a", name: "api-gateway" }];

describe.each([{ stickyHeader: false }, { stickyHeader: true }])(
  "DataTable aria forwarding (stickyHeader: $stickyHeader)",
  ({ stickyHeader }) => {
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

    it("joins a consumer aria-describedby after the description on the table", () => {
      const { container } = render(DataTable, {
        props: {
          headers,
          rows,
          stickyHeader,
          title: "Services",
          description: "All services",
          "aria-describedby": "extra-help",
        },
      });

      const table = screen.getByRole("table");
      expect(table).toHaveAttribute(
        "aria-describedby",
        expect.stringMatching(/^\S+ extra-help$/),
      );
      expect(table).toHaveAccessibleDescription("All services Extra help");
      expect(table).toHaveAccessibleName("Services");
      expect(
        container.querySelector(".bx--data-table-container"),
      ).not.toHaveAttribute("aria-describedby");
      expect(
        container.querySelector("[aria-describedby]:not(table)"),
      ).toBeNull();
    });

    it("names the table from a consumer aria-labelledby", () => {
      const { container } = render(DataTable, {
        props: {
          headers,
          rows,
          stickyHeader,
          title: "Services",
          "aria-labelledby": "ext-label",
        },
      });

      expect(screen.getByRole("table")).toHaveAccessibleName("External label");
      expect(
        container.querySelector(".bx--data-table-container"),
      ).not.toHaveAttribute("aria-labelledby");
    });

    it("names the table from a consumer aria-label", () => {
      const { container } = render(DataTable, {
        props: {
          headers,
          rows,
          stickyHeader,
          title: "Services",
          "aria-label": "Custom",
        },
      });

      const table = screen.getByRole("table");
      expect(table).toHaveAccessibleName("Custom");
      expect(table).not.toHaveAttribute("aria-labelledby");
      expect(
        container.querySelector(".bx--data-table-container"),
      ).not.toHaveAttribute("aria-label");
    });
  },
);
