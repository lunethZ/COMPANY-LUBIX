export const formatCOP = (value: number) =>
  "$" + Number(value || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });

export const formatDate = (iso: string | undefined) => {
  if (!iso) return "-";
  const date = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};