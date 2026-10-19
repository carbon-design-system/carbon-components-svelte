import { render, screen } from "@testing-library/svelte";
import {
  clearAllGroups,
  getGroup,
} from "../../src/RadioButton/radio-button-registry";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
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

    expect(option1).not.toBeChecked();
    expect(option2).not.toBeChecked();
    expect(option3).not.toBeChecked();

    await user.click(option1);
    expect(option1).toBeChecked();
    expect(option2).not.toBeChecked();
    expect(option3).not.toBeChecked();
    expect(component.checked1).toBe(true);
    expect(component.checked2).toBe(false);
    expect(component.checked3).toBe(false);

    await user.click(option2);
    expect(option1).not.toBeChecked();
    expect(option2).toBeChecked();
    expect(option3).not.toBeChecked();
    expect(component.checked1).toBe(false);
    expect(component.checked2).toBe(true);
    expect(component.checked3).toBe(false);

    await user.click(option3);
    expect(option1).not.toBeChecked();
    expect(option2).not.toBeChecked();
    expect(option3).toBeChecked();
    expect(component.checked1).toBe(false);
    expect(component.checked2).toBe(false);
    expect(component.checked3).toBe(true);
  });

  it("should uncheck siblings when checked is set programmatically", async () => {
    const { component } = render(RadioButtonImplicitGroup);

    await user.click(screen.getByRole("radio", { name: "Option 1" }));
    component.checked2 = true;
    await flushMacrotask();

    expect(screen.getByRole("radio", { name: "Option 2" })).toBeChecked();
    expect(component.checked1).toBe(false);
  });

  it("should clean up registry on unmount", () => {
    const { unmount } = render(RadioButtonImplicitGroup);

    expect(getGroup("implicit-group")?.members.size).toBe(3);

    unmount();

    expect(getGroup("implicit-group")).toBeUndefined();
  });

  it("should keep independent groups separate", async () => {
    const { component } = render(RadioButtonImplicitGroup, {
      props: { secondGroupName: "second-group" },
    });

    const option1 = screen.getByRole("radio", { name: "Option 1" });
    const option4 = screen.getByRole("radio", { name: "Option 4" });
    const option5 = screen.getByRole("radio", { name: "Option 5" });

    await user.click(option1);
    await user.click(option4);

    expect(option1).toBeChecked();
    expect(option4).toBeChecked();
    expect(component.checked1).toBe(true);
    expect(component.checked4).toBe(true);

    await user.click(option5);

    expect(option4).not.toBeChecked();
    expect(option5).toBeChecked();
    expect(option1).toBeChecked();
    expect(component.checked1).toBe(true);
    expect(component.checked4).toBe(false);
    expect(component.checked5).toBe(true);
  });
});
