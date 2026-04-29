export type PublicHoliday = {
  date: string;
  country: "TR" | "IT";
  name: string;
  scope: "national" | "local" | "half-day";
};

export const publicHolidays2026: PublicHoliday[] = [
  { date: "2026-01-01", country: "TR", name: "New Year's Day", scope: "national" },
  { date: "2026-03-19", country: "TR", name: "Ramadan Feast Eve", scope: "half-day" },
  { date: "2026-03-20", country: "TR", name: "Ramadan Feast", scope: "national" },
  { date: "2026-03-21", country: "TR", name: "Ramadan Feast", scope: "national" },
  { date: "2026-03-22", country: "TR", name: "Ramadan Feast", scope: "national" },
  {
    date: "2026-04-23",
    country: "TR",
    name: "National Sovereignty and Children's Day",
    scope: "national",
  },
  { date: "2026-05-01", country: "TR", name: "Labor and Solidarity Day", scope: "national" },
  {
    date: "2026-05-19",
    country: "TR",
    name: "Commemoration of Ataturk, Youth and Sports Day",
    scope: "national",
  },
  { date: "2026-05-26", country: "TR", name: "Sacrifice Feast Eve", scope: "half-day" },
  { date: "2026-05-27", country: "TR", name: "Sacrifice Feast", scope: "national" },
  { date: "2026-05-28", country: "TR", name: "Sacrifice Feast", scope: "national" },
  { date: "2026-05-29", country: "TR", name: "Sacrifice Feast", scope: "national" },
  { date: "2026-05-30", country: "TR", name: "Sacrifice Feast", scope: "national" },
  {
    date: "2026-07-15",
    country: "TR",
    name: "Democracy and National Unity Day",
    scope: "national",
  },
  { date: "2026-08-30", country: "TR", name: "Victory Day", scope: "national" },
  { date: "2026-10-28", country: "TR", name: "Republic Day Eve", scope: "half-day" },
  { date: "2026-10-29", country: "TR", name: "Republic Day", scope: "national" },
  { date: "2026-01-01", country: "IT", name: "New Year's Day", scope: "national" },
  { date: "2026-01-06", country: "IT", name: "Epiphany", scope: "national" },
  { date: "2026-04-05", country: "IT", name: "Easter Sunday", scope: "national" },
  { date: "2026-04-06", country: "IT", name: "Easter Monday", scope: "national" },
  { date: "2026-04-25", country: "IT", name: "Liberation Day", scope: "national" },
  { date: "2026-05-01", country: "IT", name: "Labor Day", scope: "national" },
  { date: "2026-06-02", country: "IT", name: "Republic Day", scope: "national" },
  { date: "2026-06-24", country: "IT", name: "St. John Feast", scope: "local" },
  { date: "2026-06-29", country: "IT", name: "St. Peter and St. Paul Feast", scope: "local" },
  { date: "2026-08-15", country: "IT", name: "Assumption Day", scope: "national" },
  { date: "2026-11-01", country: "IT", name: "All Saints' Day", scope: "national" },
  { date: "2026-12-07", country: "IT", name: "St. Ambrose Feast", scope: "local" },
  {
    date: "2026-12-08",
    country: "IT",
    name: "Immaculate Conception",
    scope: "national",
  },
  { date: "2026-12-25", country: "IT", name: "Christmas Day", scope: "national" },
  { date: "2026-12-26", country: "IT", name: "St. Stephen's Day", scope: "national" },
];

export function listPublicHolidaysForMonth(month: string): PublicHoliday[] {
  return publicHolidays2026.filter((holiday) => holiday.date.startsWith(`${month}-`));
}
