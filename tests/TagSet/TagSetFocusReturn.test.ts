import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TagSetFocusReturn from "./TagSetFocusReturn.test.svelte";

function closeButtonOf(label: string) {
  const tag = screen.getByText(label).closest(".bx--tag") as HTMLElement;
  return within(tag).getByTitle("Clear filter");
}

describe("TagSet focus after closing a tag", () => {
  it("moves focus to the next tag's close button", async () => {
    render(TagSetFocusReturn);

    closeButtonOf("Tag 2").focus();
    await user.keyboard("{Enter}");
    await tick();

    expect(screen.queryByText("Tag 2")).not.toBeInTheDocument();
    expect(closeButtonOf("Tag 3")).toHaveFocus();
  });

  it("falls back to the previous tag when closing the last one", async () => {
    render(TagSetFocusReturn);

    closeButtonOf("Tag 3").focus();
    await user.keyboard("{Enter}");
    await tick();

    expect(closeButtonOf("Tag 2")).toHaveFocus();
  });

  it("leaves focus where a close:tag handler moved it", async () => {
    render(TagSetFocusReturn, { props: { moveFocusOnClose: true } });

    closeButtonOf("Tag 2").focus();
    await user.keyboard("{Enter}");
    await tick();

    expect(screen.getByRole("textbox", { name: "Elsewhere" })).toHaveFocus();
  });
});
