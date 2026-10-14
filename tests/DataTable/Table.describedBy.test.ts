import { render, screen } from "@testing-library/svelte";
import TableDescribedBy from "./Table.describedBy.test.svelte";

describe("Table aria-describedby", () => {
  it.each([false, true])(
    "joins a consumer aria-describedby with the container description (stickyHeader: %s)",
    (stickyHeader) => {
      render(TableDescribedBy, { props: { stickyHeader } });

      const table = screen.getByRole("table");
      expect(table).toHaveAccessibleDescription("Orders from the last 30 days");
      expect(table).toHaveAttribute(
        "aria-describedby",
        expect.stringMatching(/^\S+ extra-help$/),
      );
    },
  );
});
