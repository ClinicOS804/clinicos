export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-3 w-24 mb-3 rounded" />
            <div className="skeleton h-8 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card">
            <div className="card-header"><div className="skeleton h-4 w-36 rounded" /></div>
            <div className="card-body space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex gap-3 items-center">
                  <div className="skeleton w-9 h-9 rounded-[10px]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
