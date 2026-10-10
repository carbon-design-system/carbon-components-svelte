import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderSearchSubmit from "./HeaderSearchSubmit.test.svelte";

const results = [{ href: "/quotas", text: "Quotas" }];

describe("HeaderSearch focus leaving", () => {
  it("closes when Tab moves focus out of the search", async () => {
    const onClose = vi.fn();
    const { component } = render(HeaderSearchSubmit, {
      props: { onClose, results },
    });

    await user.type(screen.getByRole("textbox"), "quota");
    await user.tab(); // clear button
    expect(component.active).toBe(true);

    await user.tab();
    expect(screen.getByRole("link", { name: "Main content" })).toHaveFocus();
    expect(component.active).toBe(false);
    expect(component.value).toBe("quota");
    expect(onClose).toHaveBeenCalledWith({ trigger: "blur" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("reports a click on another focusable element as outside-click", async () => {
    const onClose = vi.fn();
    const { component } = render(HeaderSearchSubmit, { props: { onClose } });

    await user.type(screen.getByRole("textbox"), "quota");
    await user.click(screen.getByRole("link", { name: "Main content" }));

    expect(component.active).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith({ trigger: "outside-click" });
  });
});
