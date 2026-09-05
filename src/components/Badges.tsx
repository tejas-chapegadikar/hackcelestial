import { AlertTriangle, Check, Clock, Star, Zap } from "lucide-react";
import { cn, REQUEST_STATUS_LABELS, RESOURCE_TYPE_LABELS, resourceTypeStyle } from "@/lib/utils";

export function UrgentBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
      <Zap className="w-3 h-3 fill-red-600" strokeWidth={0} />
      Urgent
    </span>
  );
}

export function RequestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    COUNTERED: "bg-orange-50 text-orange-700 border-orange-100",
    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    REJECTED: "bg-red-50 text-red-700 border-red-100",
    CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
    COMPLETED: "bg-teal-600 text-white border-teal-600",
  };
  return (
    <span
      className={cn(
        "inline-block text-xs font-semibold px-2.5 py-1 rounded-full border",
        styles[status] ?? "bg-gray-100 text-gray-600 border-gray-200"
      )}
    >
      {REQUEST_STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Small colored pill for a resource type — the through-line of color in an otherwise neutral UI. */
export function TypeChip({ type }: { type: string }) {
  const style = resourceTypeStyle(type);
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", style.chip)}>
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      {RESOURCE_TYPE_LABELS[type] ?? type}
    </span>
  );
}

/** Rounded square icon tile for a resource type, used as a leading visual in cards/rows. */
export function TypeIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const style = resourceTypeStyle(type);
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl shrink-0",
        style.bg,
        size === "sm" ? "w-8 h-8" : "w-10 h-10"
      )}
    >
      <Icon className={cn(style.text, size === "sm" ? "w-4 h-4" : "w-5 h-5")} strokeWidth={2} />
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
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
        <Check className="w-3 h-3" strokeWidth={3} />
        Compatible
      </span>
    );
  }
  return (
    <span
      title={reasons.join("; ")}
      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full"
    >
      <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
      {reasons[0]}
    </span>
  );
}

export function MinRentalBadge({ ok, reason }: { ok: boolean; reason?: string }) {
  if (ok) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" strokeWidth={2.5} />
      {reason}
    </span>
  );
}

export function StarRating({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" title={`${value.toFixed(1)} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < rounded ? "w-3.5 h-3.5 fill-amber-400 text-amber-400" : "w-3.5 h-3.5 fill-gray-200 text-gray-200"}
        />
      ))}
    </span>
  );
}
