// =========================================================
// DATE / TIME UTILITIES
// Dates are stored as strings ("YYYY-MM-DD" / "HH:MM") so they
// survive JSON serialization and compare correctly as strings.
// =========================================================

function pad(n) {
  return String(n).padStart(2, "0");
}

// Date -> "YYYY-MM-DD". Built from local parts rather than
// toISOString(), which converts to UTC and can shift the day.
export function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getTodayString() {
  return toDateString(new Date());
}

export function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr) return null;
  return new Date(`${dateStr}T${timeStr || "00:00"}`);
}

export function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// "3d 4h 12min left" / "2h 5min left" / "1y 2mo left"
export function formatRemaining(targetDate, now) {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) return "Time's up";

  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays >= 365) {
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    return `${years}y ${months}mo left`;
  }
  if (totalDays >= 1) {
    return `${totalDays}d ${totalHours % 24}h ${totalMinutes % 60}min left`;
  }
  if (totalHours >= 1) {
    return `${totalHours}h ${totalMinutes % 60}min left`;
  }
  return `${totalMinutes}min left`;
}

// strips a leading "#" so "#work" and "work" are treated the same
export function normalizeTag(rawTag) {
  return rawTag.trim().replace(/^#/, "");
}

// keeps ONLY emoji characters, discarding letters/numbers/symbols.
// \p{Extended_Pictographic} matches emoji; the trailing group keeps
// multi-part emoji intact (skin tones, flags, 👨‍💻-style ZWJ sequences)
// which would otherwise be split into pieces.
export function filterEmojiOnly(input, maxEmoji = 2) {
  const matches = input.match(
    /\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*/gu
  );
  return matches ? matches.slice(0, maxEmoji).join("") : "";
}