import { render, screen, within } from "@testing-library/svelte";
import type { QueryGroup } from "../../src/QueryBuilder/QueryBuilder.svelte";
import { user } from "../utils/user";
import QueryBuilder from "./QueryBuilder.test.svelte";

function bound() {
  return JSON.parse(screen.getByTestId("bound").textContent ?? "{}");
}

const nameRow = {
  field: "name",
  operator: "contains",
  value: "Acme",
};

describe("QueryBuilder", () => {
  it("labels the root group and describes each condition by its sentence", () => {
    render(QueryBuilder, {
      props: {
        value: {
          operator: "and",
          conditions: [nameRow, { field: "seats", operator: "gte", value: 5 }],
        },
      },
    });

    expect(screen.getByRole("group", { name: "Filter" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", {
        name: "Condition 1 of 2: Where Name contains “Acme”",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", {
        name: "Condition 2 of 2: and Seats is at least 5",
      }),
    ).toBeInTheDocument();
  });

  it("leaves the bound value alone on mount and adds ids with the first edit", async () => {
    const onchange = vi.fn();
    render(QueryBuilder, {
      props: { value: { operator: "or", conditions: [nameRow] }, onchange },
    });

    const button = screen.getByRole("button", { name: "Remove condition 1" });
    expect(button.id).toMatch(/^qb-n\d+-remove$/);
    expect(
      JSON.parse(screen.getByTestId("bound-ids").textContent ?? ""),
    ).toEqual({ operator: "or", conditions: [nameRow] });
    expect(onchange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Add condition" }));

    const edited = JSON.parse(
      screen.getByTestId("bound-ids").textContent ?? "",
    );
    expect(edited.id).toEqual(expect.any(String));
    expect(edited.conditions.map((node: { id: string }) => node.id)).toEqual([
      expect.any(String),
      expect.any(String),
    ]);
  });

  it("builds inner ids from keys, so any node id keeps its references", async () => {
    render(QueryBuilder, {
      props: {
        showErrors: true,
        value: {
          operator: "and",
          conditions: [
            { ...nameRow, id: "rule 1", value: "" },
            { ...nameRow, id: 'a"b' },
            { ...nameRow, id: "c" },
          ],
        },
      },
    });

    const input = screen.getAllByRole("textbox", { name: "Value" })[0];
    expect(input.id).toMatch(/^qb-n\d+-value$/);
    const message = input.getAttribute("aria-errormessage") ?? "";
    expect(message).not.toContain(" ");
    expect(document.getElementById(message)).toHaveTextContent("Enter a value");

    // The focus step after a remove looks the neighbor up by its id.
    await user.click(
      screen.getByRole("button", { name: "Remove condition 3" }),
    );
    const fields = screen.getAllByRole("combobox", { name: "Field" });
    expect(fields).toHaveLength(2);
    expect(fields[1]).toHaveFocus();
  });

  it("adds a condition with the first field, focuses it, and fires change", async () => {
    const onchange = vi.fn();
    render(QueryBuilder, { props: { onchange } });

    await user.click(screen.getByRole("button", { name: "Add condition" }));

    expect(bound().conditions).toEqual([
      { field: "name", operator: "is", value: "" },
    ]);
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0].conditions).toHaveLength(1);
    expect(screen.getByRole("combobox", { name: "Field" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Condition added");
  });

  it("resets the operator and value when the field changes kind", async () => {
    render(QueryBuilder, {
      props: { value: { operator: "and", conditions: [nameRow] } },
    });

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Field" }),
      "seats",
    );

    expect(bound().conditions[0]).toEqual({
      field: "seats",
      operator: "eq",
      value: null,
    });
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("keeps the value when the field changes within a kind", async () => {
    render(QueryBuilder, {
      props: {
        value: {
          operator: "and",
          conditions: [
            { field: "name", operator: "startsWith", value: "Acme" },
          ],
        },
      },
    });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Field" }),
      "seats",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Field" }),
      "name",
    );

    expect(bound().conditions[0].operator).toBe("is");
  });

  it("carries a value across operators of the same shape and reshapes it otherwise", async () => {
    render(QueryBuilder, {
      props: {
        value: {
          operator: "and",
          conditions: [{ field: "seats", operator: "gt", value: 7 }],
        },
      },
    });
    const operator = screen.getByRole("combobox", { name: "Operator" });

    await user.selectOptions(operator, "lte");
    expect(bound().conditions[0].value).toBe(7);

    await user.selectOptions(operator, "between");
    expect(bound().conditions[0].value).toEqual([null, null]);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);

    await user.selectOptions(operator, "isEmpty");
    expect(bound().conditions[0].value).toBeNull();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("edits the value of each kind", async () => {
    render(QueryBuilder, {
      props: {
        value: {
          operator: "and",
          conditions: [
            nameRow,
            { field: "active", operator: "is", value: true },
          ],
        },
      },
    });

    const text = screen.getByRole("textbox", { name: "Value" });
    await user.clear(text);
    await user.type(text, "Globex");
    expect(bound().conditions[0].value).toBe("Globex");

    await user.click(screen.getByRole("switch", { name: "Value" }));
    expect(bound().conditions[1].value).toBe(false);
  });

  it("writes the connector at the start of each row in sentence case", () => {
    const { container } = render(QueryBuilder, {
      props: {
        value: {
          operator: "or",
          conditions: [nameRow, { field: "seats", operator: "gte", value: 5 }],
        },
      },
    });

    const connectors = [
      ...container.querySelectorAll(".bx--query-builder__connector"),
    ].map((connector) => connector.textContent?.trim());
    expect(connectors).toEqual(["Match", "Where", "Or"]);
    // The name keeps the word inside its sentence.
    expect(
      screen.getByRole("group", {
        name: "Condition 2 of 2: or Seats is at least 5",
      }),
    ).toBeInTheDocument();
  });

  it("shows a field's only operator in a read-only select", () => {
    render(QueryBuilder, {
      props: {
        value: {
          operator: "and",
          conditions: [{ field: "active", operator: "is", value: true }],
        },
      },
    });

    const operator = screen.getByRole("combobox", { name: "Operator" });
    expect(operator).toHaveAttribute("aria-readonly", "true");
    expect(operator).toHaveDisplayValue("is");
  });

  it("reorders a row and keeps focus on the pressed button at the end", async () => {
    render(QueryBuilder, {
      props: {
        value: {
          operator: "and",
          conditions: [nameRow, { field: "seats", operator: "gte", value: 5 }],
        },
      },
    });

    await user.click(
      screen.getByRole("button", { name: "Move condition 1 down" }),
    );

    expect(bound().conditions.map((c: { field: string }) => c.field)).toEqual([
      "seats",
      "name",
    ]);
    // At the end the button cannot act, but it stays focusable.
    const down = screen.getByRole("button", { name: "Move condition 2 down" });
    expect(down).toHaveFocus();
    expect(down).toHaveAttribute("aria-disabled", "true");
    expect(down).not.toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Condition moved to position 2 of 2",
    );

    await user.click(down);
    expect(bound().conditions.map((c: { field: string }) => c.field)).toEqual([
      "seats",
      "name",
    ]);
  });

  it("gives each row's actions one tab stop in a toolbar", () => {
    render(QueryBuilder, {
      props: {
        value: {
          operator: "and",
          conditions: [nameRow, { field: "seats", operator: "gte", value: 5 }],
        },
      },
    });

    const [first, second] = screen.getAllByRole("toolbar");
    expect(first).toHaveAccessibleName("Condition 1 actions");
    const tabStops = (toolbar: HTMLElement) =>
      within(toolbar)
        .getAllByRole("button")
        .filter((button) => button.tabIndex === 0);
    // The first row cannot move up, so its stop starts on "down".
    expect(tabStops(first)).toEqual([
      within(first).getByRole("button", { name: "Move condition 1 down" }),
    ]);
    expect(tabStops(second)).toEqual([
      within(second).getByRole("button", { name: "Move condition 2 up" }),
    ]);
  });

  it("removes a row and focuses the next one, or the add button when none is left", async () => {
    render(QueryBuilder, {
      props: {
        value: {
          operator: "and",
          conditions: [nameRow, { field: "seats", operator: "gte", value: 5 }],
        },
      },
    });

    await user.click(
      screen.getByRole("button", { name: "Remove condition 1" }),
    );
    expect(bound().conditions).toHaveLength(1);
    expect(screen.getByRole("combobox", { name: "Field" })).toHaveFocus();

    await user.click(
      screen.getByRole("button", { name: "Remove condition 1" }),
    );
    expect(screen.getByRole("button", { name: "Add condition" })).toHaveFocus();
    expect(screen.getByText("No conditions yet.")).toBeInTheDocument();
  });

  it("dispatches cancelable move and remove events before the change", async () => {
    const onchange = vi.fn();
    const onmove = vi.fn((event: CustomEvent) => event.preventDefault());
    const onremove = vi.fn((event: CustomEvent) => event.preventDefault());
    const seatsRow = { id: "s", field: "seats", operator: "gte", value: 5 };
    render(QueryBuilder, {
      props: {
        value: {
          operator: "and",
          conditions: [{ ...nameRow, id: "n" }, seatsRow],
        },
        onchange,
        onmove,
        onremove,
      },
    });

    await user.click(
      screen.getByRole("button", { name: "Move condition 1 down" }),
    );
    expect(onmove).toHaveBeenCalledTimes(1);
    expect(onmove.mock.calls[0][0].detail).toEqual({
      id: "n",
      item: { ...nameRow, id: "n" },
      from: 0,
      to: 1,
    });

    await user.click(
      screen.getByRole("button", { name: "Remove condition 2" }),
    );
    expect(onremove).toHaveBeenCalledTimes(1);
    expect(onremove.mock.calls[0][0].detail).toEqual({
      id: "s",
      item: seatsRow,
    });

    expect(onchange).not.toHaveBeenCalled();
    expect(bound().conditions.map((c: { field: string }) => c.field)).toEqual([
      "name",
      "seats",
    ]);
  });

  it("adds a group seeded with a condition, and stops offering groups at maxDepth", async () => {
    render(QueryBuilder, { props: { maxDepth: 2 } });

    await user.click(screen.getByRole("button", { name: "Add group" }));

    expect(bound().conditions[0].operator).toBe("and");
    expect(bound().conditions[0].conditions).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Add group" })).toHaveLength(
      1,
    );
    expect(
      screen.getAllByRole("button", { name: "Add condition" }),
    ).toHaveLength(2);
  });

  it("switches a group between all and any", async () => {
    render(QueryBuilder);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Match" }),
      "or",
    );

    expect(bound().operator).toBe("or");
  });

  it("shows an error once the value is left, and at once with showErrors", async () => {
    const value: QueryGroup = {
      operator: "and",
      conditions: [{ field: "name", operator: "contains", value: "" }],
    };
    const { unmount } = render(QueryBuilder, { props: { value } });
    const input = screen.getByRole("textbox", { name: "Value" });
    expect(input).not.toHaveAttribute("aria-invalid", "true");

    await user.click(input);
    await user.tab();

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a value")).toBeInTheDocument();
    unmount();

    render(QueryBuilder, { props: { value, showErrors: true } });
    expect(screen.getByRole("textbox", { name: "Value" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("flags an unknown field and offers a choice", () => {
    render(QueryBuilder, {
      props: {
        showErrors: true,
        value: {
          operator: "and",
          conditions: [{ field: "gone", operator: "is", value: "x" }],
        },
      },
    });

    expect(screen.getByRole("combobox", { name: "Field" })).toHaveValue("");
    expect(
      screen.getByText("Choose a field", { selector: "option" }),
    ).toBeInTheDocument();
  });

  it("reads the query as a sentence", () => {
    render(QueryBuilder, {
      props: {
        showSummary: true,
        value: {
          operator: "and",
          conditions: [
            nameRow,
            {
              operator: "or",
              conditions: [
                { field: "seats", operator: "gte", value: 5 },
                { field: "plan", operator: "isAnyOf", value: ["team", "free"] },
              ],
            },
          ],
        },
      },
    });

    expect(
      screen.getByText(
        "Where Name contains “Acme” and (Seats is at least 5 or Plan is any of Team, Free)",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Filter" })).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("qb-summary"),
    );
  });

  it("takes every string from translateWithId", () => {
    render(QueryBuilder, {
      props: {
        translateWithId: (id: string) => `[${id}]`,
        value: { operator: "and", conditions: [nameRow] },
      },
    });

    expect(
      screen.getByRole("button", { name: "[addCondition]" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "[conditionLabel]" })).getByRole(
        "combobox",
        { name: "[operator]" },
      ),
    ).toBeInTheDocument();
  });

  it("keeps the English default for an id translateWithId leaves out", () => {
    render(QueryBuilder, {
      props: {
        translateWithId: (id: string) =>
          id === "addCondition" ? "Agregar condición" : undefined,
        value: { operator: "and", conditions: [nameRow] },
      },
    });

    expect(
      screen.getByRole("button", { name: "Agregar condición" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add group" }),
    ).toBeInTheDocument();
  });

  it("shows and announces invalidText in place of the helper text", () => {
    render(QueryBuilder, {
      props: {
        value: { operator: "and", conditions: [nameRow] },
        helperText: "Match accounts by any field.",
        invalid: true,
        invalidText: "Add a condition on the plan.",
      },
    });

    const message = screen.getByRole("alert");
    expect(message).toHaveTextContent("Add a condition on the plan.");
    expect(message).toHaveClass(
      "bx--form-requirement",
      "bx--form-requirement--invalid",
    );
    expect(screen.queryByText("Match accounts by any field.")).toBeNull();
    expect(screen.getByRole("group", { name: "Filter" })).toHaveAttribute(
      "aria-describedby",
      message.id,
    );
  });

  it("offers no editing when read only, and no controls when disabled", () => {
    const value: QueryGroup = { operator: "and", conditions: [nameRow] };
    const { unmount } = render(QueryBuilder, {
      props: { value, readonly: true },
    });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    unmount();

    render(QueryBuilder, { props: { value, disabled: true } });
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByRole("textbox", { name: "Value" })).toBeDisabled();
  });
});
