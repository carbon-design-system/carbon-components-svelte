import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import MultiSelectTags from "./MultiSelectTags.test.svelte";

const removeButton = (label: string) =>
  screen.getByRole("button", { name: `Remove ${label}` });
const selected = () =>
  JSON.parse(screen.getByTestId("selected").textContent ?? "[]");
const tagLabels = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll(".bx--multi-select__tags .bx--tag__label"),
  ).map((el) => el.textContent?.trim());

describe("MultiSelect selectionDisplay=tags", () => {
  it("lists each selected item as a tag in items order", () => {
    const { container } = render(MultiSelectTags, {
      selectedIds: ["c", "a"],
    });

    expect(tagLabels(container)).toEqual(["Alpha", "Gamma"]);
  });

  it("renders no tags by default", () => {
    const { container } = render(MultiSelectTags, {
      config: { selectionDisplay: "count" },
    });

    expect(container.querySelector(".bx--multi-select__tags")).toBeNull();
  });

  it("deselects an item from its tag like unchecking its option", async () => {
    const onSelect = vi.fn();
    const { container } = render(MultiSelectTags, { onSelect });

    await user.click(removeButton("Alpha"));

    expect(selected()).toEqual(["c"]);
    expect(tagLabels(container)).toEqual(["Gamma"]);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ selectedIds: ["c"] }),
    );
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.getAll("letters")).toEqual(["c"]);
  });

  it("adds a tag when an option is checked", async () => {
    const { container } = render(MultiSelectTags);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Beta"));

    expect(tagLabels(container)).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("is one tab stop and removes the focused tag with Delete", async () => {
    render(MultiSelectTags);

    await waitFor(() => {
      expect(removeButton("Alpha")).toHaveAttribute("tabindex", "0");
    });
    expect(removeButton("Gamma")).toHaveAttribute("tabindex", "-1");

    removeButton("Alpha").focus();
    await user.keyboard("{ArrowRight}");
    expect(removeButton("Gamma")).toHaveFocus();

    await user.keyboard("{Delete}");
    await tick();
    expect(selected()).toEqual(["a"]);
    expect(removeButton("Alpha")).toHaveFocus();
  });

  it("returns focus to the field after removing the last tag", async () => {
    render(MultiSelectTags, { selectedIds: ["a"] });

    removeButton("Alpha").focus();
    await user.keyboard("{Delete}");
    await tick();
    await tick();

    expect(selected()).toEqual([]);
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("shows a disabled selected item as a tag that can't be removed", () => {
    render(MultiSelectTags, { selectedIds: ["a", "d"] });

    expect(removeButton("Delta")).toBeDisabled();
    expect(removeButton("Alpha")).toBeEnabled();
  });

  it("shows read-only tags without remove buttons", () => {
    render(MultiSelectTags, { config: { readonly: true } });

    expect(
      screen.getByText("Alpha", { selector: ".bx--tag__label" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Alpha" }),
    ).not.toBeInTheDocument();
  });

  it("colors tags with tagProps", () => {
    render(MultiSelectTags, {
      config: { tagProps: () => ({ type: "blue" as const }) },
    });

    expect(removeButton("Alpha").closest(".bx--tag")).toHaveClass(
      "bx--tag--blue",
    );
  });

  it("keeps one row with tagOverflow=collapse", () => {
    const { container } = render(MultiSelectTags, {
      config: { tagOverflow: "collapse" },
    });

    expect(
      container.querySelector(".bx--multi-select__tags .bx--stack"),
    ).not.toHaveClass("bx--stack-wrap");
  });

  it.each(["top", "fixed", "top-after-reopen"] as const)(
    "deselects from a tag with selectionFeedback=%s",
    async (selectionFeedback) => {
      const onSelect = vi.fn();
      render(MultiSelectTags, { config: { selectionFeedback }, onSelect });

      await user.click(removeButton("Gamma"));

      expect(selected()).toEqual(["a"]);
      expect(onSelect).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole("combobox"));
      expect(screen.getByRole("option", { name: "Gamma" })).toHaveAttribute(
        "aria-selected",
        "false",
      );
    },
  );
});
