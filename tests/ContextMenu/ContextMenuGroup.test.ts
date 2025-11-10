import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ContextMenuGroup from "./ContextMenuGroup.test.svelte";

describe("ContextMenuGroup", () => {
  const getSelectedIds = () => {
    const element = screen.getByTestId("selected-ids");
    return JSON.parse(element.textContent || "[]");
  };

  it("should toggle option when clicking option that is not selected", async () => {
    render(ContextMenuGroup, { props: { selectedIds: [] } });

    const option1 = screen.getByText("Option 1");
    await user.click(option1);

    const selectedIds = getSelectedIds();
    expect(selectedIds).toContain("option1");
    expect(selectedIds).toHaveLength(1);
  });

  it("should toggle option when clicking option that is already selected", async () => {
    render(ContextMenuGroup, {
      props: { selectedIds: ["option1", "option2"] },
    });

    const option1 = screen.getByText("Option 1");
    await user.click(option1);

    const selectedIds = getSelectedIds();
    expect(selectedIds).not.toContain("option1");
    expect(selectedIds).toContain("option2");
    expect(selectedIds).toHaveLength(1);
  });

  it("should add multiple options when clicking different options", async () => {
    render(ContextMenuGroup, { props: { selectedIds: [] } });

    const option1 = screen.getByText("Option 1");
    const option2 = screen.getByText("Option 2");
    const option3 = screen.getByText("Option 3");

    await user.click(option1);
    await user.click(option2);
    await user.click(option3);

    const selectedIds = getSelectedIds();
    expect(selectedIds).toContain("option1");
    expect(selectedIds).toContain("option2");
    expect(selectedIds).toContain("option3");
    expect(selectedIds).toHaveLength(3);
  });

  it("should handle toggle when option is already in selectedIds", async () => {
    render(ContextMenuGroup, {
      props: { selectedIds: ["option1"] },
    });

    const option1 = screen.getByText("Option 1");
    await user.click(option1);

    const selectedIds = getSelectedIds();
    expect(selectedIds).not.toContain("option1");
    expect(selectedIds).toHaveLength(0);
  });
});
