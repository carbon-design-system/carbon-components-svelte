import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import PinCodeInputProgrammatic from "./PinCodeInput.programmatic.test.svelte";

const getInputs = () => screen.getAllByRole("textbox") as HTMLInputElement[];

describe("PinCodeInput programmatic accessors", () => {
  it("focusFirstInput focuses the first segment", async () => {
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    inputs[3].focus();
    await screen.getByTestId("focus-first").click();
    await tick();

    expect(inputs[0]).toHaveFocus();
  });

  it("focusLastInput focuses the last segment", async () => {
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    inputs[0].focus();
    await screen.getByTestId("focus-last").click();
    await tick();

    expect(inputs[3]).toHaveFocus();
  });

  it("focusNextEmptyInput focuses the first empty segment", async () => {
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    inputs[0].focus();
    await screen.getByTestId("focus-next-empty").click();
    await tick();

    expect(inputs[3]).toHaveFocus();
  });

  it("focusNextEmptyInput focuses the last segment when all are filled", async () => {
    render(PinCodeInputProgrammatic, { props: { value: "0182" } });
    const inputs = getInputs();

    inputs[0].focus();
    await screen.getByTestId("focus-next-empty").click();
    await tick();

    expect(inputs[3]).toHaveFocus();
  });

  it("focusNext focuses the next segment from the current one", async () => {
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    inputs[1].focus();
    await screen.getByTestId("focus-next").click();
    await tick();

    expect(inputs[2]).toHaveFocus();
  });

  it("focusNext advances from the last focused segment after focus moves to a button", async () => {
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    inputs[1].focus();
    screen.getByTestId("focus-next").focus();
    await screen.getByTestId("focus-next").click();
    await tick();

    expect(inputs[2]).toHaveFocus();
  });

  it("focusNext does not wrap when the last segment is focused", async () => {
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    inputs[3].focus();
    await screen.getByTestId("focus-next").click();
    await tick();

    expect(inputs[3]).toHaveFocus();
  });

  it("focusNext focuses the first segment when none are focused", async () => {
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    await screen.getByTestId("focus-next").click();
    await tick();

    expect(inputs[0]).toHaveFocus();
  });

  it("focusNext selects text when selectTextOnFocus is passed as true", async () => {
    const select = vi.spyOn(HTMLInputElement.prototype, "select");
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    inputs[0].focus();
    await screen.getByTestId("focus-next-select").click();
    await tick();

    expect(inputs[1]).toHaveFocus();
    expect(select).toHaveBeenCalled();
    select.mockRestore();
  });

  it("clear empties all segments and dispatches change without moving focus by default", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    inputs[2].focus();
    screen.getByTestId("clear").focus();
    await screen.getByTestId("clear").click();
    await tick();

    expect(screen.getByTestId("value").textContent).toBe("");
    for (const input of inputs) {
      expect(input.value).toBe("");
    }
    expect(inputs[0]).not.toHaveFocus();
    expect(
      consoleLog.mock.calls.some(
        ([event, detail]) =>
          event === "change" && (detail as { value: string }).value === "",
      ),
    ).toBe(true);
  });

  it("clear focuses the first segment when focus is true", async () => {
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    inputs[2].focus();
    await screen.getByTestId("clear-focus").click();
    await tick();

    expect(screen.getByTestId("value").textContent).toBe("");
    expect(inputs[0]).toHaveFocus();
  });

  it("focusFirstInput selects text when selectTextOnFocus is passed as true", async () => {
    const select = vi.spyOn(HTMLInputElement.prototype, "select");
    render(PinCodeInputProgrammatic);

    await screen.getByTestId("focus-first-select").click();
    await tick();

    expect(select).toHaveBeenCalled();
    select.mockRestore();
  });

  it("focusFirstInput does not select text when selectTextOnFocus is passed as false", async () => {
    const select = vi.spyOn(HTMLInputElement.prototype, "select");
    render(PinCodeInputProgrammatic, {
      props: { selectTextOnFocus: true },
    });

    await screen.getByTestId("focus-first-no-select").click();
    await tick();

    expect(select).not.toHaveBeenCalled();
    select.mockRestore();
  });

  it("focusFirstInput uses the selectTextOnFocus prop when no option is passed", async () => {
    const select = vi.spyOn(HTMLInputElement.prototype, "select");
    render(PinCodeInputProgrammatic, {
      props: { selectTextOnFocus: true },
    });

    await screen.getByTestId("focus-first").click();
    await tick();

    expect(select).toHaveBeenCalled();
    select.mockRestore();
  });
});

describe("PinCodeInput label click", () => {
  it("focuses the first empty segment when the label is clicked with a partial value", async () => {
    render(PinCodeInputProgrammatic);
    const inputs = getInputs();

    inputs[0].focus();
    await screen.getByText("Verification code").click();
    await waitFor(() => {
      expect(inputs[3]).toHaveFocus();
    });
  });
});
