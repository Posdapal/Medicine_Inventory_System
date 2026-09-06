/**
 * Formats a date string (ISO, Date object, etc.) to YYYY-MM-DD.
 * Handles undefined, null, invalid dates, and ISO timestamps like "2026-09-07T00:00:00.000Z".
 */
export function formatDate(val) {
  if (!val) return "—";
  if (typeof val === "string") {
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // If it's an ISO timestamp with 'T' (e.g. 2026-09-07T00:00:00.000Z)
    if (val.includes("T")) {
      return val.split("T")[0];
    }
  }

  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return String(val);
  }
}

/**
 * Formats a timestamp to YYYY-MM-DD HH:mm
 */
export function formatDateTime(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return String(val);
  }
}
