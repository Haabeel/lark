import { Skeleton } from "@/components/ui/skeleton";

const MessageListSkeleton = ({
  count = 5, // Number of skeleton message groups to show
  isDM = false, // To conditionally render the channel intro
}: {
  count?: number;
  isDM?: boolean;
  channelName?: string;
}) => {
  const renderSkeletonMessageGroup = (
    isFirstInList: boolean,
    groupCount: number,
  ) => {
    const messagesInGroup = [];
    for (let i = 0; i < groupCount; i++) {
      const showAvatarAndName = i === 0; // Only first message in a group shows avatar/name

      messagesInGroup.push(
        <div
          key={`skeleton-msg-${i}`}
          className={`group relative flex items-start ${showAvatarAndName ? "px-4" : "px-0"} py-0.5`}
        >
          {/* Avatar Column Skeleton */}
          <div className={`mr-3 ${!showAvatarAndName && "self-center"} pt-0.5`}>
            {!showAvatarAndName && (
              <div className="ml-5 h-[11px] w-10 rounded-sm bg-transparent" /> // Placeholder for timestamp width
            )}
            {showAvatarAndName && <Skeleton className="size-11 rounded-sm" />}
          </div>

          {/* Message Content Column Skeleton */}
          <div className="flex-grow">
            {showAvatarAndName && (
              <div className={`flex items-baseline space-x-2`}>
                <Skeleton className="h-4 w-24 rounded-md" /> {/* Sender Name */}
                <Skeleton className="h-3 w-12 rounded-md" /> {/* Timestamp */}
              </div>
            )}
            <div className={`mt-1 flex items-center justify-between`}>
              <Skeleton
                className={`h-4 ${i === 0 ? "w-4/5" : "w-3/5"} rounded-md`}
              />{" "}
              {/* Message Content Line 1 */}
            </div>
            {/* Optionally add a second line for longer messages in skeleton */}
            {i === 0 && groupCount > 1 && (
              <Skeleton className="mt-1 h-4 w-1/2 rounded-md" /> // Message Content Line 2
            )}
          </div>
        </div>,
      );
    }
    return (
      <div className={`${isFirstInList ? "mt-4" : "mt-0.5"}`}>
        {/* No date separator in skeleton for simplicity, or add a skeleton line */}
        {messagesInGroup}
      </div>
    );
  };

  const skeletonGroups = [];
  // Create varied group sizes for a more realistic skeleton
  const groupSizes = [2, 1, 3, 1, 2]; // Example pattern
  for (let i = 0; i < count; i++) {
    skeletonGroups.push(
      renderSkeletonMessageGroup(
        i === 0,
        groupSizes[i % groupSizes.length] ?? 1,
      ),
    );
  }

  return (
    <div className="h-full w-full animate-pulse bg-transparent p-0">
      {/* Channel Intro Skeleton (optional, matches your MessageList structure) */}
      {!isDM && (
        <div className="flex flex-col gap-2 px-8 pb-8 pt-52">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded" />{" "}
            {/* Hash icon placeholder */}
            <Skeleton className="h-7 w-40 rounded-md" />{" "}
            {/* Channel name placeholder */}
          </div>
          <Skeleton className="mt-1 h-4 w-3/4 rounded-md" />{" "}
          {/* Description line 1 */}
          <Skeleton className="mt-1 h-4 w-1/2 rounded-md" />{" "}
          {/* Description line 2 */}
        </div>
      )}
      {isDM && ( // Minimal intro for DMs, adjust as needed
        <div className="flex flex-col gap-2 px-8 pb-8 pt-52">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />{" "}
            {/* DM Avatar placeholder */}
            <Skeleton className="h-7 w-32 rounded-md" />{" "}
            {/* DM name placeholder */}
          </div>
        </div>
      )}

      <div className="flex flex-col px-4">
        {" "}
        {/* Added px-4 to match messages padding */}
        {skeletonGroups}
      </div>
    </div>
  );
};

export default MessageListSkeleton;
