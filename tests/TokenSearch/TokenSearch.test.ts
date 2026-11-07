import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TokenSearch from "./TokenSearch.test.svelte";

const layer = () => document.querySelector(".bx--token-search__content");

async function typeInto(text: string) {
  const field = screen.getByRole("combobox") as HTMLInputElement;
  await user.click(field);
  await user.keyboard(text);
  await tick();
  return field;
}

describe("TokenSearch", () => {
  it("draws the text it was given and marks each qualifier", async () => {
    render(TokenSearch, {
      props: { value: 'is:open -label:bug nope:1 "a phrase" free' },
    });
    await tick();

    expect(layer()?.textContent).toBe(
      'is:open -label:bug nope:1 "a phrase" free',
    );
    expect(
      document.querySelectorAll(".bx--token-search__qualifier"),
    ).toHaveLength(3);
    expect(
      document.querySelectorAll(".bx--token-search__qualifier--negated"),
    ).toHaveLength(1);
    // An unknown key is the one marked.
    expect(
      document.querySelectorAll(".bx--token-search__qualifier--error"),
    ).toHaveLength(1);
    expect(document.querySelectorAll(".bx--token-search__phrase")).toHaveLength(
      1,
    );
  });

  it("does not underline a qualifier that is still waiting for its value", async () => {
    render(TokenSearch, { props: { value: "label:" } });
    await tick();
    expect(
      document.querySelectorAll(".bx--token-search__qualifier"),
    ).toHaveLength(1);
    expect(document.querySelectorAll(".bx--token-search__error")).toHaveLength(
      0,
    );
    // The query still says so, for code that checks before it searches.
    expect(
      JSON.parse(screen.getByTestId("query").textContent ?? "{}").errors,
    ).toMatchObject([{ code: "missing-value" }]);
  });

  it("keeps the layer in step with what is typed, and binds the parsed query", async () => {
    const onChange = vi.fn();
    render(TokenSearch, { props: { onChange } });
    const field = await typeInto("is:open label:bug,ui hello");

    expect(layer()?.textContent).toBe(field.value);
    const query = JSON.parse(screen.getByTestId("query").textContent ?? "{}");
    expect(query.text).toBe("hello");
    expect(query.filters.map((f: { key: string }) => f.key)).toEqual([
      "is",
      "label",
    ]);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "is:open label:bug,ui hello" }),
    );
  });

  it("offers the keys on an empty word, then the values of the key", async () => {
    render(TokenSearch);
    const field = await typeInto("la");

    expect(
      screen.getAllByRole("option").map((o) => o.textContent?.trim()),
    ).toEqual(["label label:"]);
    expect(field).toHaveAttribute("role", "combobox");
    expect(field).toHaveAttribute("aria-expanded", "true");
    expect(field).toHaveAttribute("aria-autocomplete", "list");

    await user.keyboard("{ArrowDown}{Enter}");
    await tick();
    expect(field.value).toBe("label:");
    expect(
      screen.getAllByRole("option").map((o) => o.textContent?.trim()),
    ).toEqual(["bug", "ui", "good first issue"]);

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    await tick();
    expect(field.value).toBe('label:"good first issue" ');
  });

  it("does not choose until the arrow keys do, so Enter still searches", async () => {
    const onSearch = vi.fn();
    render(TokenSearch, { props: { onSearch } });
    const field = await typeInto("is:op");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(field).not.toHaveAttribute("aria-activedescendant");

    await user.keyboard("{Enter}");
    expect(onSearch).toHaveBeenCalledWith("is:op");
    expect(field.value).toBe("is:op");
  });

  it("closes on Escape without clearing, and clears on the next", async () => {
    render(TokenSearch);
    const field = await typeInto("is:op");
    await user.keyboard("{Escape}");
    await tick();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(field.value).toBe("is:op");
    await user.keyboard("{Escape}");
    expect(field.value).toBe("");
  });

  it("offers recent queries in an empty field and writes the one chosen", async () => {
    const onSelect = vi.fn();
    render(TokenSearch, {
      props: { recentQueries: ["is:open label:bug"], onSelect },
    });
    const field = screen.getByRole("combobox") as HTMLInputElement;
    await user.click(field);
    await tick();

    const options = screen.getAllByRole("option");
    expect(options[options.length - 1]).toHaveTextContent("is:open label:bug");
    await user.keyboard("{ArrowUp}{Enter}");
    await tick();
    expect(field.value).toBe("is:open label:bug");
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: "is:open label:bug" }),
    );
  });

  it("names the problems in the query for a screen reader", async () => {
    render(TokenSearch, { props: { value: "nope:1" } });
    await tick();
    const field = screen.getByRole("combobox");
    const described = document.getElementById(
      field.getAttribute("aria-describedby") ?? "",
    );
    expect(described?.textContent).toBe(
      '1 problem in the query: Unknown key "nope"',
    );
  });

  it("draws nothing behind the text with highlight off", async () => {
    render(TokenSearch, { props: { value: "is:open", highlight: false } });
    await tick();
    expect(
      document.querySelector(".bx--token-search__backdrop"),
    ).toHaveAttribute("hidden");
    expect(document.querySelector(".bx--token-search--highlight")).toBeNull();
  });

  it("removes the layer and the anchor it put in the field when it unmounts", async () => {
    const { unmount } = render(TokenSearch, { props: { value: "is:open" } });
    await tick();
    expect(
      document.querySelector(".bx--token-search__backdrop")?.parentElement,
    ).toHaveClass("bx--search");
    unmount();
    expect(document.querySelector(".bx--token-search__backdrop")).toBeNull();
    expect(document.querySelector(".bx--token-search__anchor")).toBeNull();
  });
});
