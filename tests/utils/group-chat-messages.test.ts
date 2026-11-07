import { groupChatMessages } from "../../src/utils/group-chat-messages.js";

const at = (iso: string) => new Date(iso);
const now = at("2026-10-19T18:00:00");

const summary = (items: ReturnType<typeof groupChatMessages>) =>
  items.map((item) =>
    item.type === "divider"
      ? `— ${item.label}`
      : `${item.message.author}${item.continued ? " +" : ""}${item.last ? " ·" : ""}`,
  );

describe("groupChatMessages", () => {
  it("groups one author's run, and ends the group after a gap or another author", () => {
    const items = groupChatMessages(
      [
        { author: "Sam", time: at("2026-10-19T09:00:00") },
        { author: "Sam", time: at("2026-10-19T09:02:00") },
        // Seven minutes later: past the five-minute group gap.
        { author: "Sam", time: at("2026-10-19T09:09:00") },
        { author: "You", time: at("2026-10-19T09:10:00") },
      ],
      { now, locale: "en-US" },
    );

    expect(summary(items)).toEqual([
      "— Today",
      "Sam",
      "Sam + ·",
      "Sam ·",
      "You ·",
    ]);
  });

  it("adds dividers for a new day and for a pause over an hour", () => {
    const items = groupChatMessages(
      [
        { author: "Sam", time: at("2026-10-17T16:00:00") },
        { author: "Sam", time: at("2026-10-18T10:00:00") },
        { author: "Sam", time: at("2026-10-18T10:01:00") },
        { author: "Sam", time: at("2026-10-18T14:30:00") },
      ],
      { now, locale: "en-US" },
    );

    expect(summary(items)).toEqual([
      "— Oct 17, 2026",
      "Sam ·",
      "— Yesterday",
      "Sam",
      "Sam + ·",
      "— 2:30 PM",
      "Sam ·",
    ]);
  });

  it("takes custom gaps, authors and labels", () => {
    const items = groupChatMessages(
      [
        { from: "them", time: 0 },
        { from: "them", time: 30_000 },
      ],
      { groupGap: 10_000, label: () => "Earlier" },
    );

    expect(
      items.map((item) =>
        item.type === "divider" ? item.label : item.continued,
      ),
    ).toEqual(["Earlier", false, false]);
  });

  describe("timeZone", () => {
    const labels = (
      times: string[],
      options: Parameters<typeof groupChatMessages>[1],
    ) =>
      summary(
        groupChatMessages(
          times.map((time) => ({ author: "Sam", time: new Date(time) })),
          { locale: "en-US", ...options },
        ),
      ).filter((line) => line.startsWith("—"));

    it("starts a day at midnight in the zone, not in the host's", () => {
      // 23:30 and 00:30 in Tokyo, 10:30 and 11:30 in New York.
      const times = ["2026-10-19T14:30:00Z", "2026-10-19T15:30:00Z"];
      const now = new Date("2026-10-19T16:00:00Z");

      expect(labels(times, { timeZone: "Asia/Tokyo", now })).toEqual([
        "— Yesterday",
        "— Today",
      ]);
      expect(labels(times, { timeZone: "America/New_York", now })).toEqual([
        "— Today",
      ]);
    });

    it("writes the date and the time in the zone", () => {
      const now = new Date("2026-10-30T12:00:00Z");

      expect(
        labels(["2026-10-19T23:30:00Z"], { timeZone: "Asia/Tokyo", now }),
      ).toEqual(["— Oct 20, 2026"]);
      expect(
        labels(["2026-10-19T23:30:00Z"], { timeZone: "America/New_York", now }),
      ).toEqual(["— Oct 19, 2026"]);
      expect(
        labels(["2026-10-30T11:00:00Z", "2026-10-30T13:30:00Z"], {
          timeZone: "Asia/Tokyo",
          now,
        }),
      ).toEqual(["— Today", "— 10:30 PM"]);
    });

    it("counts Yesterday by the calendar on a day of 23 or 25 hours", () => {
      const zone = "America/New_York";
      // 00:30 on March 8 (a day of 23 hours), and the same time the day
      // after: 23 hours later, yesterday.
      expect(
        labels(["2026-03-08T05:30:00Z"], {
          timeZone: zone,
          now: new Date("2026-03-09T04:30:00Z"),
        }),
      ).toEqual(["— Yesterday"]);
      // The 23:30 before it is the day before that.
      expect(
        labels(["2026-03-08T04:30:00Z"], {
          timeZone: zone,
          now: new Date("2026-03-09T04:30:00Z"),
        }),
      ).toEqual(["— Mar 7, 2026"]);
      // November 1 has 25 hours: two messages 24 hours apart are one day, so
      // the second gets the time after a pause, not a date.
      expect(
        labels(["2026-11-01T04:30:00Z", "2026-11-02T04:30:00Z"], {
          timeZone: zone,
          now: new Date("2026-11-02T12:00:00Z"),
        }),
      ).toEqual(["— Yesterday", "— 11:30 PM"]);
    });

    it("gives the same answer whatever the host's zone", () => {
      const items = groupChatMessages(
        [
          { author: "Sam", time: "2026-10-19T14:30:00Z" },
          { author: "Sam", time: "2026-10-19T15:30:00Z" },
        ],
        { locale: "en-US", timeZone: "Asia/Tokyo", now: 1_792_000_000_000 },
      );
      expect(items.map((item) => item.type)).toEqual([
        "divider",
        "message",
        "divider",
        "message",
      ]);
    });

    it("throws a RangeError for a zone it does not know", () => {
      expect(() =>
        groupChatMessages([{ author: "Sam", time: 0 }], {
          timeZone: "Mars/Olympus",
        }),
      ).toThrow(RangeError);
    });
  });
});
