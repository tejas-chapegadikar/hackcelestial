import {
  Landmark,
  SquareParking,
  Car,
  ChefHat,
  Armchair,
  Presentation,
  Package,
  type LucideIcon,
} from "lucide-react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Inclusive day count between two dates, minimum 1. */
export function daysBetween(start: Date | string, end: Date | string) {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const ms = e.getTime() - s.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Haversine distance in km between two lat/lng points. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  BANQUET_SPACE: "Banquet Space",
  PARKING: "Parking",
  VEHICLE: "Vehicle",
  KITCHEN: "Kitchen Capacity",
  FURNITURE: "Furniture",
  AV_EQUIPMENT: "AV Equipment",
  OTHER: "Other",
};

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  HOTEL: "Hotel",
  RESTAURANT: "Restaurant",
  CATERER: "Caterer",
  BANQUET_VENUE: "Banquet Venue",
  RESORT: "Resort",
  EVENT_ORGANIZER: "Event Organizer",
  OTHER: "Other",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  COUNTERED: "Countered",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export type TypeStyle = {
  icon: LucideIcon;
  chip: string;
  bg: string;
  text: string;
  bar: string;
};

/** One accent color per resource type — the through-line of color in an otherwise neutral UI. */
export const RESOURCE_TYPE_STYLES: Record<string, TypeStyle> = {
  BANQUET_SPACE: {
    icon: Landmark,
    chip: "bg-amber-50 text-amber-700",
    bg: "bg-amber-50",
    text: "text-amber-600",
    bar: "bg-amber-500",
  },
  PARKING: {
    icon: SquareParking,
    chip: "bg-stone-100 text-stone-700",
    bg: "bg-stone-100",
    text: "text-stone-600",
    bar: "bg-stone-500",
  },
  VEHICLE: {
    icon: Car,
    chip: "bg-orange-50 text-orange-700",
    bg: "bg-orange-50",
    text: "text-orange-600",
    bar: "bg-orange-500",
  },
  KITCHEN: {
    icon: ChefHat,
    chip: "bg-yellow-50 text-yellow-700",
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    bar: "bg-yellow-500",
  },
  FURNITURE: {
    icon: Armchair,
    chip: "bg-emerald-50 text-emerald-700",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    bar: "bg-emerald-500",
  },
  AV_EQUIPMENT: {
    icon: Presentation,
    chip: "bg-lime-50 text-lime-700",
    bg: "bg-lime-50",
    text: "text-lime-600",
    bar: "bg-lime-500",
  },
  OTHER: {
    icon: Package,
    chip: "bg-gray-100 text-gray-700",
    bg: "bg-gray-100",
    text: "text-gray-500",
    bar: "bg-gray-500",
  },
};

export function resourceTypeStyle(type: string): TypeStyle {
  return RESOURCE_TYPE_STYLES[type] ?? RESOURCE_TYPE_STYLES.OTHER;
}

/** Deterministic initials-avatar background, keyed off the business id. */
const AVATAR_COLORS = [
  "bg-gradient-to-br from-teal-500 to-emerald-600",
  "bg-gradient-to-br from-amber-500 to-orange-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-orange-500 to-amber-700",
  "bg-gradient-to-br from-lime-500 to-emerald-600",
  "bg-gradient-to-br from-stone-500 to-stone-700",
  "bg-gradient-to-br from-yellow-500 to-amber-600",
];

export function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}
