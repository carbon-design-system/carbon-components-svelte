import { scrollIntoViewWithinMenu } from "../../src/utils/scrollIntoViewWithinMenu.js";

/**
 * Build a `role="listbox"` container with a single item, stubbing the layout
 * jsdom does not compute: the container's scrollability and both elements'
 * bounding rects.
 */
function buildMenu(options: {
  scrollable: boolean;
  containerTop: number;
  containerBottom: number;
  itemTop: number;
  itemBottom: number;
}) {
  const container = document.createElement("div");
  container.setAttribute("role", "listbox");
  Object.defineProperty(container, "clientHeight", { value: 100 });
  Object.defineProperty(container, "scrollHeight", {
    value: options.scrollable ? 300 : 100,
  });
  container.scrollTop = 50;
  container.getBoundingClientRect = () =>
    ({ top: options.containerTop, bottom: options.containerBottom }) as DOMRect;

  const item = document.createElement("div");
  item.getBoundingClientRect = () =>
    ({ top: options.itemTop, bottom: options.itemBottom }) as DOMRect;

  container.appendChild(item);
  document.body.appendChild(container);
  return { container, item };
}

describe("scrollIntoViewWithinMenu", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("is a no-op when the element has no listbox ancestor", () => {
    const item = document.createElement("div");
    item.getBoundingClientRect = () => ({ top: -100, bottom: -80 }) as DOMRect;
    document.body.appendChild(item);

    expect(() => scrollIntoViewWithinMenu(item)).not.toThrow();
  });

  test("does not scroll when the menu is not scrollable", () => {
    const { container, item } = buildMenu({
      scrollable: false,
      containerTop: 0,
      containerBottom: 100,
      itemTop: -50,
      itemBottom: -30,
    });

    scrollIntoViewWithinMenu(item);

    expect(container.scrollTop).toBe(50);
  });

  test("scrolls the container up when the item is above the viewport", () => {
    const { container, item } = buildMenu({
      scrollable: true,
      containerTop: 0,
      containerBottom: 100,
      itemTop: -20,
      itemBottom: 0,
    });

    scrollIntoViewWithinMenu(item);

    // scrollTop -= containerTop(0) - itemTop(-20) => 50 - 20 = 30
    expect(container.scrollTop).toBe(30);
  });

  test("scrolls the container down when the item is below the viewport", () => {
    const { container, item } = buildMenu({
      scrollable: true,
      containerTop: 0,
      containerBottom: 100,
      itemTop: 110,
      itemBottom: 130,
    });

    scrollIntoViewWithinMenu(item);

    // scrollTop += itemBottom(130) - containerBottom(100) => 50 + 30 = 80
    expect(container.scrollTop).toBe(80);
  });

  test("does not scroll when the item is already fully visible", () => {
    const { container, item } = buildMenu({
      scrollable: true,
      containerTop: 0,
      containerBottom: 100,
      itemTop: 40,
      itemBottom: 60,
    });

    scrollIntoViewWithinMenu(item);

    expect(container.scrollTop).toBe(50);
  });
});
