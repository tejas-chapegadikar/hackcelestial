import { cn, REQUEST_STATUS_LABELS, RESOURCE_TYPE_LABELS, resourceTypeStyle } from "@/lib/utils";

export function UrgentBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      🔴 Urgent
    </span>
  );
}

export function RequestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    COUNTERED: "bg-blue-50 text-blue-700 border-blue-200",
    ACCEPTED: "bg-green-50 text-green-700 border-green-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
    COMPLETED: "bg-gray-900 text-white border-gray-900",
  };
  return (
    <span
      className={cn(
        "inline-block text-xs font-semibold px-2 py-0.5 rounded-full border",
        styles[status] ?? "bg-gray-100 text-gray-600 border-gray-200"
      )}
    >
      {REQUEST_STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Small colored pill for a resource type — the one spot of color per type across an otherwise neutral UI. */
export function TypeChip({ type }: { type: string }) {
  const style = resourceTypeStyle(type);
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", style.chip)}>
      <span>{style.icon}</span>
      {RESOURCE_TYPE_LABELS[type] ?? type}
    </span>
  );
}

/** Rounded square icon tile for a resource type, used as a leading visual in cards/rows. */
export function TypeIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const style = resourceTypeStyle(type);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg shrink-0",
        style.iconBg,
        size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base"
      )}
    >
      {style.icon}
    </span>
  );
}

export function CompatibilityBadge({
  compatible,
  reasons,
}: {
  compatible: boolean;
  reasons: string[];
}) {
  if (compatible) {
    return (
      <span className="inline-block text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        ✓ Compatible
      </span>
    );
  }
  return (
    <span
      title={reasons.join("; ")}
      className="inline-block text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"
    >
      ⚠ {reasons[0]}
    </span>
  );
}

export function MinRentalBadge({ ok, reason }: { ok: boolean; reason?: string }) {
  if (ok) return null;
  return (
    <span className="inline-block text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
      ⏱ {reason}
    </span>
  );
}

export function StarRating({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="text-amber-500 text-sm" title={`${value.toFixed(1)} / 5`}>
      {"★".repeat(rounded)}
      {"☆".repeat(5 - rounded)}
    </span>
  );
}
