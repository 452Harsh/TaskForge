import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3 w-full max-w-md">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-10 w-36 shrink-0" />
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col rounded-xl bg-gray-100/50 p-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <div className="flex-1 overflow-hidden space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
