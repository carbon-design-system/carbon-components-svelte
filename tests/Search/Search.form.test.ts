import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import SearchForm from "./Search.form.test.svelte";

const getBoundValue = () => getBoundText("bound-value");
const getBoundExpanded = () => getBoundText("bound-expanded");
describe("Search form reset", () => {
  it("clears to empty even with an initial value and zero interaction", async () => {
    render(SearchForm, { props: { value: "ada" } });

    await resetForm();

    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue("");
    expect(getBoundValue()).toBe("");
    expect(new FormData(getForm()).get("q")).toBe("");
  });

  it("follows the server-rendered default", async () => {
    render(SearchForm, { props: { value: "ada" } });
    const input = screen.getByRole("searchbox", {
      name: "Search",
    });
    assert(input instanceof HTMLInputElement);
    // Simulates SSR markup, which carries the value as the `value` attribute.
    input.defaultValue = "ada";

    await user.type(input, "x");
    expect(getBoundValue()).toBe("adax");

    await resetForm();

    expect(input).toHaveValue("ada");
    expect(getBoundValue()).toBe("ada");
  });

  it("leaves everything alone when the reset is canceled", async () => {
    render(SearchForm);
    const input = screen.getByRole("searchbox", { name: "Search" });
    getForm().addEventListener("reset", (event) => event.preventDefault());

    await user.type(input, "eric");
    await resetForm();

    expect(input).toHaveValue("eric");
    expect(getBoundValue()).toBe("eric");
  });

  it("leaves expanded untouched, only a later blur collapses it", async () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    render(SearchForm, {
      props: {
        expandable: true,
        expanded: false,
        value: "",
        onExpand,
        onCollapse,
      },
    });

    await user.click(screen.getByRole("button", { name: "Search" }));
    const input = screen.getByRole("searchbox", { name: "Search" });
    await user.type(input, "shoes");

    onExpand.mockClear();
    onCollapse.mockClear();

    await resetForm();

    expect(input).toHaveValue("");
    expect(getBoundExpanded()).toBe("true");
    expect(onExpand).not.toHaveBeenCalled();
    expect(onCollapse).not.toHaveBeenCalled();

    await user.tab();
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it("does not dispatch input, change, or clear on reset", async () => {
    const onInput = vi.fn();
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(SearchForm, { props: { onInput, onChange, onClear } });
    const input = screen.getByRole("searchbox", { name: "Search" });

    await user.type(input, "eric");
    onInput.mockClear();
    onChange.mockClear();

    await resetForm();

    expect(onInput).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });
});

describe("Search in a form", () => {
  it("does not submit the form on Enter", async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(SearchForm, { props: { onSubmit } });

    await user.type(
      screen.getByRole("searchbox", { name: "Search" }),
      "shoes{Enter}",
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("focuses the input and dispatches expand/collapse when expanded is set by the parent", async () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    const { rerender } = render(SearchForm, {
      props: { expandable: true, expanded: false, onExpand, onCollapse },
    });
    const input = screen.getByRole("searchbox", { name: "Search" });

    await rerender({ expanded: true });
    await vi.waitFor(() => expect(input).toHaveFocus());
    expect(onExpand).toHaveBeenCalledOnce();
    expect(onCollapse).not.toHaveBeenCalled();

    await rerender({ expanded: false });
    expect(onCollapse).toHaveBeenCalledOnce();
    expect(onExpand).toHaveBeenCalledOnce();
  });
});
