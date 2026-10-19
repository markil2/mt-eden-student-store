/** Wall-clock time in a given IANA time zone (the school's), regardless of where the code runs. */
export function zonedNow(timeZone: string, now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    hours: Number(get("hour")),
    minutes: Number(get("minute")),
    /** YYYY-MM-DD in that time zone */
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}
