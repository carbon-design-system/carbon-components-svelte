import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ComboBoxEmpty from "./ComboBoxEmpty.test.svelte";

describe("ComboBox loading state", () => {
  it("renders a loading row and marks the menu busy", async () => {
    render(ComboBoxEmpty, { props: { loading: true } });

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByText("Loading...")).toBeInTheDocument();
  });

  it("hides the empty state while loading", async () => {
    render(ComboBoxEmpty, { props: { loading: true } });

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(await screen.findByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("No results")).toBeNull();
  });

  it("keeps the options selectable while loading", async () => {
    render(ComboBoxEmpty, { props: { loading: true } });

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "Email" }));

    expect(input).toHaveValue("Email");
  });
});
