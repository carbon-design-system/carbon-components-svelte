import { render, screen } from "@testing-library/svelte";
import HeaderActionSlot from "./HeaderAction.slot.test.svelte";

describe("HeaderAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports custom textChildren slot", () => {
    render(HeaderActionSlot);

    const customText = screen.getByText("Custom text content");
    expect(customText).toBeInTheDocument();
  });

  it("supports custom icon slot", () => {
    render(HeaderActionSlot);

    const customIcon = screen.getByTestId("custom-icon");
    expect(customIcon).toBeInTheDocument();
  });
});
