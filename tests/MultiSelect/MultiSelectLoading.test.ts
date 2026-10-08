import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSelectEmpty from "./MultiSelectEmpty.test.svelte";

describe("MultiSelect loading state", () => {
  it("renders a loading row and marks the menu busy", async () => {
    render(MultiSelectEmpty, { props: { filterable: false, loading: true } });

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByText("Loading...")).toBeInTheDocument();
  });

  it("hides the empty state while loading", async () => {
    render(MultiSelectEmpty, { props: { loading: true } });

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(await screen.findByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("No results")).toBeNull();
  });

  it("keeps the options selectable while loading", async () => {
    render(MultiSelectEmpty, { props: { filterable: false, loading: true } });

    await user.click(screen.getByRole("combobox"));
    const option = screen.getByRole("option", { name: "Email" });
    await user.click(option);

    expect(option).toHaveAttribute("aria-selected", "true");
  });
});
