export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl animate-pulse">
      <div className="h-7 w-56 bg-gray-200 rounded-lg" />
      <div className="h-4 w-40 bg-gray-100 rounded" />
      <div className="h-32 bg-white border border-gray-200/80 rounded-2xl" />
    </div>
  );
}
