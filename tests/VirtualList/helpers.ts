import { fireEvent } from "@testing-library/svelte";
import { rect } from "../utils/rect";

/** Scroll `scroller` to `top`, placing `list` that far above its top edge (jsdom has no layout). */
export async function scrollListTo(
  scroller: HTMLElement,
  list: HTMLElement,
  top: number,
) {
  list.getBoundingClientRect = () => rect({ top: -top });
  scroller.scrollTop = top;
  await fireEvent.scroll(scroller);
}
