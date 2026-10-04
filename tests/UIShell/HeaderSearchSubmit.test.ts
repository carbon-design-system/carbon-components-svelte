import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderSearchSubmit from "./HeaderSearchSubmit.test.svelte";

describe("HeaderSearch Enter without results", () => {
  it("submits the query instead of selecting a missing result", async () => {
    const onSelect = vi.fn();
    const onSubmit = vi.fn();
    const { component } = render(HeaderSearchSubmit, {
      props: { onSelect, onSubmit },
    });

    await user.type(screen.getByRole("textbox"), "quota");
    await user.keyboard("{Enter}");

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith({ value: "quota" });
    expect(component.value).toBe("quota");
    expect(component.active).toBe(true);
  });

  it("still selects the highlighted result when there is one", async () => {
    const onSelect = vi.fn();
    const onSubmit = vi.fn();
    render(HeaderSearchSubmit, {
      props: {
        onSelect,
        onSubmit,
        results: [{ href: "/quotas", text: "Quotas" }],
      },
    });

    await user.type(screen.getByRole("textbox"), "quota");
    await user.keyboard("{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "quota",
        selectedResult: { href: "/quotas", text: "Quotas" },
      }),
    );
  });
});
