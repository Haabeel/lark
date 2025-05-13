/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CalendarSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {/* Header: Month navigation */}
      <div className="flex items-center gap-x-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="flex h-8 items-center justify-center rounded-md border border-input px-3 py-2">
          <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* Calendar grid: 7 columns (days), 5-6 rows (weeks) */}
      <div className="grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-full" />
        ))}
        {[...Array(42)].map((_, i) => (
          <div key={`day-${i}`} className="flex flex-col gap-1 p-2">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarSkeleton;
