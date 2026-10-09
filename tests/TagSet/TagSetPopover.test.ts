import { render, screen, waitFor, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TagSetPopover from "./TagSetPopover.test.svelte";

const indicator = (count: number) =>
  screen.getByRole("button", { name: `+${count} more tags` });
const popoverOf = (container: HTMLElement) =>
  container.querySelector(".bx--tag-set-overflow .bx--popover") as HTMLElement;

async function renderPopover(props: Record<string, unknown> = {}) {
  const result = render(TagSetPopover, { props });
  await waitFor(() => expect(indicator(3)).toBeInTheDocument());
  return result;
}

describe("TagSet overflowMode=popover", () => {
  it("opens a popover of the hidden tags from the +N button", async () => {
    const onOverflowClick = vi.fn();
    const { container } = await renderPopover({ onOverflowClick });

    expect(indicator(3)).toHaveAttribute("aria-expanded", "false");
    await user.click(indicator(3));

    expect(indicator(3)).toHaveAttribute("aria-expanded", "true");
    expect(onOverflowClick).toHaveBeenCalledTimes(1);
    const popover = popoverOf(container);
    expect(popover).toHaveClass("bx--popover--open");
    const labels = within(popover)
      .getAllByRole("listitem")
      .map((li) => li.textContent?.trim());
    expect(labels).toEqual(["Tag 3", "Tag 4", "Tag 5"]);
    expect(popover.querySelector(".bx--tag")).toHaveClass("bx--tag--blue");
  });

  it("closes a hidden tag from the popover and keeps focus there", async () => {
    const onTagClose = vi.fn();
    const { container } = await renderPopover({ onTagClose });

    await user.click(indicator(3));
    const popover = popoverOf(container);
    within(popover).getByRole("button", { name: /Tag 4/ }).focus();
    await user.keyboard("{Enter}");
    await tick();

    expect(onTagClose).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        index: 3,
        tag: expect.objectContaining({ value: "Tag 4" }),
      }),
    );
    await waitFor(() => {
      expect(
        within(popoverOf(container)).getByRole("button", { name: /Tag 5/ }),
      ).toHaveFocus();
    });
  });

  it("moves focus to the last visible tag after closing the only hidden one", async () => {
    const { container } = render(TagSetPopover, {
      props: { labels: ["Tag 1", "Tag 2", "Tag 3"] },
    });
    await waitFor(() => expect(indicator(1)).toBeInTheDocument());

    await user.click(indicator(1));
    within(popoverOf(container)).getByRole("button", { name: /Tag 3/ }).focus();
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(
        screen.getByText("Tag 2").closest(".bx--tag")?.querySelector("button"),
      ).toHaveFocus();
    });
  });

  it("renders the overflowTooltip slot in the popover", async () => {
    const { container } = render(TagSetPopover, { props: { custom: true } });
    await waitFor(() => expect(indicator(3)).toBeInTheDocument());

    await user.click(indicator(3));

    expect(
      within(popoverOf(container)).getByRole("link", { name: "View all 3" }),
    ).toBeInTheDocument();
    expect(popoverOf(container).querySelector("ul")).toBeNull();
  });

  it("closes with Escape and returns focus to the +N button", async () => {
    await renderPopover();

    await user.click(indicator(3));
    await user.keyboard("{Tab}");
    await user.keyboard("{Escape}");

    expect(indicator(3)).toHaveAttribute("aria-expanded", "false");
    expect(indicator(3)).toHaveFocus();
  });
});
