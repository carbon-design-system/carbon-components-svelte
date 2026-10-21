import { screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";

/** Clicks an opener, then Get Started, and settles the deferred focus return. */
export async function openThenStart(openerName = "Open launcher") {
  await user.click(screen.getByRole("button", { name: openerName }));
  await tick();
  await user.click(screen.getByRole("button", { name: "Get Started" }));
  await flushMacrotask();
  await tick();
}
