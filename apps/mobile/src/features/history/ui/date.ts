export type CalendarCell = { date: Date; key: string; inMonth: boolean };

export const toKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const firstDayOfMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), 1);

export const buildMonthMatrix = (monthFirst: Date): CalendarCell[] => {
  const year = monthFirst.getFullYear();
  const month = monthFirst.getMonth();
  const firstOfMonth = new Date(year, month, 1);

  const firstDay = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const offset = (firstDay + 6) % 7; // Monday=0
  const start = new Date(year, month, 1 - offset);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, key: toKey(d), inMonth: d.getMonth() === month });
  }
  return cells;
};

export const startOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

export const addDaysLocal = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

export const minutesBetween = (start: Date | null, end: Date | null) => {
  if (!start || !end) return 0;
  const ms = Math.max(0, end.getTime() - start.getTime());
  return Math.round(ms / 60000);
};

export const formatDuration = (mins: number) => {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};
