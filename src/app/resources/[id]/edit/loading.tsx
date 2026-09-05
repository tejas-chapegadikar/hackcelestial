export default function Loading() {
  return (
    <div className="max-w-lg space-y-4 animate-pulse">
      <div className="h-7 w-40 bg-gray-200 rounded-lg mb-2" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-10 bg-white border border-gray-200/80 rounded-lg" />
      ))}
    </div>
  );
}
