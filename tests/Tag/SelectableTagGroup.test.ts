import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import SelectableTagGroup from "./SelectableTagGroup.test.svelte";

const tag = (name: string) => screen.getByRole("button", { name });
const selected = () =>
  JSON.parse(screen.getByTestId("selected").textContent ?? "[]");

describe("SelectableTagGroup", () => {
  it("names the group from its legend", () => {
    render(SelectableTagGroup);

    expect(screen.getByRole("toolbar", { name: "Status" })).toBeInTheDocument();
  });

  it("selects several tags in multiple mode and reports the array once per click", async () => {
    const onChange = vi.fn();
    render(SelectableTagGroup, { props: { onChange } });

    await user.click(tag("Open"));
    await user.click(tag("Closed"));

    expect(tag("Open")).toHaveAttribute("aria-pressed", "true");
    expect(tag("Closed")).toHaveAttribute("aria-pressed", "true");
    expect(selected()).toEqual(["open", "closed"]);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(["open", "closed"]);

    await user.click(tag("Open"));
    expect(selected()).toEqual(["closed"]);
  });

  it("dispatches change inside the click, not after a tick", () => {
    const onChange = vi.fn();
    render(SelectableTagGroup, { props: { onChange } });

    tag("Open").click();

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not dispatch change on mount or when selected is set from outside", async () => {
    const onChange = vi.fn();
    const { component } = render(SelectableTagGroup, {
      props: { onChange, selected: ["open"] },
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(tag("Open")).toHaveAttribute("aria-pressed", "true");

    component.selected = ["closed"];
    await tick();

    expect(tag("Closed")).toHaveAttribute("aria-pressed", "true");
    expect(tag("Open")).toHaveAttribute("aria-pressed", "false");
    expect(onChange).not.toHaveBeenCalled();
  });

  describe("single mode", () => {
    it("replaces the selected tag, and clears it when selected again", async () => {
      render(SelectableTagGroup, {
        props: { selectionMode: "single", selected: ["open"] },
      });

      await user.click(tag("Closed"));
      expect(selected()).toEqual(["closed"]);
      expect(tag("Open")).toHaveAttribute("aria-pressed", "false");

      await user.click(tag("Closed"));
      expect(selected()).toEqual([]);
    });

    it("keeps the selected tag with `required`, and does not report a change", async () => {
      const onChange = vi.fn();
      render(SelectableTagGroup, {
        props: {
          selectionMode: "single",
          required: true,
          selected: ["open"],
          onChange,
        },
      });

      await user.click(tag("Open"));
      expect(selected()).toEqual(["open"]);
      expect(onChange).not.toHaveBeenCalled();

      await user.click(tag("Closed"));
      expect(selected()).toEqual(["closed"]);
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps the last selected tag in multiple mode with `required`", async () => {
    const onTagChange = vi.fn();
    render(SelectableTagGroup, {
      props: { required: true, selected: ["open", "closed"], onTagChange },
    });

    await user.click(tag("Closed"));
    expect(selected()).toEqual(["open"]);

    await user.click(tag("Open"));
    expect(selected()).toEqual(["open"]);
    // Only the click that changed something reaches the tag's own event.
    expect(onTagChange).not.toHaveBeenCalled();
  });

  it("still dispatches the tag's own change with the new state", async () => {
    const onTagChange = vi.fn();
    render(SelectableTagGroup, { props: { onTagChange } });

    await user.click(tag("Open"));
    await user.click(tag("Open"));

    expect(onTagChange).toHaveBeenNthCalledWith(1, { selected: true });
    expect(onTagChange).toHaveBeenNthCalledWith(2, { selected: false });
  });

  it("identifies a tag without a `value` by its `id`", async () => {
    render(SelectableTagGroup);

    await user.click(tag("Draft"));

    expect(selected()).toEqual(["draft"]);
  });

  it("disables every tag with the group and ignores clicks", async () => {
    const onChange = vi.fn();
    render(SelectableTagGroup, { props: { disabled: true, onChange } });

    for (const name of ["Open", "Closed", "Draft"]) {
      expect(tag(name)).toBeDisabled();
    }
    await user.click(tag("Open"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("gives tags the group size, unless a tag sets its own", () => {
    render(SelectableTagGroup, { props: { size: "sm", closedSize: "lg" } });

    expect(tag("Open")).toHaveClass("bx--tag--sm");
    expect(tag("Draft")).toHaveClass("bx--tag--sm");
    expect(tag("Closed")).toHaveClass("bx--tag--lg");
    expect(tag("Closed")).not.toHaveClass("bx--tag--sm");
  });

  it("normalizes the Carbon v11 `md` size", () => {
    render(SelectableTagGroup, { props: { size: "md" } });

    expect(tag("Open")).not.toHaveClass("bx--tag--sm");
    expect(tag("Open")).not.toHaveClass("bx--tag--lg");
  });

  it("has one tab stop, on the selected tag, and arrows move it", async () => {
    render(SelectableTagGroup, { props: { selected: ["closed"] } });

    expect(tag("Open")).toHaveAttribute("tabindex", "-1");
    expect(tag("Closed")).toHaveAttribute("tabindex", "0");
    expect(tag("Draft")).toHaveAttribute("tabindex", "-1");

    await user.tab();
    expect(tag("Closed")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tag("Draft")).toHaveFocus();
    expect(tag("Draft")).toHaveAttribute("tabindex", "0");
    expect(tag("Closed")).toHaveAttribute("tabindex", "-1");
    await user.keyboard("{ArrowRight}");
    expect(tag("Open")).toHaveFocus();
    await user.keyboard("{End}");
    expect(tag("Draft")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(tag("Open")).toHaveFocus();
    await user.keyboard(" ");
    expect(selected()).toEqual(["closed", "open"]);
  });

  it("keeps a disabled tag focusable in an enabled group", async () => {
    render(SelectableTagGroup, { props: { draftDisabled: true } });

    expect(tag("Draft")).not.toBeDisabled();
    expect(tag("Draft")).toHaveAttribute("aria-disabled", "true");

    await user.tab();
    expect(tag("Open")).toHaveFocus();
    await user.keyboard("{End}");
    expect(tag("Draft")).toHaveFocus();
    await user.keyboard(" ");
    await user.click(tag("Draft"));
    expect(selected()).toEqual([]);
  });

  it("moves the tab stop off a tag that becomes disabled", async () => {
    const { component } = render(SelectableTagGroup, {
      props: { selected: ["closed"] },
    });

    component.disabled = true;
    await tick();
    await tick();
    component.disabled = false;
    await tick();
    await tick();

    expect(
      screen
        .getAllByRole("button")
        .filter((button) => button.getAttribute("tabindex") === "0"),
    ).toEqual([tag("Closed")]);
  });
});
