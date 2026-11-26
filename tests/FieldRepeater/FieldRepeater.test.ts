import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import FieldRepeater from "./FieldRepeater.test.svelte";

const value = () => JSON.parse(screen.getByTestId("value").textContent ?? "[]");
const addButton = () => screen.getByRole("button", { name: /^Add another/ });
const status = () => document.getElementById("emails-status") as HTMLElement;
const emailBox = (n: number) =>
  screen.getByRole("textbox", { name: `Email ${n}` });

describe("FieldRepeater", () => {
  it("names each item's group and field by its number", () => {
    render(FieldRepeater);

    const group = screen.getByRole("group", { name: "Email 2" });
    expect(within(group).getByRole("textbox")).toHaveValue("grace@example.com");
    expect(emailBox(1)).toHaveValue("ada@example.com");
    expect(screen.getByRole("group", { name: "Emails" })).toBeInTheDocument();
  });

  it("names the buttons by item and keeps the native form names", () => {
    render(FieldRepeater);

    expect(
      screen.getByRole("button", { name: "Remove email 2" }),
    ).toBeInTheDocument();
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.getAll("emails[0]")).toEqual(["ada@example.com"]);
    expect(data.getAll("emails[1]")).toEqual(["grace@example.com"]);
  });

  it("writes edits back to the bound items", async () => {
    render(FieldRepeater, { objects: true, items: [{ email: "a@x.com" }] });

    await user.type(emailBox(1), "b");

    expect(value()).toEqual([{ email: "a@x.comb" }]);
  });

  it("adds an item, focuses its field and announces it", async () => {
    const onAdd = vi.fn();
    const onChange = vi.fn();
    render(FieldRepeater, { onAdd, onChange });

    await user.click(addButton());

    expect(value()).toEqual(["ada@example.com", "grace@example.com", ""]);
    expect(emailBox(3)).toHaveFocus();
    expect(status()).toHaveTextContent("Email 3 added");
    expect(onAdd).toHaveBeenCalledWith({ index: 2, item: "" });
    expect(onChange).toHaveBeenCalledWith([
      "ada@example.com",
      "grace@example.com",
      "",
    ]);
  });

  it("moves focus to the next item's field after a removal", async () => {
    render(FieldRepeater, { items: ["a", "b", "c"] });

    await user.click(screen.getByRole("button", { name: "Remove email 2" }));

    expect(value()).toEqual(["a", "c"]);
    expect(emailBox(2)).toHaveValue("c");
    expect(emailBox(2)).toHaveFocus();
    expect(status()).toHaveTextContent("Email 2 removed");
  });

  it("falls back to the previous item when the last is removed", async () => {
    render(FieldRepeater, { items: ["a", "b"] });

    await user.click(screen.getByRole("button", { name: "Remove email 2" }));

    expect(emailBox(1)).toHaveFocus();
  });

  it("falls back to the Add button when the only item is removed", async () => {
    render(FieldRepeater, { items: ["a"] });

    await user.click(screen.getByRole("button", { name: "Remove email 1" }));

    expect(value()).toEqual([]);
    expect(addButton()).toHaveFocus();
    expect(screen.getByText("Nothing added yet")).toBeInTheDocument();
  });

  it("does not take focus when it was not in the removed item", async () => {
    const { component } = render(FieldRepeater, { items: ["a", "b"] });
    const elsewhere = document.createElement("button");
    document.body.append(elsewhere);
    elsewhere.focus();

    await component.removeAt(0);
    await tick();

    expect(elsewhere).toHaveFocus();
    elsewhere.remove();
  });

  it("keeps an item when a remove listener cancels", async () => {
    render(FieldRepeater, { cancelRemove: true });

    await user.click(screen.getByRole("button", { name: "Remove email 1" }));

    expect(value()).toHaveLength(2);
  });

  it("fills the list up to min and disables Remove at it", () => {
    render(FieldRepeater, { items: [], config: { min: 2 } });

    expect(value()).toEqual(["", ""]);
    for (const button of screen.getAllByRole("button", { name: /^Remove/ })) {
      expect(button).toBeDisabled();
    }
  });

  it("says when min is reached by a removal", async () => {
    render(FieldRepeater, { items: ["a", "b"], config: { min: 1 } });
    expect(screen.queryByText("Minimum of 1 reached")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Remove email 1" }));

    expect(screen.getByText("Minimum of 1 reached")).toBeInTheDocument();
    expect(status()).toHaveTextContent("Email 1 removed. Minimum of 1 reached");
  });

  it("disables Add and says so at max", async () => {
    render(FieldRepeater, { items: ["a"], config: { max: 2 } });

    await user.click(addButton());

    expect(addButton()).toBeDisabled();
    expect(screen.getByText("Maximum of 2 reached")).toBeInTheDocument();
    expect(status()).toHaveTextContent("Email 2 added. Maximum of 2 reached");
    expect(emailBox(2)).toHaveFocus();
  });

  describe("reorder", () => {
    const config = { reorderable: true };

    it("moves an item down, with its text, and keeps focus on the button", async () => {
      const onMove = vi.fn();
      render(FieldRepeater, { items: ["a", "b", "c"], config, onMove });
      await user.type(emailBox(1), "!");

      await user.click(
        screen.getByRole("button", { name: "Move email 1 down" }),
      );

      expect(value()).toEqual(["b", "a!", "c"]);
      expect(emailBox(2)).toHaveValue("a!");
      expect(
        screen.getByRole("button", { name: "Move email 2 down" }),
      ).toHaveFocus();
      expect(status()).toHaveTextContent("Email 1 moved to position 2 of 3");
      expect(onMove).toHaveBeenCalledWith({ from: 0, to: 1, item: "a!" });
    });

    it("reorders from the keyboard and keeps focus at the end of the list", async () => {
      render(FieldRepeater, { items: ["a", "b", "c"], config });
      screen.getByRole("button", { name: "Move email 2 down" }).focus();

      await user.keyboard("{Enter}");
      expect(value()).toEqual(["a", "c", "b"]);
      const down = screen.getByRole("button", { name: "Move email 3 down" });
      expect(down).toHaveFocus();
      expect(down).toHaveAttribute("aria-disabled", "true");

      await user.keyboard("{Enter}");
      expect(value()).toEqual(["a", "c", "b"]);
      expect(down).toHaveFocus();
    });

    it("leaves the first item's Move up inert but focusable", async () => {
      render(FieldRepeater, { items: ["a", "b"], config });
      const up = screen.getByRole("button", { name: "Move email 1 up" });

      expect(up).toHaveAttribute("aria-disabled", "true");
      expect(up).not.toBeDisabled();
      await user.click(up);
      expect(value()).toEqual(["a", "b"]);
    });

    it("moves the same field element", async () => {
      render(FieldRepeater, { items: ["a", "b"], config });
      const first = emailBox(1);

      await user.click(
        screen.getByRole("button", { name: "Move email 1 down" }),
      );

      expect(emailBox(2)).toBe(first);
    });
  });

  it("keeps a row's field with its item when the app reorders and sets itemKey", async () => {
    const items = [
      { id: "a", email: "a" },
      { id: "b", email: "b" },
    ];
    const { component } = render(FieldRepeater, {
      objects: true,
      items,
      config: { itemKey: (item: { id: string }) => item.id },
    });
    const first = emailBox(1);

    component.setItems([items[1], items[0]]);
    await tick();

    expect(emailBox(2)).toBe(first);
  });

  it("shows the empty slot text and no list", () => {
    render(FieldRepeater, { items: [], config: { emptyText: "No addresses" } });

    expect(screen.getByText("No addresses")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("collapses items to a summary and opens one to edit", async () => {
    render(FieldRepeater, {
      items: ["ada@example.com"],
      config: { summaryText: (item: string) => `Sends to ${item}` },
    });

    expect(screen.getByText("Sends to ada@example.com")).toBeInTheDocument();
    // Collapsed fields stay in the page, so the form still posts them.
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("emails[0]")).toBe("ada@example.com");

    await user.click(screen.getByRole("button", { name: "Edit email 1" }));
    expect(emailBox(1)).toBeVisible();
    expect(emailBox(1)).toHaveFocus();
    expect(screen.queryByText("Sends to ada@example.com")).toBeNull();
  });

  it("opens a new item for editing in summary mode", async () => {
    render(FieldRepeater, {
      items: ["a"],
      config: { summaryText: (item: string) => `Sends to ${item}` },
    });

    await user.click(addButton());

    expect(emailBox(2)).toBeVisible();
    expect(emailBox(2)).toHaveFocus();
  });

  it("disables every control when disabled", () => {
    render(FieldRepeater, { config: { disabled: true, reorderable: true } });

    expect(screen.getByRole("group", { name: "Emails" })).toBeDisabled();
    expect(emailBox(1)).toBeDisabled();
  });

  it("stays consistent through 50 rapid adds and removals", async () => {
    render(FieldRepeater, { items: [] });

    for (let i = 0; i < 50; i++) {
      // eslint-disable-next-line no-await-in-loop -- each press follows the focus move of the last
      await user.click(addButton());
    }
    expect(screen.getAllByRole("textbox")).toHaveLength(50);
    expect(emailBox(50)).toHaveFocus();

    for (let i = 0; i < 49; i++) {
      // eslint-disable-next-line no-await-in-loop -- each press follows the focus move of the last
      await user.click(screen.getByRole("button", { name: "Remove email 1" }));
    }
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(value()).toEqual([""]);
    expect(emailBox(1)).toHaveFocus();
  }, 30000);
});
