// Reads ExcelJS cell values into plain text, dates and numbers.

// A cell's value as trimmed text. Excel turns typed emails into hyperlinks
// and formulas keep their result, so both are unwrapped.
export function cellText(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (Array.isArray(value.richText)) {
      return value.richText
        .map((part) => part.text)
        .join("")
        .trim();
    }
    if ("text" in value) return cellText(value.text);
    if ("result" in value) return cellText(value.result);
    if ("error" in value) return "";
    return "";
  }
  return String(value).trim();
}

const unwrap = (value) =>
  value && typeof value === "object" && "result" in value
    ? value.result
    : value;

const pad = (n) => String(n).padStart(2, "0");

function isRealDate(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

const DATE_ERROR =
  "Enter a date: a cell formatted as a date, or text as YYYY-MM-DD (e.g. 2024-03-15)";

// A date as "YYYY-MM-DD", or "YYYY-MM-DD HH:MM" when it has a time. Excel
// date cells arrive as UTC Dates holding the wall-clock value typed, so
// their UTC parts are the calendar date (no time zone is applied). Text
// must be ISO: 03/04/2024 could be either 3 April or 4 March.
export function cellDate(raw, { allowTime = false } = {}) {
  let value = unwrap(raw);
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return { error: DATE_ERROR };
    // Serials carry float error (e.g. 09:29:59.999), so round to the minute
    value = new Date(Math.round(value.getTime() / 60000) * 60000);
    const date = `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
    const hours = value.getUTCHours();
    const minutes = value.getUTCMinutes();
    if (hours === 0 && minutes === 0) return { value: date };
    if (!allowTime) return { error: "Enter a date without a time" };
    return { value: `${date} ${pad(hours)}:${pad(minutes)}` };
  }

  const text = cellText(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(text);
  if (!match) return { error: DATE_ERROR };
  const [, y, m, d, hh, mm] = match;
  if (!isRealDate(Number(y), Number(m), Number(d))) {
    return { error: `${text} isn't a real date` };
  }
  if (hh === undefined) return { value: `${y}-${m}-${d}` };
  if (!allowTime) return { error: "Enter a date without a time" };
  if (Number(hh) > 23 || Number(mm) > 59) {
    return { error: `${text} isn't a real time` };
  }
  return { value: `${y}-${m}-${d} ${hh}:${mm}` };
}

// A number from a number cell, or from text such as "50,000"
export function cellNumber(raw) {
  const value = unwrap(raw);
  if (typeof value === "number") {
    return Number.isFinite(value) ? { value } : { error: "Enter a number" };
  }
  const text = cellText(value).replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(text)) return { error: "Enter a number" };
  return { value: Number(text) };
}

// Today's date in Africa/Nairobi, as YYYY-MM-DD
export function nairobiToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());
}
