import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import IconPicker from "./IconPicker.test.svelte";

const field = () => screen.getAllByRole("combobox")[0];

describe("IconPicker", () => {
  it("shows the chosen icon's name and builds no grid until it opens", () => {
    render(IconPicker, { value: "Add" });
    expect(field()).toHaveTextContent("Add");
    expect(field()).toHaveAttribute("aria-expanded", "false");
    expect(field()).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens a dialog with the search focused, and chooses an icon", async () => {
    render(IconPicker);
    await user.click(field());
    expect(field()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Search icons" }),
      ).toHaveFocus(),
    );
    await user.click(screen.getByRole("option", { name: "Edit" }));
    expect(screen.getByTestId("value")).toHaveTextContent("Edit");
    expect(screen.getByTestId("changes")).toHaveTextContent("Edit:function");
    expect(field()).toHaveTextContent("Edit");
    expect(field()).toHaveAttribute("aria-expanded", "false");
    expect(field()).toHaveFocus();
  });

  it("writes the name into a hidden input for a form", () => {
    const { container } = render(IconPicker, { value: "Add", name: "icon" });
    expect(
      container.querySelector<HTMLInputElement>("input[type=hidden][name=icon]")
        ?.value,
    ).toBe("Add");
  });

  it("imports only the icons it shows, and waits for the one a choice needs", async () => {
    render(IconPicker, { mode: "loaders" });
    expect(screen.getByTestId("imports")).toHaveTextContent("0");
    await user.click(field());
    await waitFor(() =>
      expect(screen.getByTestId("imports")).toHaveTextContent("2"),
    );
    await user.click(screen.getByRole("option", { name: "Add" }));
    expect(screen.getByTestId("changes")).toHaveTextContent("Add:function");
    expect(screen.getByTestId("imports")).toHaveTextContent("2");
  });

  it("asks a list function only when it first opens, or when a value is set", async () => {
    const { unmount } = render(IconPicker, { mode: "function" });
    expect(screen.getByTestId("list-calls")).toHaveTextContent("0");
    await user.click(field());
    await waitFor(() =>
      expect(screen.getByTestId("list-calls")).toHaveTextContent("1"),
    );
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Add" })).toBeInTheDocument(),
    );
    unmount();

    render(IconPicker, { mode: "function", value: "Edit" });
    await waitFor(() =>
      expect(screen.getByTestId("list-calls")).toHaveTextContent("1"),
    );
    await waitFor(() => expect(field()).toHaveTextContent("Edit"));
  });

  it("renders the grid on the page, with no field, as the inline variant", () => {
    render(IconPicker, { variant: "inline" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });
});
