export function errorDetailMessage(error: unknown, fallback: string): string {
  let detail: unknown;
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    (error as { response?: { data?: { detail?: unknown } } }).response?.data
  ) {
    detail = (error as { response: { data: { detail?: unknown } } }).response.data.detail;
  }

  if (Array.isArray(detail)) {
    const msgs = detail
      .map((item) =>
        item && typeof item === "object" && "msg" in item
          ? String((item as { msg: unknown }).msg)
          : String(item)
      )
      .filter(Boolean);
    return msgs.join(" · ");
  }

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  return fallback;
}
