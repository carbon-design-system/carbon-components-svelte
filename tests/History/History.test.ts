import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import History from "./History.test.svelte";

describe("History", () => {
  it("drives the buttons from the stores", async () => {
    render(History);
    const undo = screen.getByTestId("undo");
    const redo = screen.getByTestId("redo");
    expect(undo).toBeDisabled();
    expect(redo).toBeDisabled();

    await user.click(screen.getByTestId("add"));
    await user.click(screen.getByTestId("add"));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(undo).toBeEnabled();
    expect(undo).toHaveTextContent("Undo add");

    await user.click(undo);
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(redo).toBeEnabled();
    await user.click(redo);
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("messages")).toHaveTextContent(
      "Undid add|Redid add",
    );
  });

  it("undoes from the keyboard outside a field", async () => {
    render(History);
    await user.click(screen.getByTestId("add"));
    await user.keyboard("{Control>}z{/Control}");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("records typing as one snapshot step that the app undoes in the field", async () => {
    render(History, { fields: "app" });
    const field = screen.getByTestId("field");
    await user.click(field);
    await user.keyboard("hello");
    expect(screen.getByTestId("text")).toHaveTextContent("hello");

    await user.keyboard("{Control>}z{/Control}");
    expect(screen.getByTestId("text")).toHaveTextContent("");
    expect(screen.getByTestId("undo")).toBeDisabled();
    expect(screen.getByTestId("redo")).toBeEnabled();
  });
});
