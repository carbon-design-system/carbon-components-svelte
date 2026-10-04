import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderSearchSubmit from "./HeaderSearchSubmit.test.svelte";

const results = [
  { href: "/quotas", text: "Quotas" },
  { href: "/quota-alerts", text: "Quota alerts" },
  { href: "/quota-history", text: "Quota history" },
];

describe("HeaderSearch results shrinking", () => {
  it("moves the selection back into range", async () => {
    const onSelect = vi.fn();
    const { component } = render(HeaderSearchSubmit, {
      props: { onSelect, results },
    });

    screen.getByRole("textbox").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(component.selectedResultIndex).toBe(2);

    component.results = results.slice(0, 1);
    await tick();
    expect(component.selectedResultIndex).toBe(0);

    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ selectedResult: results[0] }),
    );
  });
});
