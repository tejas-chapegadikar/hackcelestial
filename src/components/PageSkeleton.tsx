export function GridSkeleton({ cards = 6, cols = "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }: { cards?: number; cols?: string }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-gray-200 rounded-lg" />
        <div className="h-9 w-32 bg-gray-200 rounded-xl" />
      </div>
      <div className={`grid ${cols} gap-4`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="h-36 bg-white border border-gray-200/80 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-7 w-64 bg-gray-200 rounded-lg" />
        <div className="h-4 w-40 bg-gray-100 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white border border-gray-200/80 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="h-64 bg-white border border-gray-200/80 rounded-2xl" />
    </div>
  );
}
