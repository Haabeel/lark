import { TaskStatus } from "@prisma/client";

import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import CreateTasksDialog from "./create-tasks-dialog";

interface KanbanColumnHeaderProps {
  board: TaskStatus;
  taskCount: number;
}

const statusIconMap: Record<TaskStatus, React.ReactNode> = {
  [TaskStatus.BACKLOG]: (
    <CircleDashedIcon className="size-[18px] text-pink-400" />
  ),
  [TaskStatus.TODO]: <CircleIcon className="size-[18px] text-blue-400" />,
  [TaskStatus.IN_PROGRESS]: (
    <CircleDotDashedIcon className="size-[18px] text-yellow-400" />
  ),
  [TaskStatus.DONE]: <CircleCheckIcon className="size-[18px] text-green-400" />,
};

const KanbanColumnHeader = ({ taskCount, board }: KanbanColumnHeaderProps) => {
  const icon = statusIconMap[board];
  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <div className="flex items-center gap-x-2">
        {icon}
        <h2 className="text-sm font-medium">{board}</h2>
        <div className="flex size-5 items-center justify-center rounded-md bg-neutral-200 text-xs font-medium text-neutral-700">
          {taskCount}
        </div>
      </div>
      <CreateTasksDialog view="kanban" status={board} />
    </div>
  );
};

export default KanbanColumnHeader;
