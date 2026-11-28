import { stubIntersectionObserver } from "./intersection-observer-mock";

/**
 * Stubs `IntersectionObserver` and returns a function that moves an element
 * using the `sticky` action in or out of its stuck state.
 */
export function stubStuckObserver() {
  const { instances } = stubIntersectionObserver();

  return function setStuck(node: Element, stuck: boolean) {
    const sentinel = [
      node.previousElementSibling,
      node.nextElementSibling,
      ...node.children,
    ].find((element) => element?.hasAttribute("data-ccs-sticky-sentinel"));
    assert(sentinel, "no sticky sentinel next to or inside the element");
    const observer = instances.find((instance) => instance.elements.has(node));
    assert(observer, "the element is not observed");
    observer.trigger(node, true);
    observer.trigger(sentinel, !stuck);
  };
}
