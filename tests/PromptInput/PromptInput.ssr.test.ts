// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import PromptInput from "./PromptInput.test.svelte";

describe("PromptInput server render", () => {
  it("renders the field, the count and a send button that can't send yet", () => {
    const { document } = renderSSR(PromptInput, { maxCount: 100 });

    expect(document.querySelector("textarea")?.getAttribute("rows")).toBe("1");
    expect(document.querySelector(".bx--prompt-input__hint")?.textContent).toBe(
      "0/100",
    );
    const buttons = [
      ...document.querySelectorAll(".bx--prompt-input .bx--btn"),
    ];
    expect(buttons).toHaveLength(2);
    expect(buttons[1].hasAttribute("disabled")).toBe(true);
  });

  it("renders chips for attachments that came with the page", () => {
    const { document } = renderSSR(PromptInput, {
      attachments: [{ id: "1", name: "plan.pdf", size: 4096 }],
    });

    expect(
      document.querySelector(".bx--prompt-input__chip-name")?.textContent,
    ).toBe("plan.pdf");
    expect(
      document.querySelector(".bx--prompt-input__chip-meta")?.textContent,
    ).toBe("4.1 kB");
  });
});
