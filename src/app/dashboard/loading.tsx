import { GridSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
  return <GridSkeleton cards={4} cols="sm:grid-cols-2 lg:grid-cols-4" />;
}
