import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import SearchForm from "./Search.form.test.svelte";

const getBoundExpanded = () => getBoundText("bound-expanded");
describe("Search form reset", () => {
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
