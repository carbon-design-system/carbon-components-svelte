import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.test.svelte";
import ComboBoxCreateOption from "./ComboBoxCreateOption.test.svelte";

describe("ComboBox create option", () => {
  const getInput = () => {
    const input = screen.getByRole("combobox");
    assert(input instanceof HTMLInputElement);
    return input;
  };

  it("shows a trailing create row for a novel query", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "e");

    // Partial matches remain; create row trails because "e" is not an exact match.
    expect(screen.getByRole("option", { name: "Email" })).toBeVisible();
    expect(screen.getByRole("option", { name: 'Create "e"' })).toBeVisible();
  });

  it("shows the create row when filtered results are empty", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Teams");

    expect(
      screen.getByRole("option", { name: 'Create "Teams"' }),
    ).toBeVisible();
    expect(
      screen.queryByRole("option", { name: "Slack" }),
    ).not.toBeInTheDocument();
  });

  it("does not show the create row for an exact case-insensitive match", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "email");

    expect(
      screen.queryByRole("option", { name: /Create/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Email" })).toBeVisible();
  });

  it("does not show the create row when allowCustomValue is false", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    await user.type(input, "Teams");

    expect(
      screen.queryByRole("option", { name: /Create/ }),
    ).not.toBeInTheDocument();
  });

  it("dispatches create with the query when the create row is clicked", async () => {
    const onCreate = vi.fn();
    render(ComboBoxCreateOption, { props: { onCreate } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Teams");
    await user.click(screen.getByRole("option", { name: 'Create "Teams"' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0][0].detail).toBe("Teams");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("dispatches create on Enter with a novel query and no highlight", async () => {
    const onCreate = vi.fn();
    render(ComboBoxCreateOption, { props: { onCreate } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Teams");
    await user.keyboard("{Enter}");

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0][0].detail).toBe("Teams");
    expect(input).toHaveValue("Teams");
  });

  it("dispatches create on Enter when the create row is highlighted", async () => {
    const onCreate = vi.fn();
    render(ComboBoxCreateOption, { props: { onCreate } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "zzz");
    // No filtered matches: ArrowDown lands on the create row.
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0][0].detail).toBe("zzz");
  });

  it("lets the consumer append the created option to items", async () => {
    render(ComboBoxCreateOption, { props: { appendOnCreate: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Teams");
    await user.click(screen.getByRole("option", { name: 'Create "Teams"' }));

    expect(input).toHaveValue("Teams");

    await user.click(input);
    expect(screen.getByRole("option", { name: "Teams" })).toBeVisible();
    expect(
      screen.queryByRole("option", { name: /Create/ }),
    ).not.toBeInTheDocument();
  });

  it("preserves custom value on close without requiring a create handler", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Custom Value");
    await user.click(document.body);
    expect(input).toHaveValue("Custom Value");
  });

  it("uses createOptionText for the create row label", async () => {
    render(ComboBox, {
      props: {
        allowCustomValue: true,
        createOptionText: (q: string) => `Add ${q}`,
      },
    });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Teams");

    expect(screen.getByRole("option", { name: "Add Teams" })).toBeVisible();
  });
});
