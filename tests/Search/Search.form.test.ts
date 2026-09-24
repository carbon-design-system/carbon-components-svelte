import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { user } from "../utils/user";
import SearchForm from "./Search.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBoundValue = () => screen.getByTestId("bound-value").textContent;
const getBoundExpanded = () => screen.getByTestId("bound-expanded").textContent;
describe("Search form reset", () => {
  it("clears to empty even with an initial value and zero interaction", async () => {
    render(SearchForm, { props: { value: "ada" } });

    getForm().reset();
    await flushFormReset();

    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue("");
    expect(getBoundValue()).toBe("");
    expect(new FormData(getForm()).get("q")).toBe("");
  });

  it("follows the server-rendered default", async () => {
    render(SearchForm, { props: { value: "ada" } });
    const input = screen.getByRole("searchbox", {
      name: "Search",
    }) as HTMLInputElement;
    // Simulates SSR markup, which carries the value as the `value` attribute.
    input.defaultValue = "ada";

    await user.type(input, "x");
    expect(getBoundValue()).toBe("adax");

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("ada");
    expect(getBoundValue()).toBe("ada");
  });

  it("leaves everything alone when the reset is canceled", async () => {
    render(SearchForm);
    const input = screen.getByRole("searchbox", { name: "Search" });
    getForm().addEventListener("reset", (event) => event.preventDefault());

    await user.type(input, "eric");
    getForm().reset();
    await flushFormReset();

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

    getForm().reset();
    await flushFormReset();

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

    getForm().reset();
    await flushFormReset();

    expect(onInput).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });
});
