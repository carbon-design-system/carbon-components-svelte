import { expect, test } from "./helpers/host";
import { expectNoLayoutFindings, layoutFindings } from "./helpers/layout-audit";

test("finds small targets and low contrast added to a fixture", async ({
  page,
}) => {
  await page.goto("/dev-aids.html");
  await page.evaluate(() => {
    const row = document.createElement("div");
    row.innerHTML = `
      <button class="tiny" style="width: 16px; height: 16px; padding: 0">a</button>
      <button class="tiny" style="width: 16px; height: 16px; padding: 0">b</button>
      <p class="faint" style="color: #c6c6c6">Faint text</p>`;
    document.getElementById("app")?.append(row);
  });
  const findings = await layoutFindings(page, {
    checks: ["targets", "contrast"],
  });
  expect(findings.map((f) => f.check).sort()).toEqual(["contrast", "targets"]);
  const target = findings.find((f) => f.check === "targets");
  expect(target?.count).toBe(2);
  expect(target?.values?.needs).toBeGreaterThan(0);
});

test("the dev aids fixture's own markup has no layout findings", async ({
  page,
}) => {
  await page.goto("/dev-aids.html");
  await expectNoLayoutFindings(page);
});
