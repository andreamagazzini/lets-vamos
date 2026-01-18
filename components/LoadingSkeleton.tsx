// Loading skeleton components for better UX

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6 md:p-12">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        </div>

        {/* Chart skeleton */}
        <div className="h-64 bg-gray-200 rounded-2xl mb-6 animate-pulse" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card-modern">
      <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="w-full max-w-lg card-modern animate-fade-in">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
      <div className="space-y-6">
        <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse" />
        <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse" />
        <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse" />
        <div className="h-12 w-32 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export function ButtonSkeleton() {
  return <div className="h-12 w-32 bg-gray-200 rounded-full animate-pulse" />;
}
