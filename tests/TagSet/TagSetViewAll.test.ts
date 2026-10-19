import { render, screen, waitFor, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TagSetViewAll from "./TagSetViewAll.test.svelte";

const indicator = (count: number) =>
  screen.getByRole("button", { name: `+${count} more tags` });
const popoverOf = (container: HTMLElement) =>
  container.querySelector(".bx--tag-set-overflow .bx--popover") as HTMLElement;
const dialog = () => screen.getByRole("dialog", { name: "All tags" });

async function renderSet(props: Record<string, unknown> = {}) {
  const result = render(TagSetViewAll, { props });
  const count = ((props.count as number | undefined) ?? 15) - 2;
  await waitFor(() => expect(indicator(count)).toBeInTheDocument());
  return result;
}

describe("TagSet overflowType", () => {
  it("lists the hidden labels as text in the popover with overflowType=default", async () => {
    const { container } = await renderSet({
      count: 5,
      overflowType: "default",
    });

    await user.click(indicator(3));
    const popover = popoverOf(container);
    expect(
      within(popover)
        .getAllByRole("listitem")
        .map((li) => li.textContent?.trim()),
    ).toEqual(["region-03", "region-04", "region-05"]);
    expect(popover.querySelector(".bx--tag")).toBeNull();
  });

  it("lists the hidden tags as tags in the popover by default", async () => {
    const { container } = await renderSet({ count: 5 });

    await user.click(indicator(3));
    expect(popoverOf(container).querySelectorAll(".bx--tag")).toHaveLength(3);
  });
});

describe("TagSet View all", () => {
  it("lists the first ten hidden tags, then a View all button", async () => {
    const { container } = await renderSet();
    // Built on the first open, with the tags.
    expect(
      popoverOf(container).querySelector(".bx--tag-set-overflow__view-all"),
    ).toBeNull();

    await user.click(indicator(13));
    const popover = popoverOf(container);
    expect(within(popover).getAllByRole("listitem")).toHaveLength(10);
    expect(
      within(popover).getByRole("button", { name: "View all" }),
    ).toBeInTheDocument();
  });

  it("offers no View all at or under the threshold", async () => {
    const { container } = await renderSet({ count: 12 });

    await user.click(indicator(10));
    expect(
      within(popoverOf(container)).queryByRole("button", { name: "View all" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a modal of every tag with a search that filters them", async () => {
    const { container } = await renderSet();

    await user.click(indicator(13));
    await user.click(
      within(popoverOf(container)).getByRole("button", { name: "View all" }),
    );

    await waitFor(() =>
      expect(dialog().closest(".bx--modal")).toHaveClass("is-visible"),
    );
    const list = within(dialog()).getByRole("list", { name: "All tags" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(15);
    expect(within(dialog()).getByRole("status")).toHaveTextContent("15 tags");

    const search = within(dialog()).getByRole("searchbox");
    await waitFor(() => expect(search).toHaveFocus());
    await user.type(search, "REGION-1");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent?.trim()),
    ).toEqual([
      "region-10",
      "region-11",
      "region-12",
      "region-13",
      "region-14",
      "region-15",
    ]);

    await user.clear(search);
    await user.type(search, "us-east");
    expect(within(list).queryAllByRole("listitem")).toHaveLength(0);
    expect(within(dialog()).getByRole("status")).toHaveTextContent(
      "No matching tags",
    );
  });

  it("returns focus to the +N indicator when the modal closes", async () => {
    const { container } = await renderSet();

    await user.click(indicator(13));
    await user.click(
      within(popoverOf(container)).getByRole("button", { name: "View all" }),
    );
    await waitFor(() =>
      expect(dialog().closest(".bx--modal")).toHaveClass("is-visible"),
    );
    await user.keyboard("{Escape}");

    await waitFor(() => expect(indicator(13)).toHaveFocus());
  });

  it("closes a dismissible tag from the modal", async () => {
    const onTagClose = vi.fn();
    const { container } = await renderSet({ onTagClose });

    await user.click(indicator(13));
    await user.click(
      within(popoverOf(container)).getByRole("button", { name: "View all" }),
    );
    await waitFor(() =>
      expect(dialog().closest(".bx--modal")).toHaveClass("is-visible"),
    );
    await user.click(
      within(dialog()).getByRole("button", { name: /region-07/ }),
    );
    await tick();

    expect(onTagClose).toHaveBeenCalledExactlyOnceWith("region-07");
    await waitFor(() =>
      expect(
        within(dialog()).queryByRole("button", { name: /region-07/ }),
      ).not.toBeInTheDocument(),
    );
  });

  it("opens the modal from a tooltip-mode +N", async () => {
    await renderSet({ overflowMode: "tooltip" });
    await user.click(indicator(13));
    await waitFor(() =>
      expect(dialog().closest(".bx--modal")).toHaveClass("is-visible"),
    );
  });

  it("keeps the modal closed when click:overflow is prevented", async () => {
    await renderSet({ overflowMode: "tooltip", preventOverflowClick: true });
    await user.click(indicator(13));
    await tick();
    expect(dialog().closest(".bx--modal")).not.toHaveClass("is-visible");
  });
});
