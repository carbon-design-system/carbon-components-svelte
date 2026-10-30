import { titleWhenTruncated } from "../../src/utils/title-when-truncated.js";

function sized(tag: string, text: string, scrollWidth: number) {
  const node = document.createElement(tag);
  node.textContent = text;
  Object.defineProperty(node, "clientWidth", { value: 40 });
  Object.defineProperty(node, "scrollWidth", {
    value: scrollWidth,
    configurable: true,
  });
  return node;
}

function hover(node: HTMLElement) {
  node.dispatchEvent(new MouseEvent("mouseenter"));
}

describe("titleWhenTruncated", () => {
  it("sets the full text on hover only while the text is cut off", () => {
    const node = sized("span", "  us-south-1  ", 200);
    titleWhenTruncated(node);
    expect(node).not.toHaveAttribute("title");

    hover(node);
    expect(node).toHaveAttribute("title", "us-south-1");

    Object.defineProperty(node, "scrollWidth", { value: 40 });
    hover(node);
    expect(node).not.toHaveAttribute("title");
  });

  it("measures the descendant that `measure` names", () => {
    const button = document.createElement("button");
    const label = sized("span", "Team members", 200);
    label.className = "label";
    button.append(label, ", complete");

    titleWhenTruncated(button, { measure: ".label" });
    hover(button);
    expect(button).toHaveAttribute("title", "Team members");
  });

  it("falls back to the node when `measure` matches nothing", () => {
    const node = sized("span", "Billing plan", 200);
    titleWhenTruncated(node, { measure: ".label" });
    hover(node);
    expect(node).toHaveAttribute("title", "Billing plan");
  });

  it("skips the node while `enabled` is false", () => {
    const node = sized("label", "Billing contact", 200);
    const spy = vi.spyOn(node, "addEventListener");
    const action = titleWhenTruncated(node, { enabled: false });
    expect(spy).not.toHaveBeenCalled();
    hover(node);
    expect(node).not.toHaveAttribute("title");

    action.update({ enabled: true });
    hover(node);
    expect(node).toHaveAttribute("title", "Billing contact");

    action.update({ enabled: false });
    expect(node).not.toHaveAttribute("title");
    hover(node);
    expect(node).not.toHaveAttribute("title");
  });

  it("stops listening on destroy", () => {
    const node = sized("span", "us-south-1", 200);
    titleWhenTruncated(node).destroy();
    hover(node);
    expect(node).not.toHaveAttribute("title");
  });
});
