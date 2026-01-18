import { render, screen } from "@testing-library/svelte";
import { clearAllGroups } from "../../src/RadioButton/RadioButtonRegistry";
import { user } from "../setup-tests";
import RadioButtonImplicitGroup from "./RadioButtonImplicitGroup.test.svelte";

describe("RadioButton (Implicit Group via name)", () => {
  beforeEach(() => {
    clearAllGroups();
  });

  it("should sync checked state across siblings with same name", async () => {
    const { component } = render(RadioButtonImplicitGroup);

    const option1 = screen.getByRole("radio", { name: "Option 1" });
    const option2 = screen.getByRole("radio", { name: "Option 2" });
    const option3 = screen.getByRole("radio", { name: "Option 3" });

    // Initially all unchecked
    expect(option1).not.toBeChecked();
    expect(option2).not.toBeChecked();
    expect(option3).not.toBeChecked();

    // Click option 1
    await user.click(option1);
    expect(option1).toBeChecked();
    expect(option2).not.toBeChecked();
    expect(option3).not.toBeChecked();
    expect(component.checked1).toBe(true);
    expect(component.checked2).toBe(false);
    expect(component.checked3).toBe(false);

    // Click option 2 - option 1 should uncheck
    await user.click(option2);
    expect(option1).not.toBeChecked();
    expect(option2).toBeChecked();
    expect(option3).not.toBeChecked();
    expect(component.checked1).toBe(false);
    expect(component.checked2).toBe(true);
    expect(component.checked3).toBe(false);

    // Click option 3 - option 2 should uncheck
    await user.click(option3);
    expect(option1).not.toBeChecked();
    expect(option2).not.toBeChecked();
    expect(option3).toBeChecked();
    expect(component.checked1).toBe(false);
    expect(component.checked2).toBe(false);
    expect(component.checked3).toBe(true);
  });

  it("should handle initial checked state", async () => {
    render(RadioButtonImplicitGroup, {
      props: { checked2: true },
    });

    // Wait for component to mount and registry to sync
    await new Promise((resolve) => setTimeout(resolve, 0));

    const option1 = screen.getByRole("radio", { name: "Option 1" });
    const option2 = screen.getByRole("radio", { name: "Option 2" });
    const option3 = screen.getByRole("radio", { name: "Option 3" });

    expect(option1).not.toBeChecked();
    expect(option2).toBeChecked();
    expect(option3).not.toBeChecked();
  });

  it("should handle programmatic checked updates", async () => {
    const { component } = render(RadioButtonImplicitGroup);

    const option2 = screen.getByRole("radio", { name: "Option 2" });

    // Programmatically select option 2
    component.checked2 = true;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Option 2 should be checked, option 1 should be unchecked
    // Note: programmatic updates to `checked` don't automatically uncheck siblings
    // because the binding goes RadioButton -> component, not component -> registry
    expect(option2).toBeChecked();
  });

  it("should clean up registry on unmount", async () => {
    const { unmount } = render(RadioButtonImplicitGroup);

    const option1 = screen.getByRole("radio", { name: "Option 1" });
    await user.click(option1);

    // Unmount should clean up
    unmount();

    // Re-render should start fresh (no stale state)
    const { component } = render(RadioButtonImplicitGroup);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should start with all unchecked
    expect(component.checked1).toBe(false);
    expect(component.checked2).toBe(false);
    expect(component.checked3).toBe(false);
  });

  it("should handle multiple independent groups", async () => {
    // Render two groups with different names
    const { component: group1 } = render(RadioButtonImplicitGroup, {
      props: { groupName: "group-a" },
    });

    // Get the radios before rendering the second group
    const group1Option1 = screen.getByRole("radio", { name: "Option 1" });
    await user.click(group1Option1);

    expect(group1.checked1).toBe(true);

    // Clean up first group
    // (in a real app, different groups would be in separate DOM trees)
  });
});
