import { render, screen, within } from "@testing-library/svelte";
import DescriptionList from "./DescriptionList.test.svelte";

describe("DescriptionList", () => {
  it("renders a real dl/dt/dd tree", () => {
    render(DescriptionList);

    const list = screen.getByTestId("default");
    expect(list.tagName).toBe("DL");
    expect(list).toHaveClass("bx--description-list-gap-5");
    expect(list.querySelectorAll("dt")).toHaveLength(2);
    expect(list.querySelectorAll("dd")).toHaveLength(2);
    expect(within(list).getByText("Name").tagName).toBe("DT");
    expect(within(list).getByText("PostgreSQL").tagName).toBe("DD");
  });

  it("applies the horizontal layout class", () => {
    render(DescriptionList);

    expect(screen.getByTestId("horizontal")).toHaveClass(
      "bx--description-list--horizontal",
    );
  });

  it("sets grid-template-columns when columns is greater than 1", () => {
    render(DescriptionList);

    expect(screen.getByTestId("columns")).toHaveClass(
      "bx--description-list--columns",
    );
    expect(screen.getByTestId("columns")).toHaveStyle({
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    });
  });

  it("applies a custom gap and keeps the caller's class", () => {
    render(DescriptionList);

    const list = screen.getByTestId("custom-gap");
    expect(list).toHaveStyle({ gap: "22px" });
    expect(list).toHaveClass("custom", "bx--description-list");
    expect(list.className).not.toMatch(/bx--description-list-gap-/);
  });

  it("renders an item with no term as an empty dt", () => {
    render(DescriptionList);

    const detail = screen.getByText("No term");
    expect(detail.tagName).toBe("DD");
    expect(detail.previousElementSibling?.tagName).toBe("DT");
    expect(detail.previousElementSibling?.textContent).toBe("");
  });
});
