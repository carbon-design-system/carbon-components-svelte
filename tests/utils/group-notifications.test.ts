import { groupNotificationsByRecency } from "../../src/utils/group-notifications.js";

const at = (iso: string) => Date.parse(iso);
const now = at("2026-10-27T15:00:00Z");

const summary = (groups: { label: string; items: { id: string }[] }[]) =>
  groups.map((group) => `${group.label}: ${group.items.map((i) => i.id)}`);

describe("groupNotificationsByRecency", () => {
  it("groups by calendar day, keeps input order, and omits empty groups", () => {
    const groups = groupNotificationsByRecency(
      [
        { id: "old", timestamp: at("2026-10-01T09:00:00Z") },
        { id: "today-a", timestamp: at("2026-10-27T00:30:00Z") },
        { id: "yesterday", timestamp: at("2026-10-26T23:59:00Z") },
        { id: "today-b", timestamp: at("2026-10-27T14:00:00Z") },
      ],
      { now, locale: "en-US", timeZone: "UTC" },
    );

    expect(summary(groups)).toEqual([
      "Today: today-a,today-b",
      "Yesterday: yesterday",
      "Previous: old",
    ]);
    expect(
      summary(
        groupNotificationsByRecency(
          [{ id: "a", timestamp: at("2026-10-27T01:00:00Z") }],
          { now, locale: "en-US", timeZone: "UTC" },
        ),
      ),
    ).toEqual(["Today: a"]);
  });

  it("counts a few hours across midnight as yesterday, not a 24-hour window", () => {
    const groups = groupNotificationsByRecency(
      [{ id: "late", timestamp: at("2026-10-26T23:00:00Z") }],
      { now: at("2026-10-27T00:30:00Z"), locale: "en-US", timeZone: "UTC" },
    );

    expect(summary(groups)).toEqual(["Yesterday: late"]);
  });

  it("puts a future timestamp in Today and an invalid one in Previous", () => {
    const groups = groupNotificationsByRecency(
      [
        { id: "future", timestamp: at("2026-10-30T00:00:00Z") },
        { id: "invalid", timestamp: "not a date" },
      ],
      { now, locale: "en-US", timeZone: "UTC" },
    );

    expect(summary(groups)).toEqual(["Today: future", "Previous: invalid"]);
  });

  it("buckets one instant by the time zone", () => {
    const items = [{ id: "a", timestamp: at("2026-10-27T01:00:00Z") }];
    const options = { now, locale: "en-US" };

    // 01:00 UTC is still the 26th in Los Angeles, and now is the 27th there.
    expect(
      summary(
        groupNotificationsByRecency(items, {
          ...options,
          timeZone: "America/Los_Angeles",
        }),
      ),
    ).toEqual(["Yesterday: a"]);
    expect(
      summary(
        groupNotificationsByRecency(items, { ...options, timeZone: "UTC" }),
      ),
    ).toEqual(["Today: a"]);
  });

  it("localizes Today and Yesterday, and takes overrides", () => {
    const items = [
      { id: "a", timestamp: at("2026-10-27T10:00:00Z") },
      { id: "b", timestamp: at("2026-10-26T10:00:00Z") },
      { id: "c", timestamp: at("2026-10-01T10:00:00Z") },
    ];

    expect(
      groupNotificationsByRecency(items, {
        now,
        locale: "es",
        timeZone: "UTC",
      }).map((group) => group.label),
    ).toEqual(["Hoy", "Ayer", "Previous"]);
    expect(
      groupNotificationsByRecency(items, {
        now,
        locale: "es",
        timeZone: "UTC",
        labels: { previous: "Anteriores" },
      }).map((group) => group.label),
    ).toEqual(["Hoy", "Ayer", "Anteriores"]);
  });
});
